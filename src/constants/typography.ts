import { Platform } from "react-native";

export const TYPOGRAPHY = {
  fontFamily: {
    regular: Platform.OS === "web" ? "Inter" : "Inter_24pt-Regular",
    medium: Platform.OS === "web" ? "Inter" : "Inter_24pt-Medium",
    bold: Platform.OS === "web" ? "Inter" : "Inter_28pt-Bold",
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 22,
    xxxl: 24,
  },
};

