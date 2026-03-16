# NYXIS: The System

NYXIS is an AI-powered RPG productivity system designed for evolution. Through the **Architect** (Gemini AI), the system generates personalized quest lines to bridge the gap between your current state and your ultimate goals.

## ✨ Features
- **The Architect**: AI-driven quest generation and recalibration.
- **Mastery Standard**: Rigorous, measurable proof for every task.
- **RPG Progression**: Level up, gain stats, and rank up from E to S.
- **Penalty System**: Stale daily tasks freeze XP growth and trigger emergency quests.

## 🚀 Multi-Device Testing

### 1. Simple Local Testing (Expo Go)
If you are on the same Wi-Fi network:
```bash
npx expo start
```
Scan the QR code with the **Expo Go** app.

### 2. Remote Testing (Tunnel)
If you are on a different network or cellular data:
```bash
npx expo start --tunnel
```

### 3. "Publish" to the Cloud (EAS Update)
To publish a version that can be opened from anywhere without your computer running:
1. **Login to Expo**: `npx expo login`
2. **Publish**: `npm run publish:dev`
3. Scan the project QR code from your [Expo Dashboard](https://expo.dev/artifacts).

## 🛠️ Tech Stack
- **Frontend**: React Native (Expo) + NativeWind
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **AI**: Google Gemini 2.0 Flash (The Architect)
