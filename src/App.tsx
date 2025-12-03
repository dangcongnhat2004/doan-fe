import { useFonts } from "expo-font";
import React, { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import RootNavigator from "./navigation/RootNavigator";
import { store } from "./store";

export default function App() {
  const [fontsLoaded] = useFonts({
    "Inter_24pt-Regular": require("./assets/fonts/Inter_24pt-Regular.ttf"),
    "Inter_24pt-Medium": require("./assets/fonts/Inter_24pt-Medium.ttf"),
    "Inter_28pt-Bold": require("./assets/fonts/Inter_28pt-Bold.ttf"),
  });

  useEffect(() => {
    if (Platform.OS === "web") {
      // Inject CSS to center content on web
      const style = document.createElement("style");
      style.id = "web-center-wrapper";
      style.textContent = `
        #root {
          display: flex !important;
          justify-content: center !important;
          align-items: stretch !important;
        }
        #root > div {
          max-width: 1400px !important;
          width: 100% !important;
          margin: 0 auto !important;
          display: flex !important;
          flex-direction: column !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <View style={[styles.appShell, Platform.OS === "web" && styles.webShell]}>
          <Provider store={store}>
            <RootNavigator />
          </Provider>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingTop: Platform.OS === "web" ? 0 : 0,
  },
  appShell: {
    flex: 1,
    width: "100%",
  },
  webShell: {
    maxWidth: "100%",
    alignSelf: "center",
    width: "100%",
    borderRadius: 0,
    overflow: "hidden",
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    marginVertical: 0,
  },
});
