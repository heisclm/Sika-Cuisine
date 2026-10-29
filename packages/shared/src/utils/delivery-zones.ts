import { FulfilmentType } from "../contracts/order";

export interface DeliveryZone {
  id: string;
  name: string;
  description: string;
  feePesewas: number;
  estimatedMinutes: number;
  localities: string[];
}

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

export const DEFAULT_DELIVERY_FEE_PESEWAS = 1200; // GH₵ 12.00

/**
 * Calculates authoritative delivery charge.
 * Guarantees 0 pesewas for pickup / collection orders.
 */
export function calculateDeliveryFeePesewas(
  fulfilmentType: FulfilmentType,
  locality?: string | null
): number {
  if (fulfilmentType === "COLLECTION") {
    return 0;
  }

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
