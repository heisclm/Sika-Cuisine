import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import {
  Bike,
  CheckCircle2,
  ChefHat,
  Clock,
  PackageCheck,
  XCircle,
} from "lucide-react-native";
import {
  FulfilmentStatus,
  FulfilmentType,
  formatCustomerTimelineNote,
} from "@sika/shared";
import { SikaColors, SikaRadius, SikaSpace } from "../theme";

export interface OrderTimelineHistoryEntry {
  status: FulfilmentStatus;
  timestamp: string;
  note?: string | null;
}

interface TimelineStep {
  status: FulfilmentStatus;
  label: string;
  subtext: string;
  iconKey: "clock" | "confirm" | "prep" | "pack" | "bike" | "done";
}

const DELIVERY_STEPS: TimelineStep[] = [
  { status: "PENDING", label: "Order Received", subtext: "Sent to Sunyani kitchen", iconKey: "clock" },
  { status: "CONFIRMED", label: "Confirmed", subtext: "Kitchen accepted ticket", iconKey: "confirm" },
  { status: "PREPARING", label: "Preparing Meal", subtext: "Cooked fresh to order", iconKey: "prep" },
  { status: "READY_FOR_DISPATCH", label: "Packed", subtext: "Awaiting rider dispatch", iconKey: "pack" },
  { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", subtext: "Courier en route", iconKey: "bike" },
  { status: "DELIVERED", label: "Delivered", subtext: "Completed handover", iconKey: "done" },
];

const PICKUP_STEPS: TimelineStep[] = [
  { status: "PENDING", label: "Order Received", subtext: "Sent to Sunyani kitchen", iconKey: "clock" },
  { status: "CONFIRMED", label: "Confirmed", subtext: "Kitchen accepted ticket", iconKey: "confirm" },
  { status: "PREPARING", label: "Preparing Meal", subtext: "Cooked fresh to order", iconKey: "prep" },
  { status: "READY_FOR_PICKUP", label: "Ready at Counter", subtext: "Available on Commercial Rd", iconKey: "pack" },
  { status: "COLLECTED", label: "Collected", subtext: "Picked up by customer", iconKey: "done" },
];

interface OrderStatusTimelineProps {
  fulfilmentType: FulfilmentType;
  currentStatus: FulfilmentStatus;
  history?: OrderTimelineHistoryEntry[];
}

function renderStepIcon(key: TimelineStep["iconKey"], color: string) {
  switch (key) {
    case "clock":
      return <Clock size={14} color={color} />;
    case "confirm":
    case "done":
      return <CheckCircle2 size={14} color={color} />;
    case "prep":
      return <ChefHat size={14} color={color} />;
    case "pack":
      return <PackageCheck size={14} color={color} />;
    case "bike":
      return <Bike size={14} color={color} />;
  }
}

/**
 * Vertical milestone stepper mapping Delivery vs Pickup trajectories
 * alongside recorded milestone timestamps when supplied by the API or cache.
 */
export function OrderStatusTimeline({
  fulfilmentType,
  currentStatus,
  history = [],
}: OrderStatusTimelineProps) {
  const steps = fulfilmentType === "COLLECTION" ? PICKUP_STEPS : DELIVERY_STEPS;
  const currentIndex = steps.findIndex((s) => s.status === currentStatus);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  if (currentStatus === "CANCELLED" || currentStatus === "REJECTED") {
    return (
      <View style={styles.cancelledBox}>
        <XCircle size={22} color={SikaColors.error} />
        <View style={styles.cancelledCopy}>
          <Text style={styles.cancelledTitle}>
            {currentStatus === "CANCELLED" ? "Order Cancelled" : "Order Declined"}
          </Text>
          <Text style={styles.cancelledDesc}>
            {currentStatus === "CANCELLED"
              ? "This order was cancelled prior to preparation."
              : "The kitchen was unable to fulfil this order. Contact us on 0533376760 if payment was made."}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isFinalStep = index === steps.length - 1;
        const isCompleted =
          currentIndex > index || (currentIndex === index && isFinalStep);
        const isCurrent = currentIndex === index && !isFinalStep;
        const recorded = history.find((h) => h.status === step.status);

        const badgeColor = isCompleted
          ? SikaColors.success
          : isCurrent
          ? SikaColors.text
          : SikaColors.muted;

        return (
          <View key={step.status} style={styles.stepRow}>
            <View style={styles.indicatorCol}>
              <View style={styles.nodeWrapper}>
                {isCurrent ? (
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.nodePulseHalo,
                      {
                        opacity: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.55, 0],
                        }),
                        transform: [
                          {
                            scale: pulseAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.55],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                ) : null}
                <View
                  style={[
                    styles.node,
                    isCompleted && styles.nodeCompleted,
                    isCurrent && styles.nodeCurrent,
                  ]}
                >
                  {renderStepIcon(step.iconKey, badgeColor)}
                </View>
              </View>
              {!isFinalStep ? (
                <View
                  style={[styles.line, currentIndex > index && styles.lineCompleted]}
                />
              ) : null}
            </View>

            <View style={styles.contentCol}>
              <View style={styles.labelRow}>
                <Text
                  style={[
                    styles.stepLabel,
                    (isCompleted || isCurrent) && styles.stepLabelActive,
                  ]}
                >
                  {step.label}
                </Text>
                {recorded ? (
                  <Text style={styles.timeText}>
                    {new Date(recorded.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.stepSubtext}>
                {formatCustomerTimelineNote(
                  step.status,
                  recorded?.note,
                  step.subtext
                )}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SikaSpace.xs,
  },
  stepRow: {
    flexDirection: "row",
  },
  indicatorCol: {
    alignItems: "center",
    width: 34,
    marginRight: SikaSpace.md,
  },
  nodeWrapper: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  nodePulseHalo: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: SikaColors.accent,
  },
  node: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeCompleted: {
    borderColor: SikaColors.successBorder,
    backgroundColor: SikaColors.successBg,
  },
  nodeCurrent: {
    borderColor: SikaColors.accent,
    backgroundColor: SikaColors.accent,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 24,
    backgroundColor: SikaColors.border,
    marginVertical: 4,
  },
  lineCompleted: {
    backgroundColor: SikaColors.success,
  },
  contentCol: {
    flex: 1,
    paddingBottom: SikaSpace.lg,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SikaSpace.sm,
  },
  stepLabel: {
    color: SikaColors.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  stepLabelActive: {
    color: SikaColors.warmWhite,
  },
  timeText: {
    color: SikaColors.secondaryText,
    fontSize: 11,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  stepSubtext: {
    color: SikaColors.secondaryText,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  cancelledBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SikaSpace.md,
    borderRadius: SikaRadius.lg,
    borderWidth: 1,
    borderColor: SikaColors.errorBorder,
    backgroundColor: SikaColors.errorBg,
    padding: SikaSpace.lg,
  },
  cancelledCopy: {
    flex: 1,
  },
  cancelledTitle: {
    color: "#FDA4AF",
    fontSize: 15,
    fontWeight: "800",
  },
  cancelledDesc: {
    color: SikaColors.warmWhite,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
});
