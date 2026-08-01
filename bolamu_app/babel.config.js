// Babel config — requis par NativeWind v4 pour compiler les classes Tailwind sur l'appareil
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
