/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter-Regular", "sans-serif"],
        "inter-bold": ["Inter-Bold", "sans-serif"],
        "inter-medium": ["Inter-Medium", "sans-serif"],
        "inter-light": ["Inter-Light", "sans-serif"],

        oddlini: ["Oddlini-Regular", "sans-serif"],
        "oddlini-medium": ["Oddlini-Medium", "sans-serif"],
        "oddlini-semibold": ["Oddlini-Semibold", "sans-serif"],
        "oddlini-bold": ["Oddlini-Bold", "sans-serif"],


        satoshi: ["Satoshi-Regular", "sans-serif"],
        "satoshi-medium": ["Satoshi-Medium", "sans-serif"],
        "satoshi-bold": ["Satoshi-Bold", "sans-serif"],


        general: ["General-Regular"],
        "general-medium": ["General-Medium"],
        "general-semibold": ["General-Semibold"],
        "general-bold": ["General-Bold"],



        "brice-semibold": ["Brice-Semibold"],
        "brice-bold": ["Brice-Bold"],
      },

      fontSize: {
        dynamic: "var(--font-size-dynamic)",
      },
    },
  },
  plugins: [],
};
