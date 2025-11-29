import { StyleSheet, Platform } from "react-native";
import { COLORS } from "../../constants/colors";

export const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
    ...(Platform.OS === "web" ? ({ 
      paddingVertical: 10,
      borderRadius: 6,
      marginTop: 6,
    } as any) : {}),
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  text: {
    color: COLORS.white,
    textAlign: "center",
    fontWeight: "600",
    fontSize: 15,
    ...(Platform.OS === "web" ? ({ fontSize: 14 } as any) : {}),
  },
  textDisabled: {
    color: "#999",
  },
});
