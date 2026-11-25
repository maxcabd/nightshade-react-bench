// The map screen with a native sheet (app/benchSheet.tsx, a react-native-screens
// form sheet) and native paging.
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Haptics from "expo-haptics";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import type { Card } from "@/app/lib/places/hooks";
import NativeCarousel from "./NativeCarousel";
import { BENCH_REGION, useBenchCards } from "./index";

export default function NativeMap() {
  const router = useRouter();
  const map = useRef<MapView>(null);
  const cards = useBenchCards();

  useEffect(() => {
    router.push("/benchSheet");
  }, [router]);

  const focus = (card: Card) => {
    Haptics.selectionAsync();
    map.current?.animateToRegion(
      { latitude: card.lat, longitude: card.lng, latitudeDelta: 0.004, longitudeDelta: 0.004 },
      500
    );
  };

  useEffect(() => {
    if (cards.length > 0) setTimeout(() => focus(cards[0]), 300);
  }, [cards]);

  return (
    <View style={{ flex: 1 }}>
      <MapView ref={map} style={StyleSheet.absoluteFill} initialRegion={BENCH_REGION} userInterfaceStyle="dark" mapType="mutedStandard" showsPointsOfInterest={false} showsBuildings={false} showsUserLocation>
        {cards.map((card) => (
          <Marker
            key={card.place_id}
            tracksViewChanges={false}
            coordinate={{ latitude: card.lat, longitude: card.lng }}
          >
            <View style={styles.pin}>
              <FontAwesome6 name="utensils" size={14} color="white" />
            </View>
          </Marker>
        ))}
      </MapView>
      {cards.length > 0 && (
        <View style={styles.carousel} pointerEvents="box-none">
          <NativeCarousel cards={cards} onPage={focus} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  carousel: { position: "absolute", left: 0, right: 0, bottom: 224 },
  pin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#404040",
    borderWidth: 3,
    borderColor: "#262626",
    alignItems: "center",
    justifyContent: "center",
  },
});
