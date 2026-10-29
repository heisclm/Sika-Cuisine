/**
 * Sunyani delivery zone and fee configuration.
 */

export interface DeliveryZone {
  id: string;
  name: string;
  feePesewas: number;
  estimatedMinutes: number;
  description: string;
}

export const SUNYANI_DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: "sunyani-central",
    name: "Sunyani Central / Market Area",
    feePesewas: 1500,
    estimatedMinutes: 25,
    description: "Central Business District, Main Market, Post Office, Victoria Park",
  },
  {
    id: "penkwase",
    name: "Penkwase / High Street",
    feePesewas: 1500,
    estimatedMinutes: 25,
    description: "Penkwase New & Old Towns, High Street, SSNIT Area",
  },
  {
    id: "fiapre-uenr",
    name: "Fiapre & UENR Campus",
    feePesewas: 2000,
    estimatedMinutes: 35,
    description: "University of Energy and Natural Resources (UENR), Fiapre Township, Notre Dame",
  },
  {
    id: "berlin-top",
    name: "Berlin Top",
    feePesewas: 2000,
    estimatedMinutes: 35,
    description: "Berlin Top residential area and hilltop suburbs",
  },
  {
    id: "new-dormaa",
    name: "New Dormaa",
    feePesewas: 2000,
    estimatedMinutes: 30,
    description: "New Dormaa, Sunyani Technical University (STU) surrounding area",
  },
  {
    id: "abesim",
    name: "Abesim",
    feePesewas: 2500,
    estimatedMinutes: 45,
    description: "Abesim township, St. James Seminary area, Barrier",
  },
  {
    id: "airport-residential",
    name: "Airport Residential Sunyani",
    feePesewas: 2500,
    estimatedMinutes: 40,
    description: "Sunyani Airport vicinity, Asufufu, Regional Hospital Area",
  },
  {
    id: "kotokrom",
    name: "Kotokrom",
    feePesewas: 2500,
    estimatedMinutes: 45,
    description: "Kotokrom community and eastern corridor",
  },
  {
    id: "estate-mayfair",
    name: "Estate / Mayfair",
    feePesewas: 2000,
    estimatedMinutes: 30,
    description: "Low-cost Estate, Mayfair, Baakoniaba",
  },
];

export function getZoneFeePesewas(zoneIdOrName: string): number {
  const match = SUNYANI_DELIVERY_ZONES.find(
    (z) =>
      z.id === zoneIdOrName ||
      z.name.toLowerCase() === zoneIdOrName.toLowerCase() ||
      z.description.toLowerCase().includes(zoneIdOrName.toLowerCase())
  );
  return match ? match.feePesewas : 2000;
}
