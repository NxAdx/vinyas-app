const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidAbiSplits(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const buildGradle = config.modResults.contents;
      const splitsBlock = `
    splits {
        abi {
            reset()
            enable true
            universalApk false
            include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
        }
    }\n`;
      
      // Inject inside the android { ... } block if it doesn't already exist
      if (buildGradle.includes('android {') && !buildGradle.includes('splits {\\n        abi {')) {
        config.modResults.contents = buildGradle.replace('android {', 'android {' + splitsBlock);
      }
    }
    return config;
  });
};
