import React, { useRef, forwardRef, useImperativeHandle } from "react";
import { View, Dimensions } from "react-native";
import { interpolate } from "react-native-reanimated";
import Carousel, { ICarouselInstance } from "react-native-reanimated-carousel";
import { BENCH } from "@/bench";
import RestaurantCard from "./PlaceCard";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Reducing width slightly to 80% increases the "peak" of the side cards
const CARD_WIDTH = SCREEN_WIDTH;
export const EXPANDED_HEIGHT = BENCH ? 280 : 320; // Reduced height to match original position

const RestaurantCardCarousel = forwardRef<ICarouselInstance, {
    restaurants: any[];
    onRestaurantChange?: (restaurant: any, index: number) => void;
}>(({ restaurants, onRestaurantChange }, ref) => {
    const carouselRef = useRef<ICarouselInstance>(null);

    // Forward the carousel methods to the parent component
    useImperativeHandle(ref, () => ({
        scrollTo: (params) => carouselRef.current?.scrollTo(params),
        next: (params) => carouselRef.current?.next(params),
        prev: (params) => carouselRef.current?.prev(params),
        getCurrentIndex: () => carouselRef.current?.getCurrentIndex() ?? 0,
    }));

    const animationStyle = React.useCallback((value: number) => {
        "worklet";

        // Scale side cards down
        const scale = interpolate(value, [-1, 0, 1], [0.85, 1, 0.85]);

        // Parallax: Adjust this factor to bring side cards closer or further
        // 1.15 adds a slight gap so they don't touch the center card
        const translateX = interpolate(
            value,
            [-1, 0, 1],
            [-CARD_WIDTH * 1.05, 0, CARD_WIDTH * 1.05]
        );

        const opacity = interpolate(value, [-1, 0, 1], [1, 1, 1]);

        return {
            transform: [{ scale }, { translateX }],
            opacity,
        };
    }, []);

    if (!restaurants.length) return null;

    return (
        <View style={{ height: EXPANDED_HEIGHT + 20 }} className="justify-end">
            <Carousel
                ref={carouselRef}
                loop={false}
                // width here is the 'step' distance. Must match the card width logic.
                width={CARD_WIDTH}
                height={EXPANDED_HEIGHT}
                style={{
                    width: SCREEN_WIDTH,
                    overflow: 'visible', // Crucial for "peeking"
                }}
                // This centers the active card on the screen
                pagingEnabled={true}
                snapEnabled={true}
                data={restaurants}
                onSnapToItem={(index) => onRestaurantChange?.(restaurants[index], index)}
                customAnimation={animationStyle}
                scrollAnimationDuration={600}
                windowSize={3}
                renderItem={({ item, index }) => (
                    <View style={{ width: CARD_WIDTH, alignSelf: 'center' }}>
                        <RestaurantCard restaurant={item} />
                    </View>
                )}
            />
        </View>
    );
});

RestaurantCardCarousel.displayName = 'RestaurantCardCarousel';

export default RestaurantCardCarousel;