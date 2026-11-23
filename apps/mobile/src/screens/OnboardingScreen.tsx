import React, { useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MOBILE_IMAGE_ASSETS } from "../data/dish-images";
import { SikaColors, SikaRadius, SikaSpace } from "../theme";
import { Button } from "../components/ui/Button";

interface OnboardingSlide {
  id: string;
  chapter: string;
  eyebrow: string;
  title: string;
  description: string;
  footnote: string;
  image: ImageSourcePropType;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: "kitchen",
    chapter: "01 / 03",
    eyebrow: "THE GRILL & KITCHEN",
    title: "From Our Grill to Your Table.",
    description:
      "Whole tilapia grilled over live charcoal, smoky party jollof, and traditional soups simmered fresh every day on Commercial Road.",
    footnote: "Open Daily · 10:00 AM – 10:00 PM",
    image: MOBILE_IMAGE_ASSETS.heroPlate,
  },
  {
    id: "tailored",
    chapter: "02 / 03",
    eyebrow: "MADE TO YOUR TASTE",
    title: "Prepared the Way You Like It.",
    description:
      "Extra green chilli with your banku, shito packed on the side, or a platter for the table — leave a note and our kitchen takes care of the rest.",
    footnote: "Custom portions, sides & personal chef notes",
    image: MOBILE_IMAGE_ASSETS.signaturePlatter,
  },
  {
    id: "hospitality",
    chapter: "03 / 03",
    eyebrow: "TABLE TO DOORSTEP",
    title: "Pick Up Warm, or Let Us Bring Dinner.",
    description:
      "Collect straight from our counter on Commercial Road, or have our riders deliver warm to your home or office anywhere in Sunyani.",
    footnote: "Mobile Money, Card, or Cash on Handover",
    image: MOBILE_IMAGE_ASSETS.loungeInterior,
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

/**
 * Editorial restaurant welcome tour showcasing Sika Cuisine photography,
 * warm hospitality storytelling, and smooth swipeable chapter transitions.
 */
export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);

  const heroHeight = Math.min(Math.max(height * 0.52, 300), 460);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(
      e.nativeEvent.contentOffset.x / Math.max(width, 1)
    );
    setActiveIndex(Math.max(0, Math.min(SLIDES.length - 1, nextIndex)));
  };

  const scrollToIndex = (index: number) => {
    listRef.current?.scrollToOffset({ offset: index * width, animated: true });
    setActiveIndex(index);
  };

  return (
    <View style={styles.root}>
      {/* Floating Editorial Top Bar over Full-Bleed Imagery */}
      <View
        style={[
          styles.topBar,
          { top: Math.max(insets.top + 8, 16) },
        ]}
      >
        <View style={styles.brandBadge}>
          <Image
            source={MOBILE_IMAGE_ASSETS.logo}
            style={styles.logo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.brandName}>SIKA CUISINE</Text>
            <View style={styles.locationRow}>
              <MapPin size={10} color={SikaColors.accentLight} />
              <Text style={styles.locationText}>Sunyani Central</Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={onComplete}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Skip introduction"
          style={styles.skipBtn}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Horizontal Editorial Chapters */}
      <Animated.FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={handleMomentumEnd}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            {/* Full-Bleed Photographic Canvas with Deep Obsidian Vignette */}
            <View style={[styles.heroCanvas, { height: heroHeight }]}>
              <Image
                source={item.image}
                style={styles.heroImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={[
                  "rgba(16, 16, 16, 0.55)",
                  "rgba(16, 16, 16, 0.12)",
                  "rgba(16, 16, 16, 0.78)",
                  "#101010",
                ]}
                locations={[0, 0.35, 0.8, 1]}
                style={StyleSheet.absoluteFill}
              />
            </View>

            {/* Restaurant Story & Editorial Typography */}
            <View style={styles.copyBlock}>
              <View style={styles.chapterRow}>
                <Text style={styles.chapterNum}>{item.chapter}</Text>
                <View style={styles.chapterRule} />
                <Text style={styles.eyebrow}>{item.eyebrow}</Text>
              </View>

              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>

              <View style={styles.footnotePill}>
                <View style={styles.footnoteDot} />
                <Text style={styles.footnoteText}>{item.footnote}</Text>
              </View>
            </View>
          </View>
        )}
      />

      {/* Footer Pagination & Navigation */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom + 16, 26) },
        ]}
      >
        <View style={styles.dotsRow}>
          {SLIDES.map((slide, idx) => {
            const inputRange = [
              (idx - 1) * width,
              idx * width,
              (idx + 1) * width,
            ];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 28, 8],
              extrapolate: "clamp",
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.35, 1, 0.35],
              extrapolate: "clamp",
            });

            return (
              <Animated.View
                key={slide.id}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                    backgroundColor:
                      idx === activeIndex
                        ? SikaColors.accent
                        : SikaColors.secondaryText,
                  },
                ]}
              />
            );
          })}
        </View>

        <View style={styles.controlsRow}>
          {activeIndex > 0 ? (
            <Button
              title="Back"
              variant="secondary"
              size="lg"
              leadingIcon={<ArrowLeft size={16} color={SikaColors.warmWhite} />}
              onPress={() => scrollToIndex(activeIndex - 1)}
              style={styles.backBtn}
            />
          ) : null}

          <Button
            title={
              activeIndex === SLIDES.length - 1 ? "Explore the Menu" : "Next"
            }
            variant="primary"
            size="lg"
            trailingIcon={<ArrowRight size={16} color={SikaColors.text} />}
            onPress={() => {
              if (activeIndex < SLIDES.length - 1) {
                scrollToIndex(activeIndex + 1);
              } else {
                onComplete();
              }
            }}
            style={styles.primaryBtn}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SikaColors.background,
  },
  topBar: {
    position: "absolute",
    left: SikaSpace.lg,
    right: SikaSpace.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 20,
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.sm,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    backgroundColor: "rgba(16, 16, 16, 0.72)",
  },
  logo: {
    width: 26,
    height: 26,
    borderRadius: 7,
  },
  brandName: {
    color: SikaColors.warmWhite,
    fontSize: 11.5,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 1,
  },
  locationText: {
    color: SikaColors.secondaryText,
    fontSize: 10,
    fontWeight: "600",
  },
  skipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    backgroundColor: "rgba(16, 16, 16, 0.72)",
  },
  skipText: {
    color: SikaColors.warmWhite,
    fontSize: 12,
    fontWeight: "700",
  },
  slide: {
    flex: 1,
  },
  heroCanvas: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: SikaColors.surface,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  copyBlock: {
    flex: 1,
    paddingHorizontal: SikaSpace.xl,
    paddingTop: SikaSpace.md,
    justifyContent: "center",
  },
  chapterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: SikaSpace.sm + 2,
  },
  chapterNum: {
    color: SikaColors.accentLight,
    fontSize: 11.5,
    fontWeight: "900",
    letterSpacing: 1.2,
    fontVariant: ["tabular-nums"],
  },
  chapterRule: {
    width: 20,
    height: 1.5,
    backgroundColor: SikaColors.accent,
  },
  eyebrow: {
    color: SikaColors.warmWhite,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
  title: {
    color: SikaColors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginBottom: SikaSpace.sm + 2,
  },
  description: {
    color: SikaColors.secondaryText,
    fontSize: 14.5,
    lineHeight: 22,
  },
  footnotePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: SikaSpace.lg,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
  },
  footnoteDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: SikaColors.accentLight,
  },
  footnoteText: {
    color: SikaColors.warmWhite,
    fontSize: 11.5,
    fontWeight: "700",
  },
  footer: {
    paddingHorizontal: SikaSpace.xl,
    gap: SikaSpace.md + 2,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SikaSpace.sm,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  controlsRow: {
    flexDirection: "row",
    gap: SikaSpace.md,
  },
  backBtn: {
    flex: 1,
  },
  primaryBtn: {
    flex: 2,
  },
});
