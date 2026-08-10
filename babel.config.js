module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    env: {
      production: {
        // Strip console.log/debug/info from release bundles. warn/error are
        // kept so debugWarn() output and real errors remain visible in
        // logcat / Console.app when diagnosing release-build issues.
        plugins: [
          ['transform-remove-console', { exclude: ['error', 'warn'] }],
        ],
      },
    },
  };
};
