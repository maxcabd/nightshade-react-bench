import React from "react";
import { View } from "react-native";
import { Marker } from "react-native-maps";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

const cuisineIcons: Record<string, { name: any; color: string }> = {
  coffee: { name: "coffee", color: "#7B3F00" },
  fastfood: { name: "hamburger", color: "#FF4500" },
  food: { name: "utensils", color: "#D32F2F" },
  pizza: { name: "pizza-slice", color: "#FFA500" },
  sushi: { name: "fish", color: "#008080" },
};

function firstCuisine(restaurant: any): string {
  const c = restaurant?.cuisine;
  if (Array.isArray(c) && c.length > 0 && typeof c[0] === "string") return c[0];
  if (typeof c === "string" && c.trim()) return c;
  return "food";
}

const CustomMarker = ({ restaurant }: { restaurant: any }) => {
  const cuisine = firstCuisine(restaurant);
  const icon = cuisineIcons[cuisine] ?? cuisineIcons.food;

  const lat = restaurant?.location?.latitude;
  const lng = restaurant?.location?.longitude;

  // If coords are missing, don't render a marker (prevents another common crash)
  if (typeof lat !== "number" || typeof lng !== "number") return null;

  return (
    <Marker coordinate={{ latitude: lat, longitude: lng }} title={restaurant?.name ?? ""}>
      <View className="justify-center items-center bg-white border-gray-800/50 border p-2 rounded-full w-14 h-14 shadow-lg">
        <FontAwesome5 name={icon.name} size={20} color={icon.color} />
      </View>
    </Marker>
  );
};

export default CustomMarker;
