"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bike,
  Check,
  Copy,
  Edit3,
  KeyRound,
  Mail,
  MessageCircle,
  Phone,
  Send,
  ShieldAlert,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/context/ToastContext";

type StaffRole = "ADMIN" | "STAFF_CASHIER" | "STAFF_KITCHEN" | "DELIVERY_RIDER";

export interface AdminStaffMember {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: StaffRole;
  isActive: boolean;
  createdAt: string;
  _count?: {
    deliveries: number;
  };
}

const ROLE_OPTIONS: Array<{ value: StaffRole; label: string; description: string }> = [
  {
    value: "STAFF_KITCHEN",
    label: "Kitchen Staff",
    description: "Receives and prepares kitchen orders",
  },
  {
    value: "STAFF_CASHIER",
    label: "Cashier",
    description: "Confirms payments, pickup handovers & dispatch",
  },
  {
    value: "DELIVERY_RIDER",
    label: "Delivery Rider",
    description: "Handles Sunyani doorstep delivery drops",
  },
  {
    value: "ADMIN",
    label: "Administrator",
    description: "Full access to operations, menu, settings & team",
  },
];

const ROLE_FILTER_TABS: Array<{ id: "ALL" | StaffRole; label: string }> = [
  { id: "ALL", label: "All Team" },
  { id: "ADMIN", label: "Admins" },
  { id: "STAFF_KITCHEN", label: "Kitchen" },
  { id: "STAFF_CASHIER", label: "Cashiers" },
  { id: "DELIVERY_RIDER", label: "Riders" },
];

function formatRoleLabel(role: StaffRole): string {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "STAFF_KITCHEN":
      return "Kitchen";
    case "STAFF_CASHIER":
      return "Cashier";
    case "DELIVERY_RIDER":
      return "Rider";
    default:
      return role;
  }
}

interface AdminStaffPanelProps {
  onTeamChanged?: () => Promise<void> | void;
}

export function AdminStaffPanel({ onTeamChanged }: AdminStaffPanelProps) {
  const { success, error: toastError } = useToast();

  const [staff, setStaff] = useState<AdminStaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [roleFilter, setRoleFilter] = useState<"ALL" | StaffRole>("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<AdminStaffMember | null>(null);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<StaffRole>("DELIVERY_RIDER");
  const [password, setPassword] = useState("");
  const [sendInviteMode, setSendInviteMode] = useState(true);

  const [pendingSuspend, setPendingSuspend] = useState<AdminStaffMember | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [activeSetupBanner, setActiveSetupBanner] = useState<{
    fullName: string;
    role: StaffRole;
    phone: string;
    setupLink: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setForbidden(false);
    try {
      const res = await fetch("/api/v1/admin/staff", { cache: "no-store" });
      if (res.status === 403 || res.status === 401) {
        setForbidden(true);
        setStaff([]);
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.success) {
        toastError("Load Failed", data.error || "Unable to load team accounts.");
        return;
      }
      setStaff(data.staff ?? []);
    } catch {
      toastError("Network Error", "Could not retrieve staff directory.");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const filteredStaff = useMemo(() => {
    if (roleFilter === "ALL") return staff;
    return staff.filter((member) => member.role === roleFilter);
  }, [staff, roleFilter]);

  const openCreateModal = () => {
    setEditingMember(null);
    setFullName("");
    setEmail("");
    setPhone("");
    setRole("DELIVERY_RIDER");
    setPassword("");
    setSendInviteMode(true);
    setModalOpen(true);
  };

  const openEditModal = (member: AdminStaffMember) => {
    setEditingMember(member);
    setFullName(member.fullName);
    setEmail(member.email);
    setPhone(member.phone);
    setRole(member.role);
    setPassword("");
    setModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (fullName.trim().length < 2) {
      toastError("Validation Error", "Full name must be at least 2 characters.");
      return;
    }
    if (!editingMember && (!email.trim() || !email.includes("@"))) {
      toastError("Validation Error", "Valid email address is required.");
      return;
    }
    if (phone.replace(/\s+/g, "").length < 9) {
      toastError("Validation Error", "Valid Ghanaian mobile number is required.");
      return;
    }
    if (!editingMember && !sendInviteMode && password.length < 8) {
      toastError("Validation Error", "Initial password must be at least 8 characters.");
      return;
    }
    if (editingMember && password.length > 0 && password.length < 8) {
      toastError("Validation Error", "New password must be at least 8 characters.");
      return;
    }

    setSaving(true);
    try {
      const endpoint = editingMember
        ? `/api/v1/admin/staff/${editingMember.id}`
        : "/api/v1/admin/staff";
      const method = editingMember ? "PATCH" : "POST";

      const payload: Record<string, unknown> = editingMember
        ? {
            fullName: fullName.trim(),
            phone: phone.replace(/\s+/g, "").trim(),
            role,
            ...(password.length > 0 ? { newPassword: password } : {}),
          }
        : {
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.replace(/\s+/g, "").trim(),
            role,
            sendInvite: sendInviteMode,
            ...(!sendInviteMode ? { password } : {}),
          };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toastError("Save Failed", data.error || "Unable to save team member.");
        return;
      }

      setModalOpen(false);
      if (data.setupLink) {
        setCopiedLink(false);
        setActiveSetupBanner({
          fullName: fullName.trim(),
          role,
          phone: phone.replace(/\s+/g, "").trim(),
          setupLink: data.setupLink,
        });
      }
      success(
        editingMember ? "Team Account Updated" : "Team Account Created",
        data.setupLink
          ? `${fullName.trim()} created — 24h setup link ready to share.`
          : `${fullName.trim()} (${formatRoleLabel(role)}) saved.`
      );
      await loadStaff();
      await onTeamChanged?.();
    } catch {
      toastError("Network Error", "Could not save team member.");
    } finally {
      setSaving(false);
    }
  };

  const handleSendInvite = async (member: AdminStaffMember) => {
    setInvitingId(member.id);
    try {
      const res = await fetch(`/api/v1/admin/staff/${member.id}/invite`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toastError("Invite Failed", data.error || "Unable to generate invite link.");
        return;
      }
      if (data.setupLink) {
        setCopiedLink(false);
        setActiveSetupBanner({
          fullName: member.fullName,
          role: member.role,
          phone: member.phone,
          setupLink: data.setupLink,
        });
      }
      success("Invite Link Ready", `24-hour password setup link issued for ${member.fullName}.`);
    } catch {
      toastError("Network Error", "Could not issue invite link.");
    } finally {
      setInvitingId(null);
    }
  };

  const handleCopySetupLink = async () => {
    if (!activeSetupBanner?.setupLink) return;
    try {
      await navigator.clipboard.writeText(activeSetupBanner.setupLink);
      setCopiedLink(true);
      success("Copied", "24-hour setup link copied to clipboard.");
    } catch {
      toastError("Copy Blocked", "Select and copy the setup URL manually.");
    }
  };

  const buildWhatsAppInviteUrl = (banner: {
    fullName: string;
    role: StaffRole;
    phone: string;
    setupLink: string;
  }) => {
    const digits = banner.phone.replace(/[^\d]/g, "");
    const intl =
      digits.startsWith("233") && digits.length >= 12
        ? digits
        : digits.startsWith("0") && digits.length === 10
        ? `233${digits.slice(1)}`
        : digits;
    const msg = `Hello ${banner.fullName}, your Sika Cuisine ${formatRoleLabel(
      banner.role
    )} account is ready. Set your private password within 24 hours: ${banner.setupLink}`;
    return `https://wa.me/${intl}?text=${encodeURIComponent(msg)}`;
  };

  const executeSetActive = async (member: AdminStaffMember, nextActive: boolean) => {
    setTogglingId(member.id);
    try {
      const res = await fetch(`/api/v1/admin/staff/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toastError("Action Blocked", data.error || "Unable to update account status.");
        return;
      }

      success(
        nextActive ? "Account Reactivated" : "Account Suspended",
        `${member.fullName} is now ${nextActive ? "active" : "suspended"}.`
      );
      await loadStaff();
      await onTeamChanged?.();
    } catch {
      toastError("Network Error", "Could not update team account status.");
    } finally {
      setTogglingId(null);
      setPendingSuspend(null);
    }
  };

  if (forbidden) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Administrator Access Required"
        description="Only users with the ADMIN role can view, create, reset, or suspend staff and delivery rider accounts."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Pills + Add CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex overflow-x-auto scrollbar-none pb-1 md:pb-0 sm:flex-wrap gap-2">
          {ROLE_FILTER_TABS.map((tab) => {
            const active = roleFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors border whitespace-nowrap shrink-0 ${
                  active
                    ? "border-[#D71920] bg-[#D71920] text-white"
                    : "border-[#333333] bg-[#1C1C1C] text-[#A3A3A3] hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <Button
          variant="primary"
          size="md"
          className="w-full md:w-auto"
          onClick={openCreateModal}
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          <span>Add Staff / Rider</span>
        </Button>
      </div>

      {/* Generated 24h Invite Setup Banner */}
      {activeSetupBanner && (
        <div className="rounded-2xl border border-[#22C55E]/40 bg-[#22C55E]/10 p-4 sm:p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-block font-mono text-[10px] font-bold uppercase tracking-wider text-[#4ADE80]">
                24-Hour Private Setup Link Ready
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                {activeSetupBanner.fullName} ({formatRoleLabel(activeSetupBanner.role)})
              </h3>
              <p className="text-xs text-[#A3A3A3] mt-0.5">
                Email &amp; SMS alerts were queued automatically. You can also share this direct setup link with your team member:
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSetupBanner(null)}
              aria-label="Dismiss setup link banner"
              className="rounded-lg border border-[#333333] bg-[#1C1C1C] p-1.5 text-[#A3A3A3] hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 min-w-0">
            <code className="flex-1 min-w-0 truncate rounded-xl border border-[#333333] bg-[#101010] px-3 py-2 text-xs text-[#F5F1EA] font-mono">
              {activeSetupBanner.setupLink}
            </code>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopySetupLink}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#333333] bg-[#262626] hover:border-[#F0444A]/50 px-3.5 py-2 text-xs font-semibold text-white transition-colors"
              >
                {copiedLink ? (
                  <Check className="h-3.5 w-3.5 text-[#4ADE80]" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-[#A3A3A3]" aria-hidden="true" />
                )}
                <span>{copiedLink ? "Copied" : "Copy Link"}</span>
              </button>
              <a
                href={buildWhatsAppInviteUrl(activeSetupBanner)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#22C55E]/40 bg-[#22C55E]/20 hover:bg-[#22C55E]/30 px-3.5 py-2 text-xs font-semibold text-[#4ADE80] transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Team Directory Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="h-44 rounded-2xl border border-[#333333] bg-[#1C1C1C] sika-skeleton"
            />
          ))}
        </div>
      ) : filteredStaff.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No Team Accounts in Filter"
          description="Create a Kitchen Staff, Cashier, Delivery Rider, or Administrator account to assign roles cleanly."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((member) => (
            <div
              key={member.id}
              className={`rounded-2xl border bg-[#1C1C1C] p-5 flex flex-col justify-between gap-4 ${
                member.isActive ? "border-[#333333]" : "border-[#D71920]/40 opacity-80"
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-serif text-base font-bold text-white truncate">
                      {member.fullName}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge variant={member.role === "ADMIN" ? "brand" : "neutral"}>
                        {formatRoleLabel(member.role)}
                      </Badge>
                      <Badge variant={member.isActive ? "success" : "error"}>
                        {member.isActive ? "Active" : "Suspended"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-[#A3A3A3] pt-1">
                  <p className="flex items-center gap-2 truncate">
                    <Mail className="h-3.5 w-3.5 text-[#F0444A] flex-shrink-0" aria-hidden="true" />
                    <span className="truncate">{member.email}</span>
                  </p>
                  <p className="flex items-center gap-2 font-mono">
                    <Phone className="h-3.5 w-3.5 text-[#F0444A] flex-shrink-0" aria-hidden="true" />
                    <span>{member.phone}</span>
                  </p>
                  {member.role === "DELIVERY_RIDER" && (
                    <p className="flex items-center gap-2 text-[#F5F1EA]">
                      <Bike className="h-3.5 w-3.5 text-[#F0444A] flex-shrink-0" aria-hidden="true" />
                      <span>{member._count?.deliveries ?? 0} assigned deliveries</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#333333] pt-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(member)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#333333] bg-[#262626] hover:border-[#F0444A]/50 px-3 py-1.5 text-xs font-semibold text-[#F5F1EA] transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-[#A3A3A3]" aria-hidden="true" />
                    <span>Edit</span>
                  </button>

                  {member.isActive && (
                    <button
                      type="button"
                      disabled={invitingId === member.id}
                      onClick={() => handleSendInvite(member)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#333333] bg-[#262626] hover:border-[#22C55E]/50 px-3 py-1.5 text-xs font-semibold text-[#F5F1EA] transition-colors disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5 text-[#4ADE80]" aria-hidden="true" />
                      <span>{invitingId === member.id ? "Issuing..." : "Send Invite"}</span>
                    </button>
                  )}
                </div>

                {member.isActive ? (
                  <button
                    type="button"
                    disabled={togglingId === member.id}
                    onClick={() => setPendingSuspend(member)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#D71920]/40 bg-[#D71920]/10 hover:bg-[#D71920]/20 px-3 py-1.5 text-xs font-semibold text-[#F0444A] transition-colors disabled:opacity-50"
                  >
                    <UserX className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Suspend</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={togglingId === member.id}
                    onClick={() => executeSetActive(member, true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-colors disabled:opacity-50"
                  >
                    <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Reactivate</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Staff Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingMember ? "Edit Team Account" : "Add Staff or Rider"}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-[#333333] bg-[#1C1C1C] p-4 sm:p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#333333] pb-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-white">
                  {editingMember ? `Edit ${editingMember.fullName}` : "Add Staff or Rider"}
                </h2>
                <p className="text-xs text-[#A3A3A3] mt-0.5">
                  {editingMember
                    ? "Update role, phone number, or issue a new password."
                    : "Provision a new operational login with role-based permissions."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close team modal"
                className="rounded-xl border border-[#333333] bg-[#262626] p-2 text-[#A3A3A3] hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Yaw Boakye"
                  className="w-full rounded-xl border border-[#333333] bg-[#262626] px-3.5 py-2.5 text-sm text-[#F5F1EA] focus:outline-none focus:border-[#D71920]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                    Email {editingMember ? "(Locked)" : "*"}
                  </label>
                  <input
                    type="email"
                    required
                    disabled={Boolean(editingMember)}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yaw@sikacuisine.com"
                    className="w-full rounded-xl border border-[#333333] bg-[#262626] px-3.5 py-2.5 text-sm text-[#F5F1EA] disabled:opacity-50 focus:outline-none focus:border-[#D71920]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0244123456"
                    className="w-full rounded-xl border border-[#333333] bg-[#262626] px-3.5 py-2.5 text-sm font-mono text-[#F5F1EA] focus:outline-none focus:border-[#D71920]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                  Operational Role *
                </label>
                <Select
                  ariaLabel="Staff Role"
                  value={role}
                  onChange={(val) => setRole(val as StaffRole)}
                  options={ROLE_OPTIONS}
                  variant="elevated"
                  size="md"
                  fullWidth
                />
              </div>

              {!editingMember && (
                <div className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]">
                    Password Provisioning Method
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSendInviteMode(true)}
                      className={`rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                        sendInviteMode
                          ? "border-[#D71920] bg-[#D71920]/15 text-white"
                          : "border-[#333333] bg-[#262626] text-[#A3A3A3] hover:text-white"
                      }`}
                    >
                      <span className="block text-xs font-bold">
                        Private Setup Link (Recommended)
                      </span>
                      <span className="block text-[11px] text-[#A3A3A3] mt-0.5">
                        Issue a 24h link so the user sets their own password
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSendInviteMode(false)}
                      className={`rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                        !sendInviteMode
                          ? "border-[#D71920] bg-[#D71920]/15 text-white"
                          : "border-[#333333] bg-[#262626] text-[#A3A3A3] hover:text-white"
                      }`}
                    >
                      <span className="block text-xs font-bold">
                        Set Initial Password Now
                      </span>
                      <span className="block text-[11px] text-[#A3A3A3] mt-0.5">
                        Create with a manual password immediately
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {(editingMember || !sendInviteMode) && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                    <span className="inline-flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5 text-[#F0444A]" aria-hidden="true" />
                      {editingMember
                        ? "Reset Password (leave blank to keep existing)"
                        : "Initial Password (min 8 chars) *"}
                    </span>
                  </label>
                  <input
                    type="password"
                    required={!editingMember && !sendInviteMode}
                    minLength={editingMember || sendInviteMode ? undefined : 8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      editingMember
                        ? "Leave empty to keep current password"
                        : "Min 8 characters"
                    }
                    className="w-full rounded-xl border border-[#333333] bg-[#262626] px-3.5 py-2.5 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-[#333333] pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" loading={saving}>
                  {editingMember ? "Save Changes" : "Create Account"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingSuspend)}
        title={`Suspend ${pendingSuspend?.fullName || "Account"}?`}
        description="This immediately blocks sign-in and removes this rider from active dispatch selection until reactivated."
        confirmLabel="Suspend Account"
        destructive
        loading={Boolean(pendingSuspend && togglingId === pendingSuspend.id)}
        onConfirm={() => {
          if (pendingSuspend) {
            executeSetActive(pendingSuspend, false);
          }
        }}
        onCancel={() => setPendingSuspend(null)}
      />
    </div>
  );
}
