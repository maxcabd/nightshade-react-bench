// app/components/Spinner.tsx
import React from "react";
import { ActivityIndicator } from "react-native";

interface SpinnerProps {
    size?: number;
    color?: string;
    backgroundColor?: string;
    strokeWidth?: number;
    duration?: number;
}

const Spinner: React.FC<SpinnerProps> = ({
    size = 20,
    color = "#ffffff",
}) => {
    return <ActivityIndicator size={size > 30 ? "large" : "small"} color={color} />;
};

export default Spinner;