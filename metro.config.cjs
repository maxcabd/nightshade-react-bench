// metro.config.js
const { getDefaultConfig } = require("@expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { wrapWithReanimatedMetroConfig } = require("react-native-reanimated/metro-config");

module.exports = (() => {
  let config = getDefaultConfig(__dirname);

  config = withNativeWind(config, { input: "./global.css" });

  config.transformer = {
    ...config.transformer,
    babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
  };
  config.resolver = {
    ...config.resolver,
    assetExts: config.resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: Array.from(new Set([...config.resolver.sourceExts, "svg", "cjs", "mjs"])),
  };


  config = wrapWithReanimatedMetroConfig(config);


  return config;
})();
