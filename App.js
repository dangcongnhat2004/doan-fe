import * as Font from 'expo-font';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  const [fontsLoaded, setFontsLoaded] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    async function loadFonts() {
      try {
        await Font.loadAsync({
          // register fonts with the exact names used in TYPOGRAPHY
          'Inter': require('./src/assets/fonts/Inter_24pt-Regular.ttf'),
          'Inter_24pt-Regular': require('./src/assets/fonts/Inter_24pt-Regular.ttf'),
          'Inter_24pt-Medium': require('./src/assets/fonts/Inter_24pt-Medium.ttf'),
          'Inter_28pt-Bold': require('./src/assets/fonts/Inter_28pt-Bold.ttf'),
        });
        if (mounted) setFontsLoaded(true);
      } catch (e) {
        console.warn('Error loading fonts', e);
        if (mounted) setFontsLoaded(true);
      }
    }

    loadFonts();
    return () => {
      mounted = false;
    };
  }, []);

  if (!fontsLoaded) {
    // Render nothing (blank) while fonts load to avoid fallback font flash
    return null;
  }
  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <View style={[styles.appShell, Platform.OS === 'web' && styles.webShell]}>
          <RootNavigator />
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingTop: Platform.OS === 'web' ? 0 : 0,
  },
  appShell: {
    flex: 1,
    width: '100%',
  },
  webShell: {
    maxWidth: '100%',
    alignSelf: 'center',
    width: '100%',
    borderRadius: 0,
    overflow: 'hidden',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    marginVertical: 0,
  },
});
