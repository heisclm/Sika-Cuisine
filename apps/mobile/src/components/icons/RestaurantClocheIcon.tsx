import React from "react";
import Svg, { Circle, Path } from "react-native-svg";

interface RestaurantClocheIconProps {
  size?: number;
  color?: string;
}

/**
 * Native SVG dining cloche icon sharing exact vector geometry with the Web Navbar's
 * `RestaurantClocheIcon` so Cart / Order Tray triggers look identical across platforms.
 */
export function RestaurantClocheIcon({
  size = 20,
  color = "#FFFFFF",
}: RestaurantClocheIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="4.5" r="1.5" stroke={color} strokeWidth={1.8} />
      <Path
        d="M4 16.5C4 12.08 7.58 8.5 12 8.5C16.42 8.5 20 12.08 20 16.5H4Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2 18.5H22"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 21H17"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
