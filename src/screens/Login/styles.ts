import { StyleSheet, Platform } from "react-native";
import { COLORS } from "../../constants/colors";

export const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    ...(Platform.OS === "web" ? ({
      minHeight: "100vh",
    } as any) : {}),
  },
  cardContainer: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 32,
    ...(Platform.OS === "web" ? ({
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      paddingHorizontal: 40,
      paddingVertical: 40,
    } as any) : {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    }),
  },
  logo: {
    width: 48,
    height: 48,
    alignSelf: "center",
    marginBottom: 6,
    ...(Platform.OS === "web" ? ({ width: 40, height: 40 } as any) : {}),
  },
  appName: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 4,
    ...(Platform.OS === "web" ? ({ fontSize: 15 } as any) : {}),
  },
  title: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    ...(Platform.OS === "web" ? ({ fontSize: 18, marginBottom: 16 } as any) : {}),
  },

  forgotText: {
    textAlign: "right",
    marginBottom: 12,
    color: COLORS.primary,
    fontWeight: "500",
    fontSize: 13,
    ...(Platform.OS === "web" ? ({ fontSize: 12, marginBottom: 10 } as any) : {}),
  },

  /* Social buttons */
  socialButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    ...(Platform.OS === "web" ? ({ paddingVertical: 8, marginBottom: 8 } as any) : {}),
  },
  fbButton: {
    backgroundColor: "#1877F2",
    borderColor: "#1877F2",
  },
  socialLogo: {
    width: 18,
    height: 18,
    marginRight: 8,
    ...(Platform.OS === "web" ? ({ width: 16, height: 16, marginRight: 6 } as any) : {}),
  },
  socialText: {
    fontSize: 13,
    color: "#444",
    ...(Platform.OS === "web" ? ({ fontSize: 12 } as any) : {}),
  },
  socialTextFB: {
    fontSize: 13,
    color: "#fff",
    ...(Platform.OS === "web" ? ({ fontSize: 12 } as any) : {}),
  },

  footerText: {
    textAlign: "center",
    marginTop: 16,
    color: "#444",
    fontSize: 13,
    ...(Platform.OS === "web" ? ({ marginTop: 12, fontSize: 12 } as any) : {}),
  },
  registerLink: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});
