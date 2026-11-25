// A place's page, which the app doesn't have yet: the same content as
// Cheetah's and the UIKit twin's (see bench/index.ts).
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { GlassIconButton } from "@/app/components/GlassButton";
import { BENCH_CARDS } from "@/bench";

const WIDTH = Dimensions.get("window").width;
const PHOTO = require("../assets/images/second-cup-card-full.jpeg");

export default function BenchPlace() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const place = BENCH_CARDS.find((card) => card.place_id === id) ?? BENCH_CARDS[0];
  return (
    <View style={{ flex: 1, backgroundColor: "#1f1f1f" }}>
      <View style={{ height: 320 }}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {[0, 1, 2, 3, 4].map((page) => (
            <Image key={page} source={PHOTO} style={{ width: WIDTH, height: 320 }} resizeMode="cover" />
          ))}
        </ScrollView>
        <BlurView intensity={30} tint="dark" style={[styles.bottom, { height: 75 }]} pointerEvents="none" />
        <LinearGradient
          pointerEvents="none"
          colors={["#1f1f1f00", "#1f1f1f40", "#1f1f1fa6"]}
          locations={[0, 0.6, 1]}
          style={[styles.bottom, { height: 90 }]}
        />
      </View>
      <View style={{ padding: 20, gap: 10 }}>
        <Text style={{ color: "#f5f5f5", fontSize: 26, fontFamily: "Brice-Bold" }}>{place.name}</Text>
        <Text style={styles.muted}>280m • 1 min • $$</Text>
        <View style={{ flexDirection: "row", gap: 4 }}>
          <Text style={{ color: "#4ade80", fontSize: 14, fontFamily: "Satoshi-Bold" }}>Open</Text>
          <Text style={styles.text}>· Closes at 6:00 PM</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <FontAwesome6 name="location-dot" size={14} color="#a3a3a3" />
          <Text style={styles.text}>{place.address}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <BlurView intensity={50} tint="light" style={styles.directions}>
            <Text style={{ color: "white", fontSize: 15, fontFamily: "Satoshi-Bold" }}>Directions</Text>
          </BlurView>
          <GlassIconButton icon="share" />
          <GlassIconButton icon="bookmark" />
        </View>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={() => router.back()}
        style={styles.close}
      >
        <FontAwesome6 name="chevron-down" size={18} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0 },
  text: { color: "#ffffff", fontSize: 14, fontFamily: "Satoshi-Medium" },
  muted: { color: "#a3a3a3", fontSize: 14, fontFamily: "Satoshi-Medium" },
  directions: {
    flex: 1, height: 48, borderRadius: 24, overflow: "hidden", alignItems: "center", justifyContent: "center",
  },
  close: {
    position: "absolute", top: 67, left: 16, width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center",
  },
});
