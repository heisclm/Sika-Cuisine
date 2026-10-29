/**
 * @file apps/mobile/src/components/OrderStatusTimeline.tsx
 * @description Graphical stepper timeline visualizing order progress across Delivery and Pickup lifecycles.
 *
 * STEPPER DESIGN:
 * 1. Dual-Workflow Sequences: Maps out 6 steps for Delivery (ending in DELIVERED) vs 5 steps for Pickup (ending in COLLECTED).
 * 2. Visual Progress Graph: Completed steps render with vibrant emerald checkmarks, active steps with glowing crimson rings,
 *    and pending future steps in muted carbon tones.
 * 3. Abort Handling: Renders explicit rejection or cancellation banners when an order enters an aborted terminal state.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { FulfilmentStatus, FulfilmentType } from "@sika/shared";

interface TimelineStep {
  status: FulfilmentStatus;
  label: string;
  subtext: string;
}

const DELIVERY_STEPS: TimelineStep[] = [
  { status: "PENDING", label: "Order Received", subtext: "Sent to kitchen" },
  { status: "CONFIRMED", label: "Confirmed", subtext: "Chef acknowledged ticket" },
  { status: "PREPARING", label: "Cooking on Grill", subtext: "Freshly sizzling" },
  { status: "READY_FOR_DISPATCH", label: "Packed & Ready", subtext: "Awaiting courier pickup" },
  { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", subtext: "En route across Sunyani" },
  { status: "DELIVERED", label: "Delivered", subtext: "Enjoy your culinary feast" },
];

const PICKUP_STEPS: TimelineStep[] = [
  { status: "PENDING", label: "Order Received", subtext: "Sent to kitchen" },
  { status: "CONFIRMED", label: "Confirmed", subtext: "Chef acknowledged ticket" },
  { status: "PREPARING", label: "Cooking on Grill", subtext: "Freshly sizzling" },
  { status: "READY_FOR_PICKUP", label: "Ready at Counter", subtext: "Available for pickup" },
  { status: "COLLECTED", label: "Collected", subtext: "Enjoy your feast" },
];

interface OrderStatusTimelineProps {
  fulfilmentType: FulfilmentType;
  currentStatus: FulfilmentStatus;
}

export function OrderStatusTimeline({
  fulfilmentType,
  currentStatus,
}: OrderStatusTimelineProps) {
  const steps = fulfilmentType === "COLLECTION" ? PICKUP_STEPS : DELIVERY_STEPS;
  const currentIndex = steps.findIndex((s) => s.status === currentStatus);

  if (currentStatus === "CANCELLED" || currentStatus === "REJECTED") {
    return (
      <View style={styles.cancelledBox}>
        <Text style={styles.cancelledTitle}>
          {currentStatus === "CANCELLED" ? "Order Cancelled" : "Order Declined"}
        </Text>
        <Text style={styles.cancelledDesc}>
          {currentStatus === "CANCELLED"
            ? "This order was cancelled prior to preparation."
            : "The kitchen was unable to fulfil this order. Any payment will be refunded."}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isCompleted = currentIndex > index || (currentIndex === index && index === steps.length - 1);
        const isCurrent = currentIndex === index && index !== steps.length - 1;
        const isLast = index === steps.length - 1;

        return (
          <View key={step.status} style={styles.stepRow}>
            {/* Step Icon & Line */}
            <View style={styles.indicatorCol}>
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.circleCompleted,
                  isCurrent && styles.circleCurrent,
                ]}
              >
                <View
                  style={[
                    styles.innerDot,
                    (isCompleted || isCurrent) && styles.innerDotActive,
                  ]}
                />
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.line,
                    currentIndex > index && styles.lineCompleted,
                  ]}
                />
              )}
            </View>

            {/* Step Content */}
            <View style={styles.contentCol}>
              <Text
                style={[
                  styles.stepLabel,
                  (isCompleted || isCurrent) && styles.stepLabelActive,
                ]}
              >
                {step.label}
              </Text>
              <Text style={styles.stepSubtext}>{step.subtext}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  stepRow: {
    flexDirection: "row",
    minHeight: 56,
  },
  indicatorCol: {
    alignItems: "center",
    width: 32,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },
  circleCompleted: {
    borderColor: "#10b981",
    backgroundColor: "#064e3b",
  },
  circleCurrent: {
    borderColor: "#e11d48", // Brand Red
    backgroundColor: "#4c0519",
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "transparent",
  },
  innerDotActive: {
    backgroundColor: "#ffffff",
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: "#374151",
    marginVertical: 4,
  },
  lineCompleted: {
    backgroundColor: "#10b981",
  },
  contentCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 20,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9ca3af",
  },
  stepLabelActive: {
    color: "#ffffff",
  },
  stepSubtext: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  cancelledBox: {
    backgroundColor: "rgba(127, 29, 29, 0.4)",
    borderColor: "#991b1b",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  cancelledTitle: {
    color: "#fca5a5",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  cancelledDesc: {
    color: "#fecaca",
    fontSize: 13,
  },
});
