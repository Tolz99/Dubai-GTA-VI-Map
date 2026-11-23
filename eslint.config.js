// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // src/map/web is plain ES5 injected into the WebView as-is; the generated bundle is build output.
    ignores: ['dist/*', 'src/map/web/*', 'src/map/mapHtml.generated.ts'],
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: { console: 'readonly', process: 'readonly', fetch: 'readonly', URL: 'readonly', setTimeout: 'readonly' } },
  },
]);
