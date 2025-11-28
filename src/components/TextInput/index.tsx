import React from "react";
import { TextInput as RNTextInput, TextInputProps as RNTextInputProps, StyleSheet } from "react-native";
import { TYPOGRAPHY } from "../../constants/typography";
import { COLORS } from "../../constants/colors";

type TextInputProps = RNTextInputProps & {
  variant?: "regular" | "medium" | "bold";
};

export default function TextInput({ style, variant = "regular", placeholderTextColor, ...props }: TextInputProps) {
  const fontFamily = TYPOGRAPHY.fontFamily[variant];
  
  return (
    <RNTextInput
      style={[styles.default, { fontFamily }, style]}
      placeholderTextColor={placeholderTextColor || COLORS.gray}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.black, // Ensure text color is visible
    fontSize: 16, // Ensure readable font size
  },
});

