import { StyleSheet, Platform } from "react-native";
import { COLORS } from "../../constants/colors";

export const styles = StyleSheet.create({
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#E5E5E5",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginVertical: 6,
    backgroundColor: COLORS.white,
    ...(Platform.OS === "web" ? ({ 
      marginVertical: 5,
      borderRadius: 6,
      paddingHorizontal: 10,
    } as any) : {}),
  },
  inputIcon: {
    marginRight: 8,
    ...(Platform.OS === "web" ? ({ marginRight: 6 } as any) : {}),
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    color: COLORS.black,
    fontSize: 15,
    ...(Platform.OS === "web" ? ({ 
      paddingVertical: 8,
      fontSize: 14,
    } as any) : {}),
  },
});
