import { StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  logo: {
    width: 60,
    height: 60,
    alignSelf: "center",
    marginBottom: 8,
  },
  appName: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.primary,
  },
  title: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 28,
  },

  /* Social buttons */
  socialButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  fbButton: {
    backgroundColor: "#1877F2",
    borderColor: "#1877F2",
  },
  socialLogo: {
    width: 22,
    height: 22,
    marginRight: 8,
  },
  socialText: {
    fontSize: 14,
    color: "#444",
  },
  socialTextFB: {
    fontSize: 14,
    color: "#fff",
  },

  footerText: {
    textAlign: "center",
    marginTop: 18,
    color: "#444",
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});
