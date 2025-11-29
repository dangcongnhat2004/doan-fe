import { StyleSheet, Platform } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    ...(Platform.OS === "web" ? ({ marginVertical: 12 } as any) : {}),
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  text: {
    marginHorizontal: 10,
    color: "#888",
    fontSize: 13,
    ...(Platform.OS === "web" ? ({ 
      fontSize: 12,
      marginHorizontal: 8,
    } as any) : {}),
  },
});
