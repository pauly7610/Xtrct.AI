#!/bin/bash

echo "### Node Version ###"
node -v

echo -e "\n### Yarn Version ###"
yarn -v

echo -e "\n### Expo CLI Version ###"
expo --version

echo -e "\n### Installed Expo SDK Version ###"
yarn list expo

echo -e "\n### react-native-screens Version ###"
yarn list react-native-screens

echo -e "\n### List of Dependencies ###"
cat package.json | grep '"dependencies"' -A 20  # Shows dependencies section in package.json

echo -e "\n### Metro Config ###"
cat metro.config.js 2>/dev/null || echo "No metro.config.js file found."

echo -e "\n### Project Directory Structure ###"
find . -maxdepth 2 -type d  # Shows project directory structure up to 2 levels

echo -e "\n### Environment Variables ###"
cat .env 2>/dev/null || echo "No .env file found."
