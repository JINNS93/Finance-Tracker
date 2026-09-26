module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // These packages ship ESM / TS source and must go through Babel:
  // react-native and react-native-* (e.g. the safe-area-context TS mock), @react-native-* (e.g. async-storage), @react-navigation
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native(-[^/]+)?|@react-native(-[^/]+)?|@react-navigation)/)',
  ],
};
