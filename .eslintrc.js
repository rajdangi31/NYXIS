// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: 'expo',
  ignorePatterns: ['/dist/*', 'scratch/**', '.expo/**', 'supabase/functions/**'],
  overrides: [
    {
      files: ['scripts/**/*.js'],
      env: {
        node: true,
      },
    },
  ],
};
