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
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Flame,
  SlidersHorizontal,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MOBILE_IMAGE_ASSETS } from "../data/dish-images";
import { SikaColors, SikaRadius, SikaSpace } from "../theme";
import { Button } from "../components/ui/Button";

interface OnboardingSlide {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  image: ImageSourcePropType;
  iconKey: "flame" | "customize" | "delivery";
}

const SLIDES: OnboardingSlide[] = [
  {
    id: "discover",
    eyebrow: "SUNYANI CULINARY CRAFT",
    title: "Discover Great Food",
    description:
      "Charcoal-grilled whole tilapia with banku, slow-simmered smoky jollof, local swallows, fruit rice, and stone-baked pizza prepared fresh to order.",
    image: MOBILE_IMAGE_ASSETS.heroPlate,
    iconKey: "flame",
  },
  {
    id: "order",
    eyebrow: "EFFORTLESS CUSTOMIZATION",
    title: "Order With Ease",
    description:
      "Choose portion sizes, proteins, spice preferences, and kitchen notes with clear upfront pricing in Ghana Cedis before confirming.",
    image: MOBILE_IMAGE_ASSETS.signaturePlatter,
    iconKey: "customize",
  },
  {
    id: "fulfil",
    eyebrow: "FAST SUNYANI DISPATCH",
    title: "Delivery or Pickup",
    description:
      "Track live kitchen progress across Sunyani delivery zones or collect directly from Commercial Road with zero delivery fee.",
    image: MOBILE_IMAGE_ASSETS.loungeInterior,
    iconKey: "delivery",
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

/**
 * Three-screen swipeable customer onboarding carousel using authentic Sika photography,
 * gradient scrims, animated pagination indicators, and Skip/Back/Continue controls.
 */
export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(e.nativeEvent.contentOffset.x / Math.max(width, 1));
    setActiveIndex(Math.max(0, Math.min(SLIDES.length - 1, nextIndex)));
  };

  const scrollToIndex = (index: number) => {
    listRef.current?.scrollToOffset({ offset: index * width, animated: true });
    setActiveIndex(index);
  };

  const renderSlideIcon = (iconKey: OnboardingSlide["iconKey"]) => {
    if (iconKey === "flame") return <Flame size={18} color={SikaColors.accentLight} />;
    if (iconKey === "customize")
      return <SlidersHorizontal size={18} color={SikaColors.accentLight} />;
    return <Bike size={18} color={SikaColors.accentLight} />;
  };

  return (
    <View style={styles.root}>
      {/* Top Bar: Brand + Skip */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top + 8, 16) }]}>
        <View style={styles.brandRow}>
          <Image source={MOBILE_IMAGE_ASSETS.logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brandName}>SIKA CUISINE</Text>
        </View>
        <Pressable
          onPress={onComplete}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
          style={styles.skipBtn}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Horizontal Paging Slides */}
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
            <View style={styles.heroFrame}>
              <Image source={item.image} style={styles.heroImage} resizeMode="cover" />
              <LinearGradient
                colors={["rgba(16,16,16,0.1)", "rgba(16,16,16,0.55)", "#101010"]}
                locations={[0, 0.55, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.floatingIconPill}>{renderSlideIcon(item.iconKey)}</View>
            </View>

            <View style={styles.copyBlock}>
              <Text style={styles.eyebrow}>{item.eyebrow}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        )}
      />

      {/* Footer Pagination Dots + Controls */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 16, 28) }]}>
        <View style={styles.dotsRow}>
          {SLIDES.map((slide, idx) => {
            const inputRange = [(idx - 1) * width, idx * width, (idx + 1) * width];
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
                      idx === activeIndex ? SikaColors.accent : SikaColors.secondaryText,
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
            title={activeIndex === SLIDES.length - 1 ? "Get Started" : "Continue"}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SikaSpace.xl,
    paddingBottom: SikaSpace.md,
    zIndex: 10,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.sm,
  },
  logo: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
  brandName: {
    color: SikaColors.warmWhite,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  skipBtn: {
    paddingHorizontal: SikaSpace.md,
    paddingVertical: SikaSpace.xs + 2,
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
  },
  skipText: {
    color: SikaColors.secondaryText,
    fontSize: 12,
    fontWeight: "700",
  },
  slide: {
    flex: 1,
    paddingHorizontal: SikaSpace.xl,
    justifyContent: "space-between",
  },
  heroFrame: {
    flex: 1,
    maxHeight: 380,
    borderRadius: SikaRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: SikaColors.border,
    marginTop: SikaSpace.sm,
    backgroundColor: SikaColors.surface,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  floatingIconPill: {
    position: "absolute",
    bottom: SikaSpace.lg,
    left: SikaSpace.lg,
    width: 44,
    height: 44,
    borderRadius: SikaRadius.md,
    backgroundColor: "rgba(28, 28, 28, 0.9)",
    borderWidth: 1,
    borderColor: SikaColors.accentWash40,
    alignItems: "center",
    justifyContent: "center",
  },
  copyBlock: {
    paddingTop: SikaSpace.xl,
    paddingBottom: SikaSpace.lg,
  },
  eyebrow: {
    color: SikaColors.accentLight,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
    marginBottom: SikaSpace.sm,
  },
  title: {
    color: SikaColors.text,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: SikaSpace.md,
  },
  description: {
    color: SikaColors.secondaryText,
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: SikaSpace.xl,
    gap: SikaSpace.lg,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SikaSpace.sm,
  },
  dot: {
    height: 7,
    borderRadius: 4,
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
