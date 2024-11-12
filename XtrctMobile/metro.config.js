// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('jsx', 'js', 'ts', 'tsx');  // Customize if needed
config.watchFolders = [
  path.resolve(__dirname, 'src'), // Add your source folder to watch
];  // Limits watched directories to project root

config.resolver.blacklistRE = /node_modules[\\/]/; // This line ensures that node_modules are ignored

module.exports = config;
