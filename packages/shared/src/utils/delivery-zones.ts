/**
 * @file packages/shared/src/utils/delivery-zones.ts
 * @description Municipal delivery zone matrix and authoritative fee engine for Sunyani, Ghana.
 *
 * MUNICIPAL LOGISTICS ARCHITECTURE:
 * Delivery tariffs are categorized into concentric zones centered around Sika Cuisine Restaurant,
 * Sunyani Central, Bono Region.
 *
 * Invariants:
 * 1. Zero-Fee Collection: Pickup/Takeaway orders unconditionally incur GH₵ 0.00 (0 pesewas) delivery charge.
 * 2. Deterministic Server Pricing: The client UI proposes an estimated fee based on locality, but the server
 *    authoritatively re-computes this fee before persisting any order.
 */

import { FulfilmentType } from "../contracts/order";

/**
 * Metadata definition for a geographic delivery zone within Sunyani.
 */
export interface DeliveryZone {
  id: string;
  name: string;
  description: string;
  feePesewas: number;
  estimatedMinutes: number;
  localities: string[];
}

/**
 * Authoritative Sunyani municipal delivery zone definitions.
 * Fees are defined in integer pesewas (100 pesewas = GH₵ 1.00).
 */
export const SUNYANI_DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: "zone-1",
    name: "Zone 1 — Central & Campus",
    description: "Sunyani Central, Fiapre, UENR Campus, Area 1–4",
    feePesewas: 800, // GH₵ 8.00
    estimatedMinutes: 30,
    localities: [
      "Sunyani Central",
      "Fiapre",
      "UENR Campus",
      "Area 1",
      "Area 2",
      "Area 3",
      "Area 4",
      "Post Office / Market Area",
      "Victoria Park",
    ],
  },
  {
    id: "zone-2",
    name: "Zone 2 — Residential & Mid-Belt",
    description: "Abesim, Berlin Top, New Dormaa, Magazine",
    feePesewas: 1200, // GH₵ 12.00
    estimatedMinutes: 40,
    localities: [
      "Abesim",
      "Berlin Top",
      "New Dormaa",
      "Sunyani Magazine",
      "Penkwase",
      "Estate",
      "Sunyani Senior High Area",
    ],
  },
  {
    id: "zone-3",
    name: "Zone 3 — Extended Periphery",
    description: "Kotokrom, Yawhima, Baakoniaba, Chiraa Road",
    feePesewas: 1500, // GH₵ 15.00
    estimatedMinutes: 50,
    localities: [
      "Kotokrom",
      "Yawhima",
      "Baakoniaba",
      "Chiraa Road",
      "Mayfair Area",
      "Watchman",
      "Tanoso Road",
    ],
  },
  {
    id: "zone-4",
    name: "Zone 4 — Outer Regional Boundary",
    description: "Sunyani Airport, Dumasua, Nsoatre Outskirts",
    feePesewas: 2000, // GH₵ 20.00
    estimatedMinutes: 60,
    localities: [
      "Sunyani Airport Enclave",
      "Dumasua",
      "Nsoatre Junction",
      "Kwatire",
      "Adantia Area",
    ],
  },
];

/** Default flat fee (Zone 2 baseline) applied when a specific locality cannot be determined */
export const DEFAULT_DELIVERY_FEE_PESEWAS = 1200; // GH₵ 12.00

/**
 * Calculates authoritative delivery charge in integer pesewas based on fulfilment type and customer locality.
 *
 * Algorithmic Behavior:
 * 1. If fulfilmentType is COLLECTION (pickup), returns 0 immediately.
 * 2. Normalizes input locality string (lowercased, trimmed).
 * 3. Scans SUNYANI_DELIVERY_ZONES sequentially for exact or substring matches against known localities.
 * 4. Falls back to DEFAULT_DELIVERY_FEE_PESEWAS if unmapped or unspecified.
 *
 * @param fulfilmentType - Fulfilment workflow ('DELIVERY' | 'COLLECTION')
 * @param locality - Suburb or neighborhood name within Sunyani (e.g. "Fiapre", "Abesim")
 * @returns number - Delivery tariff in integer pesewas
 */
export function calculateDeliveryFeePesewas(
  fulfilmentType: FulfilmentType,
  locality?: string | null
): number {
  // Invariant 1: Pickup / collection is always free of delivery surcharge
  if (fulfilmentType === "COLLECTION") {
    return 0;
  }

  // Fallback to baseline delivery fee if locality is omitted
  if (!locality) {
    return DEFAULT_DELIVERY_FEE_PESEWAS;
  }

  const normalized = locality.trim().toLowerCase();

  for (const zone of SUNYANI_DELIVERY_ZONES) {
    for (const loc of zone.localities) {
      if (loc.toLowerCase() === normalized || normalized.includes(loc.toLowerCase())) {
        return zone.feePesewas;
      }
    }
  }

  return DEFAULT_DELIVERY_FEE_PESEWAS;
}

/**
 * Retrieves the matching DeliveryZone metadata for a given Sunyani locality.
 *
 * @param locality - Suburb or locality name
 * @returns DeliveryZone | undefined - Matched zone object or undefined if unmapped
 */
export function getZoneByLocality(locality?: string | null): DeliveryZone | undefined {
  if (!locality) return undefined;
  const normalized = locality.trim().toLowerCase();

  for (const zone of SUNYANI_DELIVERY_ZONES) {
    for (const loc of zone.localities) {
      if (loc.toLowerCase() === normalized || normalized.includes(loc.toLowerCase())) {
        return zone;
      }
    }
  }

  return undefined;
}
