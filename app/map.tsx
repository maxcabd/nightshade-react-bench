// app/map.tsx
import { useRouter } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import MapView, { Region, Marker } from "react-native-maps";
import BottomSheet from "@gorhom/bottom-sheet";
import { restaurants } from "./../data/restaurants";
import Animated, {
  useAnimatedStyle,
  interpolate,
  useSharedValue,
  Extrapolation,
  useDerivedValue,
  useAnimatedKeyboard,
} from "react-native-reanimated";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Keyboard,
} from "react-native";

import CustomMarker from "@/app/components/Map/CustomMarker";
import SearchBottomSheet from "@/app/components/Map/SearchSheet";
import RestaurantCardCarousel from "@/app/components/Map/PlaceCardCarousel";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useSearchRestaurantsMutation } from "@/app/lib/places/hooks";
import type { Card } from "@/app/lib/places/hooks";
import type { ICarouselInstance } from "react-native-reanimated-carousel";

import { BENCH, BENCH_CARDS, BENCH_REGION, BENCH_RESULTS } from "@/bench";

const SEARCH_BAR_HEIGHT = 72;
const BOTTOM_INPUT_BLOCK = SEARCH_BAR_HEIGHT + 112 + 12;
const CAROUSEL_BOTTOM_GAP = 29;

const Z = {
  MAP: 0,
  CAROUSEL: 40,
  SHEET: 60,
  SEARCH_BAR: 80,
};

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#000000" }] },
  { featureType: "water", stylers: [{ color: "#000000" }] },
];

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const Map = () => {
  const [region, setRegion] = useState<Region | null>(BENCH ? BENCH_REGION : null);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");
  const [hasResults, setHasResults] = useState(BENCH_RESULTS);
  const [followups, setFollowups] = useState<string[]>([]);
  const [searchCards, setSearchCards] = useState<Card[]>(BENCH_RESULTS ? BENCH_CARDS : []);
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);
  const carouselRef = useRef<ICarouselInstance>(null); // Properly typed carousel reference
  const router = useRouter();
  const animatedIndex = useSharedValue(1);

  // React Query mutation for search
  const searchMutation = useSearchRestaurantsMutation();

  const keyboard = useAnimatedKeyboard();
  const animatedSearchBarStyles = useAnimatedStyle(() => {
    const sheetTranslateY = interpolate(
      animatedIndex.value,
      [-1, 0],
      [200, 0],
      Extrapolation.CLAMP
    );

    const kb = keyboard.height.value * 0.75;

    return {
      transform: [
        { translateY: sheetTranslateY },
        { translateY: -kb },
      ],
    };
  });

  const pointerEvents = useDerivedValue(() => {
    return animatedIndex.value <= 0.5 ? "auto" : "box-none";
  });

  const inputRef = useRef<any>(null);

  const handleBackPress = () => {
    router.back();
  };

  const handleSearch = (query: string) => {
    console.log("Searching for:", query);

    if (!query.trim()) {
      console.log("Empty query, skipping search");
      return;
    }

    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bottomSheetRef.current?.snapToIndex(1);
    setHasResults(false);
    setFollowups([]);
    setSearchCards([]);
    setSelectedCardIndex(0);
    setLastSearchedQuery(query.trim());

    if (BENCH) {
      // The result is already here: only showing it is measured.
      const cards = BENCH_CARDS.slice(0, 1);
      setHasResults(true);
      setFollowups(["Open now", "With patio", "Quieter"]);
      setSearchCards(cards);
      setTimeout(() => fitMapToResults(cards), 300);
      setTimeout(() => bottomSheetRef.current?.snapToIndex(0), 100);
      return;
    }

    searchMutation.mutate({
      text: query.trim(),
    }, {
      onSuccess: (data) => {
        console.log("📊 Search results:", data);
        console.log("📍 Title:", data.title);
        console.log("🎯 Intent:", data.intent);
        console.log("🍽️  Found restaurants:", data.cards.length);
        console.log("💡 Follow-up suggestions:", data.followups);

        setHasResults(true);
        setFollowups(data.followups || []);
        setSearchCards(data.cards || []);
        setSearchQuery("");

        // Fit all pins on the map when results arrive
        if (data.cards && data.cards.length > 0) {
          setTimeout(() => {
            fitMapToResults(data.cards);
          }, 300);
        }

        // Collapse bottom sheet to lowest snap point after results
        setTimeout(() => {
          bottomSheetRef.current?.snapToIndex(0);
        }, 100);
      },
      onError: (error) => {
        console.error("❌ Search error:", error);
      },
    });
  };

  const fitMapToResults = (cards: Card[]) => {
    if (!mapRef.current || cards.length === 0) return;

    if (BENCH) {
      focusPlace(cards[0]);
      return;
    }

    const coordinates = cards.map(card => ({
      latitude: card.lat,
      longitude: card.lng,
    }));

    // Calculate the actual height taken up by UI elements at the bottom
    // Carousel height is approximately 180-200px + gap + search bar
    const CAROUSEL_HEIGHT = 200;
    const totalBottomPadding = BOTTOM_INPUT_BLOCK + CAROUSEL_HEIGHT + CAROUSEL_BOTTOM_GAP + 50;

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: {
        top: 100,
        right: 50,
        bottom: totalBottomPadding,
        left: 50,
      },
      animated: true,
    });
  };

  // Where Cheetah and the UIKit twin move the map.
  const focusPlace = (card: Card) => {
    mapRef.current?.animateToRegion(
      { latitude: card.lat, longitude: card.lng, latitudeDelta: 0.004, longitudeDelta: 0.004 },
      500
    );
  };

  useEffect(() => {
    if (BENCH_RESULTS) setTimeout(() => focusPlace(BENCH_CARDS[0]), 300);
  }, []);

  const handleRestaurantChange = (restaurant: any, index: number) => {
    console.log("Selected:", restaurant.name, "at index", index);
    setSelectedCardIndex(index);

    // Animate map to the selected restaurant
    const card = searchCards[index];
    if (BENCH && card) {
      focusPlace(card);
      Haptics.selectionAsync();
    } else if (card && mapRef.current) {
      // We want the pin to appear in the visible area above the carousel
      // Carousel + search bar covers ~340px from bottom (EXPANDED_HEIGHT 320 + gaps)
      // On a typical phone (844px tall), that's 40% of screen
      // 
      // The map viewport shows a latitudeDelta range centered on the region's latitude
      // If we center exactly at the pin's latitude, it appears at screen center (50% height)
      // But carousel covers bottom 40%, so center is hidden
      // 
      // We want pin at ~30% from top (visible above carousel)
      // This means the map's center should be BELOW the pin
      // To move center down = subtract from latitude (south is lower lat)

      const latitudeDelta = 0.015;
      const longitudeDelta = 0.015;

      // Shift the center downward so pin appears in upper 30% of screen
      // Carousel takes ~40% from bottom, so we shift center by 20% of delta
      const latitudeOffset = latitudeDelta * 0.40;

      mapRef.current.animateToRegion({
        latitude: card.lat - latitudeOffset, // CENTER below pin → PIN appears above
        longitude: card.lng,
        latitudeDelta: latitudeDelta,
        longitudeDelta: longitudeDelta,
      }, 500);

      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSendSearch = () => {
    if (searchQuery.trim() && !searchMutation.isPending) {
      handleSearch(searchQuery);
      Keyboard.dismiss();
    }
  };

  const handleStopSearch = () => {
    searchMutation.reset();
    console.log("Search stopped");
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setLastSearchedQuery("");
    setHasResults(false);
    setFollowups([]);
    setSearchCards([]);
    setSelectedCardIndex(0);
    searchMutation.reset();
    bottomSheetRef.current?.snapToIndex(1);
  };

  const handleShowOnMap = () => {
    bottomSheetRef.current?.snapToIndex(0);
  };

  const handleSearchFocus = () => {
    setTimeout(() => {
      bottomSheetRef.current?.snapToIndex(3);
    }, 100);
  };

  const handleSearchBlur = () => {
    if (!searchMutation.isPending) {
      bottomSheetRef.current?.snapToIndex(1);
    }
  };

  useEffect(() => {
    if (BENCH) return;
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    })();
  }, []);

  useEffect(() => {
    if (searchMutation.isPending) {
      console.log("Search in progress...");
    }
    if (searchMutation.isError) {
      console.error("Search mutation error:", searchMutation.error);
    }
  }, [searchMutation.isPending, searchMutation.isError]);

  return (
    <View style={styles.container}>
      {region && (
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          customMapStyle={darkMapStyle}
          userInterfaceStyle="dark"
          mapType="mutedStandard"
          showsPointsOfInterest={false}
          showsBuildings={false}
          showsUserLocation={true}
        >
          {/* Static restaurant markers (when no search results) */}
          {!hasResults && restaurants.map((restaurant) => (
            <CustomMarker key={restaurant.id} restaurant={restaurant} />
          ))}

          {/* Search result markers */}
          {hasResults && searchCards.map((card, index) => (
            <Marker
              key={`search-${card.place_id}-${index}`}
              coordinate={{
                latitude: card.lat,
                longitude: card.lng,
              }}
              onPress={() => {
                // When a pin is pressed, scroll to that card in the carousel
                console.log("Pin pressed at index:", index);
                setSelectedCardIndex(index);

                // Scroll the carousel to this index
                if (carouselRef.current) {
                  carouselRef.current.scrollTo({
                    index,
                    animated: true
                  });
                }

                // Haptic feedback
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: index === selectedCardIndex ? '#ef4444' : '#404040',
                  borderWidth: 3,
                  borderColor: index === selectedCardIndex ? '#ffffff' : '#262626',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              >
                <FontAwesome6
                  name="utensils"
                  size={14}
                  color="white"
                />
              </View>
            </Marker>
          ))}
        </MapView>
      )}

      {/* Restaurant Card Carousel - floating above map */}
      {hasResults && searchCards.length > 0 && (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: BOTTOM_INPUT_BLOCK + CAROUSEL_BOTTOM_GAP,
            zIndex: Z.CAROUSEL,
            elevation: Z.CAROUSEL,
          }}
        >
          <RestaurantCardCarousel
            ref={carouselRef}
            restaurants={searchCards}
            onRestaurantChange={handleRestaurantChange}
          />
        </View>
      )}

      {/* Bottom Sheet */}
      <SearchBottomSheet
        ref={bottomSheetRef}
        onSearch={handleSearch}
        animatedIndex={animatedIndex}
        isSearching={searchMutation.isPending}
        searchQuery={lastSearchedQuery}
        hasResults={hasResults}
        followups={followups}
        onShowOnMap={handleShowOnMap}
      />

      {/* Search Bar Container */}
      <Animated.View
        pointerEvents={animatedIndex.value <= 0 ? "auto" : "box-none"}
        className="absolute left-0 right-0 bottom-0 bg-[#171717] px-6 pt-1 pb-28"
        style={[
          {
            zIndex: Z.SEARCH_BAR,
            elevation: Z.SEARCH_BAR,
          },
          animatedSearchBarStyles,
        ]}
      >
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', }}>
          <View
            className="bg-[#242424] rounded-3xl"
            style={{
              flex: 1,
              height: SEARCH_BAR_HEIGHT,
              borderWidth: 1,
              borderRadius: 50,
              borderCurve: 'continuous',
              borderColor: "#2d2d2d",
              position: 'relative',
            }}
          >
            <TextInput
              ref={inputRef}
              value={searchQuery}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              onChangeText={setSearchQuery}
              placeholder={hasResults ? "Ask a follow up" : "What are you in the mood for?"}
              placeholderTextColor="#737373"
              className="text-white font-inter-bold text-[20px]"
              editable={!searchMutation.isPending}
              multiline={false}
              textAlignVertical="center"
              style={{
                height: "100%",
                color: "white",
                fontSize: 16,
                paddingHorizontal: 32,
                paddingVertical: 0,
                paddingRight: searchQuery.trim() ? 120 : 32,
                includeFontPadding: false,
              }}
              onSubmitEditing={handleSendSearch}
            />
            {searchQuery.trim() && (
              <View className="flex-row gap-2" style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: [{ translateY: -18 }],
              }}>
                <TouchableOpacity
                  onPress={searchMutation.isPending ? handleStopSearch : handleSendSearch}
                  className={`${searchMutation.isPending ? 'bg-[#404040]' : 'bg-red-600'} rounded-full w-10 h-10 items-center justify-center`}
                  activeOpacity={0.8}
                >
                  {searchMutation.isPending ? (
                    <View className="w-3 h-3 bg-white" style={{ borderRadius: 2 }} />
                  ) : (
                    <FontAwesome6 name="arrow-up" size={15} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Reset chat button - only shows when hasResults */}
          {hasResults && (
            <TouchableOpacity
              onPress={handleClearSearch}
              accessibilityRole="button"
              accessibilityLabel="Clear"
              activeOpacity={0.8}
              className="w-12 h-12 rounded-full bg-[#242424] border border-[#2d2d2d] items-center justify-center"
            >
              <FontAwesome6 name="xmark" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
});

export default Map;