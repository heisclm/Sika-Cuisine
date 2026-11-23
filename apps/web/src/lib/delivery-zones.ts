/**
 * @file apps/web/src/lib/delivery-zones.ts
 * @description Single-source-of-truth Sunyani delivery zone utilities for web routes and server actions.
 * Delegates zone definitions and tariff calculation directly to `@sika/shared` so web, mobile,
 * and REST API pricing cannot drift.
 */

import {
  SUNYANI_DELIVERY_ZONES,
  type DeliveryZone,
  calculateDeliveryFeePesewas,
  getZoneByLocality,
} from "@sika/shared";

export { SUNYANI_DELIVERY_ZONES, getZoneByLocality, type DeliveryZone };

/**
 * Resolves the Sunyani delivery fee in integer pesewas for a zone ID, zone name, or locality.
 *
 * @param zoneIdOrLocality - Zone identifier (e.g. "zone-1"), zone name, or Sunyani suburb
 * @returns Integer fee in pesewas
 */
export function getZoneFeePesewas(zoneIdOrLocality: string): number {
  return calculateDeliveryFeePesewas("DELIVERY", zoneIdOrLocality);
}
