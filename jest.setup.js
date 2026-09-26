/* eslint-env jest */
// Native modules don't exist under Jest; mock the native libraries the app uses

require('react-native-gesture-handler/jestSetup');

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest'),
);

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

// Signed out: onAuthStateChanged calls back with null, so the app shows Login
jest.mock('@react-native-firebase/auth', () => {
  const instance = {
    currentUser: null,
    onAuthStateChanged: jest.fn(callback => {
      callback(null);
      return jest.fn();
    }),
    onUserChanged: jest.fn(() => jest.fn()),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    signOut: jest.fn(),
  };
  return { __esModule: true, default: () => instance };
});
