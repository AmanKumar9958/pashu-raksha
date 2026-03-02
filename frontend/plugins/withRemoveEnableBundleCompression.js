const { withAppBuildGradle } = require('@expo/config-plugins');

function stripEnableBundleCompression(contents) {
  // Remove deprecated React extension property for RN 0.76+.
  return contents.replace(/^\s*enableBundleCompression\s*=.*\r?\n/gm, '');
}

module.exports = function withRemoveEnableBundleCompression(config) {
  return withAppBuildGradle(config, (config) => {
    const original = config.modResults.contents;
    const updated = stripEnableBundleCompression(original);

    if (updated !== original) {
      config.modResults.contents = updated;
    }

    return config;
  });
};
