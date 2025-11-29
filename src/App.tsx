import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { Platform } from "react-native";
import { useFonts } from "expo-font";
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
      // Load Inter font from Google Fonts for web
      const link = document.createElement("link");
      link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap";
      link.rel = "stylesheet";
      document.head.appendChild(link);

      // Add global font style
      const style = document.createElement("style");
      style.textContent = `
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(link);
        document.head.removeChild(style);
      };
    }
  }, []);

  if (!fontsLoaded && Platform.OS !== "web") {
    return null;
  }

  return (
    <Provider store={store}>
      <RootNavigator />
    </Provider>
  );
}
