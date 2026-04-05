module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // NO pongas react-native-worklets/plugin aquí
    // babel-preset-expo (Expo SDK 55) ya lo incluye automáticamente
  };
};