module.exports = {
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        ios: null, // we link fonts manually via Info.plist
      },
    },
  },
  assets: ['../../node_modules/react-native-vector-icons/Fonts'],
};
