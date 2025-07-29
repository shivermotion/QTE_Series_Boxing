const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .lottie files to asset extensions
config.resolver.assetExts.push('lottie');

// Add .glb files to asset extensions for 3D models
config.resolver.assetExts.push('glb');

module.exports = config; 