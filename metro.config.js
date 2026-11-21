// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const path = require('path');

const WEB_STUBS = {
  'react-native-maps': 'web-stubs/react-native-maps.js',
  'react-native-fbsdk-next': 'web-stubs/react-native-fbsdk-next.js',
};

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

console.log('>>> metro.config.js chargé');

const defaultResolve = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const key = Object.keys(WEB_STUBS).find(
    (k) => moduleName === k || moduleName.startsWith(k + '/')
  );
  if (platform === 'web' && key) {
    console.log('>>> remplacé :', moduleName, 'depuis', context.originModulePath);
    return { type: 'sourceFile', filePath: path.resolve(__dirname, WEB_STUBS[key]) };
  }
  return (defaultResolve ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
