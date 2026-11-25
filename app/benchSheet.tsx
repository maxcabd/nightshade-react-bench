// The native variant's search sheet (see bench/index.ts).
import { useNavigation } from "expo-router";
import React, { useLayoutEffect } from "react";
import { Dimensions, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { BENCH_CARDS, setBenchCards, useBenchCards } from "@/bench";

const HEIGHT = Dimensions.get("window").height;
const SUGGESTIONS = [
  "Cafes within 12 min walk",
  "Best dessert spots near me",
  "Halal spots in Ottawa",
  "Best brunch spots",
  "Casual catch up with friends",
  "Nearby spots that open late night",
  "Amazing pizza places",
];

export default function BenchSheet() {
  const navigation = useNavigation();
  const results = useBenchCards().length > 0;

  useLayoutEffect(() => {
    navigation.setOptions({ sheetAllowedDetents: [(results ? 120 : 320) / HEIGHT] });
  }, [navigation, results]);

  return (
    <View style={{ flex: 1, backgroundColor: "#171717", paddingTop: 24 }}>
      {!results && (
        <View style={{ height: 212 }}>
          <Text
            style={{
              color: "white", fontSize: 20, lineHeight: 26, fontFamily: "Brice-Semibold",
              marginBottom: 14, paddingHorizontal: 24,
            }}
          >
            Ready to discover?
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, width: 600 }}>
              {SUGGESTIONS.map((text) => (
                <TouchableOpacity
                  key={text}
                  accessibilityRole="button"
                  onPress={() => setBenchCards(BENCH_CARDS.slice(0, 1))}
                  style={{
                    height: 42, paddingHorizontal: 14, borderRadius: 18, justifyContent: "center",
                    backgroundColor: "#242424", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
                  }}
                >
                  <Text style={{ color: "white", fontSize: 14, fontFamily: "Satoshi-Bold" }}>{text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
      <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 24, alignItems: "center" }}>
        <TextInput
          placeholder={results ? "Ask a follow up" : "What are you in the mood for?"}
          placeholderTextColor="#a3a3a3"
          style={{
            flex: 1, height: 52, borderRadius: 26, paddingHorizontal: 20, color: "white", fontSize: 16,
            backgroundColor: "#242424", borderWidth: 1, borderColor: "#2d2d2d",
          }}
        />
        {results && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Clear"
            onPress={() => setBenchCards([])}
            style={{
              width: 44, height: 44, borderRadius: 22, backgroundColor: "#242424",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <FontAwesome6 name="xmark" size={18} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
