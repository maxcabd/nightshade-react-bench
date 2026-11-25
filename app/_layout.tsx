import "../global.css";
import "react-native-gesture-handler";
import { Stack, SplashScreen } from "expo-router";

import { useFonts } from "expo-font";
import { useEffect } from "react";
import { Dimensions } from "react-native";
import { BENCH_RESULTS } from "@/bench";

import { QueryProvider } from "./providers/QueryProvider";
import { GestureHandlerRootView } from "react-native-gesture-handler";

/** Only the fonts the benchmarked screens use. */
const BENCH_FONTS = {
  "Satoshi-Medium": require("./../assets/fonts/Satoshi-Medium.otf"),
  "Satoshi-Bold": require("./../assets/fonts/Satoshi-Bold.otf"),
  "Brice-Semibold": require("./../assets/fonts/Brice-Semi-Bold.otf"),
  "Brice-Bold": require("./../assets/fonts/Brice-Bold.otf"),
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts(BENCH_FONTS);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <QueryProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="benchPlace"
            options={{ headerShown: false, presentation: "fullScreenModal" }}
          />
          <Stack.Screen
            name="benchSheet"
            options={{
              headerShown: false,
              presentation: "formSheet",
              animation: "none",
              gestureEnabled: false,
              sheetAllowedDetents: [(BENCH_RESULTS ? 120 : 320) / Dimensions.get("window").height],
              sheetInitialDetentIndex: 0,
              sheetCornerRadius: 54,
              sheetLargestUndimmedDetentIndex: "last",
            }}
          />
        </Stack>
      </GestureHandlerRootView>
    </QueryProvider>
  );
}
