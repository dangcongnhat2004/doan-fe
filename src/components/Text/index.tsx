import React from "react";
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from "react-native";
import { TYPOGRAPHY } from "../../constants/typography";

type TextProps = RNTextProps & {
  variant?: "regular" | "medium" | "bold";
};

export default function Text({ style, variant = "regular", ...props }: TextProps) {
  const fontFamily = TYPOGRAPHY.fontFamily[variant];
  
  return (
    <RNText
      style={[styles.default, { fontFamily }, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
});

