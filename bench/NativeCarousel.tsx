// The result cards on the platform's own paging scroll view. Only the
// neighbours' scale runs in Reanimated, on the UI thread.
import React from "react";
import { Dimensions, View } from "react-native";
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import RestaurantCard from "@/app/components/Map/PlaceCard";
import { EXPANDED_HEIGHT } from "@/app/components/Map/PlaceCardCarousel";
import type { Card } from "@/app/lib/places/hooks";

const SCREEN = Dimensions.get("window").width;
const PAGE = SCREEN * 0.78 + 10;

const Page = React.memo(function Page({ card, index, x }: { card: Card; index: number; x: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          x.value / PAGE,
          [index - 1, index, index + 1],
          [0.9, 1, 0.9],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));
  return (
    <Animated.View style={[{ width: PAGE, alignItems: "center" }, style]}>
      <RestaurantCard restaurant={card} />
    </Animated.View>
  );
});

export default function NativeCarousel({ cards, onPage }: { cards: Card[]; onPage: (card: Card) => void }) {
  const x = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    x.value = event.contentOffset.x;
  });
  return (
    <View style={{ height: EXPANDED_HEIGHT + 20, justifyContent: "flex-end", alignItems: "center" }}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={{ width: PAGE, flexGrow: 0, overflow: "visible" }}
        onScroll={onScroll}
        scrollEventThrottle={1}
        onMomentumScrollEnd={(event) => {
          const card = cards[Math.round(event.nativeEvent.contentOffset.x / PAGE)];
          if (card) onPage(card);
        }}
      >
        {cards.map((card, index) => (
          <Page key={card.place_id} card={card} index={index} x={x} />
        ))}
      </Animated.ScrollView>
    </View>
  );
}
