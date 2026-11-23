import * as crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { verifySameOriginMutation } from "@/lib/auth/csrf";
import { getAuthUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Verifies real binary magic bytes so spoofed Content-Type headers cannot bypass image validation.
 */
function hasValidImageMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) return false;
  if (mimeType === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }
  if (mimeType === "image/webp") {
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  return false;
}

/**
 * POST /api/v1/admin/uploads
 * Uploads validated menu photography to Supabase Storage when configured, falling back to
 * local `public/images/uploads/` for local development environments.
 */
export async function POST(req: NextRequest) {
  try {
    if (!verifySameOriginMutation(req)) {
      return NextResponse.json(
        { success: false, error: "Cross-origin request rejected." },
        { status: 403 }
      );
    }

    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Admin role required to upload menu photography." },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "An image file (`file`) is required." },
        { status: 400 }
      );
    }

    const ext = MIME_TO_EXTENSION[file.type];
    if (!ext) {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported image format. Upload a JPEG, PNG, or WebP file.",
        },
        { status: 400 }
      );
    }

    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: "Image size must be between 1 byte and 4 MB.",
        },
        { status: 400 }
      );
    }

    const filename = `dish-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    if (!hasValidImageMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "File contents do not match a valid JPEG, PNG, or WebP image.",
        },
        { status: 400 }
      );
    }

    const rawSupabaseUrl = process.env.SUPABASE_URL?.trim();
    const supabaseKey = (
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      ""
    ).trim();

    if (rawSupabaseUrl && supabaseKey) {
      const cleanSupabaseUrl = rawSupabaseUrl.replace(/\/+$/, "");
      const bucket = encodeURIComponent(
        process.env.SUPABASE_STORAGE_BUCKET?.trim() || "menu-images"
      );
      const objectPath = `dishes/${filename}`;
      const uploadUrl = `${cleanSupabaseUrl}/storage/v1/object/${bucket}/${objectPath}`;

      const uploadHeaders: Record<string, string> = {
        apikey: supabaseKey,
        "Content-Type": file.type,
        "x-upsert": "true",
      };
      if (!supabaseKey.startsWith("sb_secret_")) {
        uploadHeaders.Authorization = `Bearer ${supabaseKey}`;
      }

      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: uploadHeaders,
        body: buffer,
        cache: "no-store",
      });

      if (!uploadRes.ok) {
        const errPayload = await uploadRes.json().catch(() => null);
        const reason =
          errPayload?.message || errPayload?.error || `HTTP ${uploadRes.status}`;
        return NextResponse.json(
          {
            success: false,
            error: `Cloud image upload failed (${reason}). Verify bucket "${decodeURIComponent(bucket)}" exists and is public.`,
          },
          { status: 502 }
        );
      }

      const publicUrl = `${cleanSupabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`;

      await recordAuditLog({
        userId: user.id,
        action: "MENU_IMAGE_UPLOADED",
        entityType: "Media",
        entityId: filename,
        metadata: {
          storage: "supabase",
          mimeType: file.type,
          sizeBytes: file.size,
          imageUrl: publicUrl,
        },
        req,
      });

      return NextResponse.json(
        { success: true, storage: "supabase", imageUrl: publicUrl },
        { status: 201 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "public", "images", "uploads");
    const targetPath = path.join(uploadsDir, filename);

    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.writeFile(targetPath, buffer);
    } catch (fsError: any) {
      if (fsError?.code === "EROFS" || fsError?.code === "EACCES") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Local storage is read-only in this deployment. Configure SUPABASE_URL and SUPABASE_SECRET_KEY or paste an HTTPS image URL.",
          },
          { status: 501 }
        );
      }
      throw fsError;
    }

    const imageUrl = `/images/uploads/${filename}`;

    await recordAuditLog({
      userId: user.id,
      action: "MENU_IMAGE_UPLOADED",
      entityType: "Media",
      entityId: filename,
      metadata: {
        storage: "local",
        mimeType: file.type,
        sizeBytes: file.size,
        imageUrl,
      },
      req,
    });

    return NextResponse.json(
      { success: true, storage: "local", imageUrl },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API v1 Admin Upload Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload image." },
      { status: 500 }
    );
  }
}
