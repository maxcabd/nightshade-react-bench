// app/components/Map/PlaceCard.tsx
import React, { useMemo } from "react";
import { BlurView } from "expo-blur";
import { View, Text, Dimensions, TouchableOpacity, Image } from "react-native";
// The carousel's own gestures swallow React Native's presses.
import { Pressable } from "react-native-gesture-handler";
import Animated, {
    SharedValue,
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolate,
    runOnJS,
} from "react-native-reanimated";
import Carousel from "react-native-reanimated-carousel";

import { LinearGradient } from "expo-linear-gradient";

import FontAwesome from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { EXPANDED_HEIGHT } from "./PlaceCardCarousel";
import { GlassIconButton } from "@/app/components/GlassButton";
import { BENCH, BENCH_NATIVE } from "@/bench";
import { useRouter } from "expo-router";

// API
import type { Card } from "@/app/lib/places/hooks";
import { getOpenStatus } from "@/app/lib/places/hours";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CARD_WIDTH = SCREEN_WIDTH * (BENCH ? 0.78 : 0.9);
const CARD_HEIGHT = EXPANDED_HEIGHT;
const HEADER_HEIGHT = BENCH ? 148 : 180;
const RADIUS = 28;

const COLORS = ["#ff6b6b", "#ffa07a", "#98d8c8", "#4ecdc4", "#45b7d1"];
const DEFAULT_PHOTO = require("../../../assets/images/second-cup-card-full.jpeg");

interface PlaceCardProps {
    restaurant: Card;
    setCarouselScrollEnabled?: (enabled: boolean) => void;
}
/** Dot: active dot larger + others transparent */
function Dot({ index, progress }: { index: number; progress: SharedValue<number> }) {
    const style = useAnimatedStyle(() => {
        const p = progress.value;

        const opacity = interpolate(
            p,
            [index - 0.75, index, index + 0.75],
            [0.22, 1, 0.22],
            Extrapolate.CLAMP
        );

        const scale = interpolate(
            p,
            [index - 0.75, index, index + 0.75],
            [1, 1.55, 1],
            Extrapolate.CLAMP
        );

        return { opacity, transform: [{ scale }] };
    });

    return (
        <Animated.View
            style={[
                {
                    width: 5,
                    height: 5,
                    borderRadius: 4,
                    marginHorizontal: 3,
                    backgroundColor: "white",
                },
                style,
            ]}
        />
    );
}

/** The photos on the platform's paging scroll view (bench's native variant). */
function NativePhotos({ progress, pages }: { progress: SharedValue<number>; pages: number }) {
    const onScroll = useAnimatedScrollHandler((event) => {
        progress.value = event.contentOffset.x / CARD_WIDTH;
    });
    return (
        <Animated.ScrollView
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={1}
        >
            {Array.from({ length: pages }, (_, page) => (
                <Image
                    key={page}
                    source={DEFAULT_PHOTO}
                    style={{ width: CARD_WIDTH, height: HEADER_HEIGHT }}
                    resizeMode="cover"
                />
            ))}
        </Animated.ScrollView>
    );
}

export default function RestaurantCard({
    restaurant,
    setCarouselScrollEnabled,
}: PlaceCardProps) {
    const progress = useSharedValue(0);
    const router = useRouter();

    console.log('🕐 PlaceCard DEBUG for:', restaurant.name);
    console.log('🕐 Has hours?', !!restaurant.hours);
    console.log('🕐 Hours value:', restaurant.hours);

    const photos = useMemo(() => {
        const rest = restaurant.photos?.length ? restaurant.photos : ["b", "c", "d", "e"];
        return ["DEFAULT_LOCAL", ...rest];
    }, [restaurant.photos]);

    const openStatus = useMemo(() => {
        return getOpenStatus(restaurant.hours);
    }, [restaurant.hours]);

    // Format distance
    const distanceText = useMemo(() => {
        if (!restaurant.distance_m) return null;
        if (restaurant.distance_m < 1000) {
            return `${Math.round(restaurant.distance_m)}m`;
        }
        return `${(restaurant.distance_m / 1000).toFixed(1)}km`;
    }, [restaurant.distance_m]);

    // Estimate drive time (rough: 30 km/h avg)
    const driveTime = useMemo(() => {
        if (!restaurant.distance_m) return null;
        const mins = Math.round((restaurant.distance_m / 1000) / 30 * 60);
        return `${Math.max(1, mins)} min`;
    }, [restaurant.distance_m]);

    // Price tier
    const priceTier = useMemo(() => {
        return '$'.repeat(Math.min(restaurant.price_tier || 1, 4));
    }, [restaurant.price_tier]);

    const renderItem = React.useCallback(({ index }: { index: number }) => {
        return (
            <Image
                source={DEFAULT_PHOTO}
                style={{
                    width: CARD_WIDTH,
                    height: HEADER_HEIGHT,
                }}
                resizeMode="cover"
            />
        );
    }, []);

    return (
        <Animated.View
            testID={`card-${restaurant.place_id}`}
            style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                borderRadius: RADIUS,
            }}
            className="bg-[#1f1f1f] overflow-hidden self-center"
        >
            {/* Inner border overlay */}
            <View
                pointerEvents="none"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: RADIUS,
                    borderWidth: 2,
                    borderColor: 'rgba(255,255,255,0.03)',
                    zIndex: 10,
                }}
            />

            {/* HEADER: horizontal pager */}
            <View style={{ height: HEADER_HEIGHT }}>
                {BENCH_NATIVE ? (
                    <NativePhotos progress={progress} pages={photos.length} />
                ) : <Carousel
                    width={CARD_WIDTH}
                    height={HEADER_HEIGHT}
                    loop={false}
                    data={photos}
                    snapEnabled
                    onProgressChange={(_, absoluteProgress) => {
                        progress.value = absoluteProgress;
                    }}
                    onScrollBegin={() => {
                        if (setCarouselScrollEnabled) {
                            runOnJS(setCarouselScrollEnabled)(false);
                        }
                    }}
                    onScrollEnd={() => {
                        if (setCarouselScrollEnabled) {
                            runOnJS(setCarouselScrollEnabled)(true);
                        }
                    }}
                    renderItem={renderItem}
                />}


                {/* The bleed: bg -> transparent (overlay ON TOP of image) */}
                <LinearGradient
                    pointerEvents="none"
                    colors={[
                        "rgba(11,11,15,0)",  // transparent up top


                        "rgba(11,11,15,0.35)",

                        "rgba(11,11,15,0.7)",
                        "#1f1f1f",
                    ]}
                    locations={[0, 0.5, 0.8, 1]}
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: 45, // controls how far it bleeds upward
                        opacity: 1,
                    }}
                />





                {/* Top controls */}
                <View className="absolute left-0 right-0 top-0 flex-row justify-between p-4">
                    <GlassIconButton icon="chevron-up" />
                    <View className="flex-row items-center gap-x-2">
                        {(["bookmark", "share", "plus"] as const).map((icon, i) => (
                            <GlassIconButton key={i} icon={icon} />
                        ))}
                    </View>
                </View>

                {/* Dots */}
                <View className="absolute left-0 right-0 bottom-3 flex-row justify-center">
                    {photos.slice(0, 5).map((_, i) => (
                        <Dot key={i} index={i} progress={progress} />
                    ))}
                </View>
            </View>


            {/* BODY */}
            <Pressable
                className="px-5 pt-3 pb-5"
                accessible={false}
                disabled={!BENCH}
                onPress={() =>
                    router.push({ pathname: "/benchPlace", params: { id: restaurant.place_id } })
                }
            >
                <Text className="text-white text-[18px] font-brice-bold mb-1" numberOfLines={1}>
                    {restaurant.name}
                </Text>

                <View className="flex-row items-center mb-1">
                    <Text className="font-satoshi-medium text-white/95 text-md">
                        {restaurant.address}
                    </Text>
                    {driveTime && (
                        <>
                            <Text className="font-satoshi-medium text-white/95 mx-1.5">•</Text>
                            <MaterialIcons name="directions-car" size={14} color="white" />
                            <Text className="font-satoshi-medium text-white/95 text-md ml-1">
                                {driveTime} • {priceTier}
                            </Text>
                        </>
                    )}
                </View>

                <View className="flex-row items-center mb-4">
                    {openStatus.isOpen ? (
                        <>
                            <Text className="font-satoshi-bold text-[#4ADE80] text-md">Open</Text>
                            <Text className="font-satoshi-medium text-white mx-1.5">•</Text>
                            <Text className="font-satoshi-medium text-white text-md">
                                Closes at {openStatus.closesAt}
                            </Text>
                        </>
                    ) : (
                        <>
                            <Text className="font-satoshi-bold text-red-400 text-md">Closed</Text>
                            {openStatus.opensAt && openStatus.nextOpenDay && (
                                <>
                                    <Text className="font-satoshi-medium text-white mx-1.5">•</Text>
                                    <Text className="font-satoshi-medium text-white/70 text-md">
                                        Opens {openStatus.nextOpenDay === 'today' ? '' : openStatus.nextOpenDay + ' '}
                                        at {openStatus.opensAt}
                                    </Text>
                                </>
                            )}
                        </>
                    )}
                </View>

                <View className="flex-row items-center border border-neutral-700 self-start px-3 py-2 rounded-full">
                    <View className="bg-white rounded-full w-4 h-4 items-center justify-center mr-2">
                        <FontAwesome name="google" size={8} color="#4285F4" />
                    </View>
                    <Text className="font-satoshi-medium  text-white text-[12px]">4.3 (50+)</Text>
                </View>
            </Pressable>
        </Animated.View>
    );
}