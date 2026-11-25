// Benchmark mode: the map with sample data, for measuring against Cheetah and
// UIKit (cheetah's CheetahPerformanceTests). Built with EXPO_PUBLIC_BENCH=1;
// without it none of this runs.
//
// iOS launch arguments land in Settings (NSUserDefaults):
//   -benchScreen suggestions   start on the suggestions, not the results
//   -benchVariant native       native sheet and native paging, instead of the
//                              app's own JS ones
import { useSyncExternalStore } from "react";
import { Platform, Settings } from "react-native";
import type { Card } from "@/app/lib/places/hooks";

export const BENCH = process.env.EXPO_PUBLIC_BENCH === "1";

const argument = (key: string): string | undefined =>
  BENCH && Platform.OS === "ios" ? Settings.get(key) : undefined;

export const BENCH_NATIVE = argument("benchVariant") === "native";
export const BENCH_RESULTS = BENCH && argument("benchScreen") !== "suggestions";

if (BENCH) {
  // Logging every render would slow the app unfairly.
  console.log = () => {};
}

const day = [{ start: "00:00", end: "23:59" }];
const hours = { mon: day, tue: day, wed: day, thu: day, fri: day, sat: day, sun: day };

const place = (
  place_id: string,
  name: string,
  address: string,
  lat: number,
  lng: number,
  distance_m: number,
  price_tier: number
): Card => ({ place_id, name, address, lat, lng, distance_m, price_tier, hours, photos: [] });

/** The Cheetah demo's sample places. */
export const BENCH_CARDS: Card[] = [
  place("java", "Java Haven", "Cedarwood Drive", 37.7793, -122.4192, 280, 2),
  place("pizza", "Pizza Paradise", "Market Street", 37.7849, -122.4094, 1200, 2),
  place("sushi", "Sushi Zen", "Hayes Valley", 37.7694, -122.4862, 700, 3),
  place("burger", "Burger Joint", "Mission Street", 37.7599, -122.4148, 520, 1),
];

/** Where Cheetah's map starts: on all the places, or before a search. */
export const BENCH_REGION = BENCH_RESULTS
  ? { latitude: 37.73145, longitude: -122.4478, latitudeDelta: 0.17986, longitudeDelta: 0.10466 }
  : { latitude: 37.7749, longitude: -122.4194, latitudeDelta: 0.025, longitudeDelta: 0.025 };

/** Where Cheetah's map goes for one place: its pin above the card. */
export const focusRegion = (card: Card) => ({
  latitude: card.lat - 0.00119,
  longitude: card.lng,
  latitudeDelta: 0.00524,
  longitudeDelta: 0.00305,
});

// Results shared between the native variant's map and its sheet, which is a
// screen of its own.
let cards: Card[] = BENCH_RESULTS ? BENCH_CARDS : [];
const listeners = new Set<() => void>();

export function setBenchCards(next: Card[]) {
  cards = next;
  listeners.forEach((listener) => listener());
}

export function useBenchCards(): Card[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => cards
  );
}
