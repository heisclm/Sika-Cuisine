"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Bike,
  Clock,
  Edit3,
  MapPin,
  Plus,
  Power,
  Save,
  Store,
  X,
} from "lucide-react";
import { formatPesewasToGhs } from "@/lib/currency";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { usePublicConfig } from "@/context/PublicConfigContext";
import { useToast } from "@/context/ToastContext";

interface RestaurantSettingsForm {
  name: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  address: string;
  isAcceptingOrders: boolean;
  isDeliveryEnabled: boolean;
  isCollectionEnabled: boolean;
  weekdayHours: string;
  sundayHours: string;
}

interface AdminDeliveryZone {
  id: string;
  slug: string;
  name: string;
  description: string;
  feePesewas: number;
  estimatedMinutes: number;
  localities: string[];
  isActive: boolean;
  sortOrder: number;
}

export function AdminSettingsZonesPanel() {
  const { refreshConfig } = usePublicConfig();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const [settings, setSettings] = useState<RestaurantSettingsForm>({
    name: "Sika Cuisine",
    tagline: "Sunyani, Ghana",
    phone: "0533376760",
    whatsapp: "+233533376760",
    address: "Commercial Street, Sunyani Central, Bono Region, Ghana",
    isAcceptingOrders: true,
    isDeliveryEnabled: true,
    isCollectionEnabled: true,
    weekdayHours: "10:00 AM - 10:00 PM",
    sundayHours: "12:00 PM - 9:00 PM",
  });

  const [zones, setZones] = useState<AdminDeliveryZone[]>([]);
  const [zoneFormOpen, setZoneFormOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<AdminDeliveryZone | null>(null);
  const [savingZone, setSavingZone] = useState(false);

  const [zoneName, setZoneName] = useState("");
  const [zoneDescription, setZoneDescription] = useState("");
  const [zoneFeeGhs, setZoneFeeGhs] = useState("10.00");
  const [zoneEtaMinutes, setZoneEtaMinutes] = useState("35");
  const [zoneLocalitiesText, setZoneLocalitiesText] = useState("");
  const [zoneActive, setZoneActive] = useState(true);

  const loadPanelData = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, zonesRes] = await Promise.all([
        fetch("/api/v1/admin/settings", { cache: "no-store" }),
        fetch("/api/v1/admin/zones", { cache: "no-store" }),
      ]);
      const [settingsData, zonesData] = await Promise.all([
        settingsRes.json(),
        zonesRes.json(),
      ]);

      if (settingsRes.ok && settingsData.success && settingsData.settings) {
        setSettings((prev) => ({ ...prev, ...settingsData.settings }));
      }
      if (zonesRes.ok && zonesData.success) {
        setZones(zonesData.zones ?? []);
      }
    } catch {
      toastError("Load Failed", "Unable to retrieve restaurant settings and delivery zones.");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadPanelData();
  }, [loadPanelData]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch("/api/v1/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toastError("Save Failed", data.error || "Unable to save restaurant settings.");
        return;
      }

      if (data.settings) {
        setSettings((prev) => ({ ...prev, ...data.settings }));
      }
      await refreshConfig();
      success("Settings Saved", "Live kitchen status and hours updated across Web & Mobile.");
    } catch {
      toastError("Network Error", "Could not persist restaurant settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const openAddZone = () => {
    setEditingZone(null);
    setZoneName("");
    setZoneDescription("");
    setZoneFeeGhs("12.00");
    setZoneEtaMinutes("35");
    setZoneLocalitiesText("");
    setZoneActive(true);
    setZoneFormOpen(true);
  };

  const openEditZone = (zone: AdminDeliveryZone) => {
    setEditingZone(zone);
    setZoneName(zone.name);
    setZoneDescription(zone.description);
    setZoneFeeGhs((zone.feePesewas / 100).toFixed(2));
    setZoneEtaMinutes(String(zone.estimatedMinutes));
    setZoneLocalitiesText(zone.localities.join(", "));
    setZoneActive(zone.isActive);
    setZoneFormOpen(true);
  };

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();

    const feePesewas = Math.round(Number(zoneFeeGhs) * 100);
    const estimatedMinutes = Math.max(5, Math.min(180, Number(zoneEtaMinutes) || 35));
    const localities = zoneLocalitiesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (zoneName.trim().length < 2) {
      toastError("Validation Error", "Zone name is required.");
      return;
    }
    if (!Number.isFinite(feePesewas) || feePesewas < 0) {
      toastError("Validation Error", "Enter a valid non-negative delivery fee in GH₵.");
      return;
    }
    if (localities.length === 0) {
      toastError("Validation Error", "Add at least one Sunyani locality or neighborhood.");
      return;
    }

    setSavingZone(true);
    try {
      const endpoint = editingZone
        ? `/api/v1/admin/zones/${editingZone.id}`
        : "/api/v1/admin/zones";
      const method = editingZone ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: zoneName.trim(),
          description: zoneDescription.trim() || localities.join(", "),
          feePesewas,
          estimatedMinutes,
          localities,
          isActive: zoneActive,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toastError("Zone Save Failed", data.error || "Unable to save delivery zone.");
        return;
      }

      setZoneFormOpen(false);
      await loadPanelData();
      await refreshConfig();
      success(
        editingZone ? "Zone Updated" : "Zone Created",
        `${zoneName.trim()} updated at ${formatPesewasToGhs(feePesewas)}.`
      );
    } catch {
      toastError("Network Error", "Could not save delivery zone.");
    } finally {
      setSavingZone(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Kitchen Operations & Hours */}
      <form
        onSubmit={handleSaveSettings}
        className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-4 sm:p-6 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#333333] pb-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-white">
              Kitchen Operations &amp; Hours
            </h2>
            <p className="text-xs text-[#A3A3A3] mt-0.5">
              Immediately controls whether Web and Mobile checkouts accept new orders.
            </p>
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full sm:w-auto"
            loading={savingSettings}
            disabled={loading}
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            <span>Save Settings</span>
          </Button>
        </div>

        {/* Operational Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() =>
              setSettings((prev) => ({
                ...prev,
                isAcceptingOrders: !prev.isAcceptingOrders,
              }))
            }
            aria-pressed={settings.isAcceptingOrders}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              settings.isAcceptingOrders
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-[#D71920]/50 bg-[#D71920]/10"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <Power
                className={`h-5 w-5 ${
                  settings.isAcceptingOrders ? "text-emerald-400" : "text-[#F0444A]"
                }`}
                aria-hidden="true"
              />
              <Badge variant={settings.isAcceptingOrders ? "success" : "error"}>
                {settings.isAcceptingOrders ? "Open" : "Paused"}
              </Badge>
            </div>
            <p className="mt-3 text-sm font-bold text-white">Online Ordering</p>
            <p className="text-xs text-[#A3A3A3] mt-0.5">
              {settings.isAcceptingOrders
                ? "Kitchen is accepting live orders."
                : "All Web & Mobile checkouts paused."}
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              setSettings((prev) => ({
                ...prev,
                isDeliveryEnabled: !prev.isDeliveryEnabled,
              }))
            }
            aria-pressed={settings.isDeliveryEnabled}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              settings.isDeliveryEnabled
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-[#333333] bg-[#262626]"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <Bike
                className={`h-5 w-5 ${
                  settings.isDeliveryEnabled ? "text-emerald-400" : "text-[#737373]"
                }`}
                aria-hidden="true"
              />
              <Badge variant={settings.isDeliveryEnabled ? "success" : "warning"}>
                {settings.isDeliveryEnabled ? "Enabled" : "Paused"}
              </Badge>
            </div>
            <p className="mt-3 text-sm font-bold text-white">Sunyani Delivery</p>
            <p className="text-xs text-[#A3A3A3] mt-0.5">
              Courier doorstep dispatch across active zones.
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              setSettings((prev) => ({
                ...prev,
                isCollectionEnabled: !prev.isCollectionEnabled,
              }))
            }
            aria-pressed={settings.isCollectionEnabled}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              settings.isCollectionEnabled
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-[#333333] bg-[#262626]"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <Store
                className={`h-5 w-5 ${
                  settings.isCollectionEnabled ? "text-emerald-400" : "text-[#737373]"
                }`}
                aria-hidden="true"
              />
              <Badge variant={settings.isCollectionEnabled ? "success" : "warning"}>
                {settings.isCollectionEnabled ? "Enabled" : "Paused"}
              </Badge>
            </div>
            <p className="mt-3 text-sm font-bold text-white">Counter Pickup</p>
            <p className="text-xs text-[#A3A3A3] mt-0.5">
              Zero-fee restaurant collection orders.
            </p>
          </button>
        </div>

        {/* Hours & Contact Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
              Mon — Sat Hours
            </label>
            <input
              type="text"
              value={settings.weekdayHours}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, weekdayHours: e.target.value }))
              }
              className="w-full rounded-xl border border-[#333333] bg-[#262626] px-3.5 py-2.5 text-sm font-mono text-[#F5F1EA] focus:outline-none focus:border-[#D71920]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
              Sunday Hours
            </label>
            <input
              type="text"
              value={settings.sundayHours}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, sundayHours: e.target.value }))
              }
              className="w-full rounded-xl border border-[#333333] bg-[#262626] px-3.5 py-2.5 text-sm font-mono text-[#F5F1EA] focus:outline-none focus:border-[#D71920]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
              Phone Line
            </label>
            <input
              type="text"
              value={settings.phone}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, phone: e.target.value }))
              }
              className="w-full rounded-xl border border-[#333333] bg-[#262626] px-3.5 py-2.5 text-sm font-mono text-[#F5F1EA] focus:outline-none focus:border-[#D71920]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
              WhatsApp Number
            </label>
            <input
              type="text"
              value={settings.whatsapp}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, whatsapp: e.target.value }))
              }
              className="w-full rounded-xl border border-[#333333] bg-[#262626] px-3.5 py-2.5 text-sm font-mono text-[#F5F1EA] focus:outline-none focus:border-[#D71920]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
            Pickup Address
          </label>
          <input
            type="text"
            value={settings.address}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, address: e.target.value }))
            }
            className="w-full rounded-xl border border-[#333333] bg-[#262626] px-3.5 py-2.5 text-sm text-[#F5F1EA] focus:outline-none focus:border-[#D71920]"
          />
        </div>
      </form>

      {/* 2. Sunyani Delivery Zones */}
      <div className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#333333] pb-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-white">
              Sunyani Delivery Zones &amp; Tariffs
            </h2>
            <p className="text-xs text-[#A3A3A3] mt-0.5">
              Changes reflect immediately in Cart, Checkout, and server fee calculation.
            </p>
          </div>
          <Button variant="primary" size="md" className="w-full sm:w-auto" onClick={openAddZone}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Add Zone</span>
          </Button>
        </div>

        {zoneFormOpen && (
          <form
            onSubmit={handleSaveZone}
            className="rounded-2xl border border-[#D71920]/40 bg-[#262626] p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-white">
                {editingZone ? `Edit ${editingZone.name}` : "New Delivery Zone"}
              </h3>
              <button
                type="button"
                onClick={() => setZoneFormOpen(false)}
                aria-label="Close zone editor"
                className="text-[#A3A3A3] hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                  Zone Name *
                </label>
                <input
                  type="text"
                  required
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  placeholder="Zone 1 — Central & Campus"
                  className="w-full rounded-xl border border-[#333333] bg-[#1C1C1C] px-3.5 py-2.5 text-sm text-[#F5F1EA] focus:outline-none focus:border-[#D71920]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                  Delivery Fee (GH₵) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={zoneFeeGhs}
                  onChange={(e) => setZoneFeeGhs(e.target.value)}
                  className="w-full rounded-xl border border-[#333333] bg-[#1C1C1C] px-3.5 py-2.5 text-sm font-mono text-[#F5F1EA] focus:outline-none focus:border-[#D71920]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                  Est. ETA (mins)
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={zoneEtaMinutes}
                  onChange={(e) => setZoneEtaMinutes(e.target.value)}
                  className="w-full rounded-xl border border-[#333333] bg-[#1C1C1C] px-3.5 py-2.5 text-sm font-mono text-[#F5F1EA] focus:outline-none focus:border-[#D71920]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                Summary Description *
              </label>
              <input
                type="text"
                required
                value={zoneDescription}
                onChange={(e) => setZoneDescription(e.target.value)}
                placeholder="Sunyani Central, Fiapre, UENR Campus..."
                className="w-full rounded-xl border border-[#333333] bg-[#1C1C1C] px-3.5 py-2.5 text-sm text-[#F5F1EA] focus:outline-none focus:border-[#D71920]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                Matched Localities (comma-separated) *
              </label>
              <input
                type="text"
                required
                value={zoneLocalitiesText}
                onChange={(e) => setZoneLocalitiesText(e.target.value)}
                placeholder="Sunyani Central, Fiapre, UENR Campus, Area 1"
                className="w-full rounded-xl border border-[#333333] bg-[#1C1C1C] px-3.5 py-2.5 text-sm text-[#F5F1EA] focus:outline-none focus:border-[#D71920]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#F5F1EA]">
                <input
                  type="checkbox"
                  checked={zoneActive}
                  onChange={(e) => setZoneActive(e.target.checked)}
                  className="h-4 w-4 accent-[#D71920] rounded"
                />
                <span>Active at Checkout</span>
              </label>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setZoneFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={savingZone}>
                  {editingZone ? "Update Zone" : "Create Zone"}
                </Button>
              </div>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="rounded-2xl border border-[#333333] bg-[#262626]/70 p-4 space-y-2.5 min-w-0"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MapPin className="h-4 w-4 text-[#F0444A] shrink-0" aria-hidden="true" />
                    <h3 className="text-sm font-bold text-white truncate">{zone.name}</h3>
                  </div>
                  <span className="font-mono text-base font-black text-[#F0444A] tabular-nums shrink-0">
                    {formatPesewasToGhs(zone.feePesewas)}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={zone.isActive ? "success" : "neutral"}>
                    {zone.isActive ? "Active" : "Archived"}
                  </Badge>
                </div>
                <p className="text-xs text-[#A3A3A3] break-words">{zone.description}</p>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-[#333333] pt-2.5 text-xs text-[#A3A3A3]">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-[#F0444A]" aria-hidden="true" />
                  ~{zone.estimatedMinutes} mins &bull; {zone.localities.length} localities
                </span>

                <button
                  type="button"
                  onClick={() => openEditZone(zone)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#333333] bg-[#1C1C1C] hover:border-[#F0444A]/50 px-2.5 py-1 text-xs font-semibold text-[#F5F1EA] transition-colors"
                >
                  <Edit3 className="h-3 w-3" aria-hidden="true" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
