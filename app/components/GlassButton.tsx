import { Pressable, View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import type { ComponentProps } from "react";

const SIZE = 38;
const BORDER = 1;
const R = 999;

type Props = {
    icon: ComponentProps<typeof FontAwesome6>["name"];
    onPress?: () => void;
    size?: number;          // optional icon size override
    diameter?: number;      // optional button size override
    label?: string;
};

export function GlassIconButton({
    icon,
    onPress,
    size = 16,
    diameter = SIZE,
    label,
}: Props) {
    return (
        <Pressable
            onPress={onPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
        >
            <View
                style={{
                    width: diameter,
                    height: diameter,
                    borderRadius: R,
                    borderWidth: BORDER,
                    borderColor: "rgba(0,0,0,0.25)",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <View
                    style={{
                        width: diameter - BORDER * 2,
                        height: diameter - BORDER * 2,
                        borderRadius: R,
                        overflow: "hidden",
                    }}
                >
                    <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill}>
                        <View
                            style={[
                                StyleSheet.absoluteFillObject,
                                { backgroundColor: "rgba(0,0,0,0.28)" },
                            ]}
                        />
                    </BlurView>

                    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                        <FontAwesome6 name={icon} size={size} color="white" />
                    </View>
                </View>
            </View>
        </Pressable>
    );
}
