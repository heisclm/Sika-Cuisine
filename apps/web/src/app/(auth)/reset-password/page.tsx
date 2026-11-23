import React from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; invited?: string }>;
}) {
  const params = await searchParams;
  const token = typeof params?.token === "string" ? params.token.trim() : "";
  const isInvited = params?.invited === "1";

  return <ResetPasswordForm initialToken={token} isInvited={isInvited} />;
}
