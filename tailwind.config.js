module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core palette
        systemBlack: '#000000',
        systemSurface: '#080808',
        systemBorder: '#1E1E1E',

        // Neon accent
        systemNeon: '#00E5FF',
        systemNeonDim: '#00E5FF22',

        // Ranks
        rankE: '#9E9E9E',
        rankD: '#4CAF50',
        rankC: '#2196F3',
        rankB: '#9C27B0',
        rankA: '#FF9800',
        rankS: '#00E5FF',

        // Stats
        statStr: '#FF4444',
        statInt: '#7B68EE',
        statVit: '#4CAF50',
        statDex: '#FFD700',
        statWis: '#00E5FF',

        // Quest types
        questDaily:     '#00E5FF',
        questSide:      '#7B68EE',
        questEmergency: '#FF4444',
        questRankUp:    '#FFD700',
      },
      fontFamily: {
        mono: ['SpaceMono'],
      },
    },
  },
  plugins: [],
};