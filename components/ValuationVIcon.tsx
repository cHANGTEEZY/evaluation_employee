import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
  opacity?: number;
};

export default function ValuationVIcon({
  size = 24,
  color = "currentColor",
  opacity = 1,
}: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      accessibilityLabel="Valuation V icon"
    >
      <Path
        opacity={opacity}
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.2 4C5.85 4 6.43 4.42 6.63 5.03L12 18.55L17.37 5.03C17.57 4.42 18.15 4 18.8 4H21L14.05 20.38C13.72 21.16 12.96 21.66 12 21.66C11.04 21.66 10.28 21.16 9.95 20.38L3 4H5.2Z"
      />
    </Svg>
  );
}
