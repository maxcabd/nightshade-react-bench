// app/components/Map/SearchBottomSheet.tsx
import React, { forwardRef, useMemo, useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Keyboard,
    TextInput,
    Platform,
} from "react-native";
import BottomSheet, {
    useBottomSheetTimingConfigs,
    BottomSheetFooter,
    BottomSheetFooterProps,
} from "@gorhom/bottom-sheet";
import Animated, {
    useAnimatedStyle,
    withTiming,
    useSharedValue,
    Easing,
    SharedValue,
    useAnimatedKeyboard,
} from "react-native-reanimated";
import FontAwesome from "@expo/vector-icons/FontAwesome5";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SquircleView from "react-native-fast-squircle";

interface SearchBottomSheetProps {
    onSearch?: (query: string) => void;
    onAnimate?: (position: number) => void;
    animatedIndex: SharedValue<number>;
    isSearching?: boolean;
    searchQuery?: string;
    hasResults?: boolean;
    followups?: string[];
    onShowOnMap?: () => void;
}

const FOOD_EMOJIS = ["🍕", "🍔", "🍣", "🍜", "🌮", "🍝", "🥗", "🍱"];

// ---- Sticky footer sizing tokens (target-like) ----
const CHIPS_HEIGHT = 42;
const INPUT_HEIGHT = 52;
const ICON_ROW_HEIGHT = 42;

const FOOTER_PAD_TOP = 12;
const FOOTER_PAD_BOTTOM = 80;

const GAP_AFTER_CHIPS = 12;
const GAP_AFTER_INPUT = 14;

// Base footer height WITHOUT safe-area inset (we add insets.bottom at runtime)
const BASE_FOOTER_HEIGHT =
    FOOTER_PAD_TOP +
    CHIPS_HEIGHT +
    GAP_AFTER_CHIPS +
    INPUT_HEIGHT +
    GAP_AFTER_INPUT +
    ICON_ROW_HEIGHT +
    FOOTER_PAD_BOTTOM;

const SearchBottomSheet = forwardRef<BottomSheet, SearchBottomSheetProps>(
    (
        {
            onSearch,
            onAnimate,
            animatedIndex,
            isSearching = false,
            searchQuery = "",
            hasResults = false,
            followups = [],
            onShowOnMap,
        },
        ref
    ) => {
        const insets = useSafeAreaInsets();
        const keyboard = useAnimatedKeyboard();

        const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
        const snapPoints = useMemo(
            () => (isKeyboardOpen ? ["24%", "52%", "85%", "92%"] : ["24%", "52%", "85%"]),
            [isKeyboardOpen]
        );

        const [isCollapsed, setIsCollapsed] = useState(false);
        const [scrollKey, setScrollKey] = useState(0);
        const [currentSheetIndex, setCurrentSheetIndex] = useState(1);

        // Animate only the BODY (not the sticky footer) to avoid footer clipping/masking.
        const bodyOpacity = useSharedValue(1);
        const bodyScale = useSharedValue(1);

        const [currentEmojiIndex, setCurrentEmojiIndex] = useState(0);

        // Sticky footer input state
        const [followupText, setFollowupText] = useState("");
        const [followupFocused, setFollowupFocused] = useState(false);

        // Real runtime footer height includes safe-area bottom
        const footerHeight = hasResults ? BASE_FOOTER_HEIGHT + insets.bottom : 20;
        const bodyPaddingBottom = footerHeight;

        const animationConfigs = useBottomSheetTimingConfigs({
            duration: 300,
            easing: Easing.bezier(0.34, 1.26, 0.64, 1), // Bouncy easing curve
        });

        const handleChipPress = useCallback(
            (text: string) => {
                if (isCollapsed || isSearching) return;
                onSearch?.(text);
            },
            [isCollapsed, isSearching, onSearch]
        );

        // Animate emoji cycling during search
        useEffect(() => {
            if (!isSearching) return;
            const interval = setInterval(() => {
                setCurrentEmojiIndex((prev) => (prev + 1) % FOOD_EMOJIS.length);
            }, 500);
            return () => clearInterval(interval);
        }, [isSearching]);

        // Keyboard listeners
        useEffect(() => {
            const willShow = Keyboard.addListener("keyboardWillShow", () => setIsKeyboardOpen(true));
            const willHide = Keyboard.addListener("keyboardWillHide", () => setIsKeyboardOpen(false));
            const didShow = Keyboard.addListener("keyboardDidShow", () => setIsKeyboardOpen(true));
            const didHide = Keyboard.addListener("keyboardDidHide", () => setIsKeyboardOpen(false));
            return () => {
                willShow.remove();
                willHide.remove();
                didShow.remove();
                didHide.remove();
            };
        }, []);

        // Snap to highest point when keyboard opens
        useEffect(() => {
            if (isKeyboardOpen && snapPoints.length === 4) {
                // Only snap to index 3 when we have 4 snap points (keyboard open)
                setTimeout(() => {
                    (ref as any)?.current?.snapToIndex(3);
                    setCurrentSheetIndex(3);
                }, 100);
            }
        }, [isKeyboardOpen, snapPoints, ref]);

        const bodyAnimatedStyle = useAnimatedStyle(() => ({
            opacity: bodyOpacity.value,
            transform: [{ scale: bodyScale.value }],
        }));

        // Animated style for footer to move up with keyboard
        const footerAnimatedStyle = useAnimatedStyle(() => {
            return {
                transform: [
                    {
                        translateY: -keyboard.height.value
                    }
                ],
            };
        });

        // Sticky footer (chips + input + icons) — only when hasResults
        const renderFooter = useCallback(
            (props: BottomSheetFooterProps) => {
                if (!hasResults) return null;

                return (
                    <BottomSheetFooter {...props}>
                        <Animated.View
                            style={[
                                {
                                    paddingHorizontal: 0,
                                    paddingTop: FOOTER_PAD_TOP,
                                    paddingBottom: FOOTER_PAD_BOTTOM + insets.bottom,
                                    backgroundColor: "#171717",
                                    borderRadius: 30,
                                },
                                footerAnimatedStyle
                            ]}
                        >
                            <Animated.View style={bodyAnimatedStyle}>
                                {/* Chips row (sticky) */}
                                {followups.length > 0 && (
                                    <View style={{ height: CHIPS_HEIGHT, marginBottom: GAP_AFTER_CHIPS }}>
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            keyboardShouldPersistTaps="handled"
                                            contentContainerStyle={{
                                                paddingLeft: 24,
                                                paddingRight: 20,
                                                height: CHIPS_HEIGHT,
                                                alignItems: "center",
                                            }}
                                        >
                                            <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                                                {followups.map((f, i) => (
                                                    <FollowUpChip key={`${f}-${i}`} text={f} onPress={() => handleChipPress(f)} />
                                                ))}
                                            </View>
                                        </ScrollView>
                                    </View>
                                )}

                                {/* Follow-up input row (sticky) */}
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 1, paddingHorizontal: 24 }}>

                                    <View
                                        style={{
                                            height: INPUT_HEIGHT + 10,
                                            borderRadius: 999,
                                            backgroundColor: "#171717",
                                            paddingHorizontal: 16,
                                            justifyContent: "center",
                                        }}
                                    >

                                    </View>

                                </View>
                            </Animated.View>
                        </Animated.View>
                    </BottomSheetFooter >
                );
            },
            [
                followups,
                handleChipPress,
                hasResults,
                followupFocused,
                followupText,
                onSearch,
                insets.bottom,
                bodyAnimatedStyle,
                footerAnimatedStyle,
            ]
        );

        const suggestions = [
            { text: "Cafes within 12 min walk" },
            { text: "Best dessert spots near me" },
            { text: "Halal spots in Ottawa" },
            { text: "Best brunch spots" },
            { text: "Casual catch up with friends" },
            { text: "Nearby spots that open late night" },
            { text: "Amazing pizza places" },
        ];

        return (
            <BottomSheet
                accessible={false}
                ref={ref}
                index={1}
                snapPoints={snapPoints}
                animatedIndex={animatedIndex}
                animationConfigs={animationConfigs}
                android_keyboardInputMode="adjustResize"
                enableDynamicSizing={false}
                footerComponent={renderFooter}
                containerStyle={{
                    zIndex: 60,
                    elevation: 60,
                }}
                backgroundStyle={{
                    backgroundColor: "#171717",
                    borderTopLeftRadius: 54,
                    borderTopRightRadius: 54,
                    shadowColor: "#000",
                    shadowOffset: {
                        width: 0,
                        height: -4,
                    },
                    shadowOpacity: 0.4,
                    shadowRadius: 16,
                    elevation: 28,
                }}
                handleIndicatorStyle={{
                    backgroundColor: "#404040",
                    height: 6,
                    width: 30,
                    marginTop: 4,
                }}
                onChange={(index) => {
                    if (onAnimate) onAnimate(index === 0 ? 0 : 0.45);

                    // If keyboard is open, we're at index 3, and user gestures to any other index
                    if (isKeyboardOpen && currentSheetIndex === 3 && index !== 3) {
                        Keyboard.dismiss();
                        (ref as any)?.current?.snapToIndex(1);
                        setCurrentSheetIndex(1);
                        return;
                    }

                    // Update current index
                    setCurrentSheetIndex(index);

                    if (index < 3) Keyboard.dismiss();

                    if (index === 0) {
                        bodyOpacity.value = withTiming(0, { duration: 160 });
                        bodyScale.value = withTiming(0.98, { duration: 160 });
                        setTimeout(() => setIsCollapsed(true), 160);
                    } else {
                        setIsCollapsed(false);
                        bodyOpacity.value = withTiming(1, { duration: 220 });
                        bodyScale.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
                        setScrollKey((prev) => prev + 1);
                    }
                }}
            >
                {/* BODY */}
                <Animated.View
                    style={[
                        bodyAnimatedStyle,
                        {
                            flex: 1,
                            paddingTop: 20,
                            paddingBottom: bodyPaddingBottom,
                        },
                    ]}
                    pointerEvents={isCollapsed ? "none" : "auto"}
                >
                    {isSearching ? (
                        <View style={{ paddingHorizontal: 24, marginBottom: 10 }}>
                            <Text
                                style={{
                                    color: "white",
                                    fontSize: 20,
                                    lineHeight: 32,
                                    fontFamily: "brice-semibold",
                                    marginBottom: 12,
                                }}
                            >
                                {searchQuery}
                            </Text>
                            <Text style={{ fontSize: 32 }}>{FOOD_EMOJIS[currentEmojiIndex]}</Text>
                        </View>
                    ) : hasResults ? (
                        <View style={{ paddingHorizontal: 24 }}>
                            <Text
                                style={{
                                    color: "white",
                                    fontSize: 20,
                                    lineHeight: 26,
                                    fontFamily: "brice-semibold",
                                    marginBottom: 10,
                                }}
                            >
                                {searchQuery}
                            </Text>

                            <Text
                                style={{
                                    color: "#A3A3A3",
                                    fontSize: 16,
                                    lineHeight: 20,
                                    fontFamily: "satoshi-medium",
                                    marginBottom: 14,
                                }}
                            >
                                Alright, here's what I'd check out if I were you.
                            </Text>

                            {/* Show on map (small pill) */}
                            <TouchableOpacity
                                onPress={onShowOnMap}
                                activeOpacity={0.8}
                            >
                                <SquircleView
                                    cornerSmoothing={0.6}
                                    style={{
                                        alignSelf: "flex-start",
                                        height: 40,
                                        paddingHorizontal: 16,
                                        borderRadius: 18,
                                        backgroundColor: "#242424",
                                        borderWidth: 1,
                                        borderColor: "rgba(255,255,255,0.08)",
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: 10,
                                        marginBottom: 14,
                                    }}
                                >
                                    <Text style={{ color: "white", fontSize: 14, fontFamily: "satoshi-medium" }}>
                                        Show on map
                                    </Text>
                                    <FontAwesome name="chevron-right" size={12} color="white" />
                                </SquircleView>
                            </TouchableOpacity>


                        </View>
                    ) : (
                        <>
                            <Text
                                style={{
                                    color: "white",
                                    fontSize: 20,
                                    lineHeight: 26,
                                    fontFamily: "brice-semibold",
                                    marginBottom: 14,
                                    paddingHorizontal: 24,
                                }}
                            >
                                Ready to discover?
                            </Text>

                            <ScrollView
                                key={scrollKey}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{
                                    paddingLeft: 24,
                                    paddingRight: 24,
                                    paddingBottom: 40,
                                }}
                            >
                                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, width: 600 }}>
                                    {suggestions.map((s, i) => (
                                        <SuggestionChip key={i} text={s.text} onPress={() => handleChipPress(s.text)} />
                                    ))}
                                </View>
                            </ScrollView>
                        </>
                    )}
                </Animated.View>
            </BottomSheet>
        );
    }
);

const FollowUpChip: React.FC<{ text: string; onPress: () => void }> = ({ text, onPress }) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
        >
            <SquircleView
                cornerSmoothing={0.6}
                style={{
                    height: CHIPS_HEIGHT,
                    paddingHorizontal: 14,
                    borderRadius: 19,
                    backgroundColor: "#242424",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.08)",
                    flexDirection: "row",
                    alignItems: "center",
                }}
            >
                <Text
                    numberOfLines={1}
                    style={{
                        color: "white",
                        fontSize: 13,
                        lineHeight: 16,
                        fontFamily: "satoshi-bold",
                        includeFontPadding: false,
                        textAlignVertical: "center",
                    }}
                >
                    {text}
                </Text>
            </SquircleView>
        </TouchableOpacity>
    );
};

const SuggestionChip: React.FC<{
    icon?: string;
    text: string;
    onPress: () => void;
}> = ({ icon, text, onPress }) => {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
            <SquircleView
                cornerSmoothing={0.6}
                style={{
                    height: CHIPS_HEIGHT,
                    paddingHorizontal: 14,
                    borderRadius: 18,
                    backgroundColor: "#242424",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.08)",
                    flexDirection: "row",
                    alignItems: "center",
                }}
            >
                {icon ? (
                    <Text
                        style={{
                            marginRight: 8,
                            fontSize: 14,
                            lineHeight: 16,
                        }}
                    >
                        {icon}
                    </Text>
                ) : null}

                <Text
                    numberOfLines={1}
                    style={{
                        color: "white",
                        fontSize: 14,
                        lineHeight: 16,
                        fontFamily: "satoshi-bold",
                        includeFontPadding: false,
                    }}
                >
                    {text}
                </Text>
            </SquircleView>
        </TouchableOpacity>
    );
};

export default SearchBottomSheet;