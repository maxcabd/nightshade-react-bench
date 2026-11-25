import React from "react";

import { BENCH_NATIVE } from "@/bench";
import NativeMap from "@/bench/NativeMap";
import MapScreen from "./map";

export default function Index() {
  return BENCH_NATIVE ? <NativeMap /> : <MapScreen />;
}
