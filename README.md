# RS-R Remote

RS-R Remote is an open-source, high-performance React Native (Expo) mobile application designed for remote control of GoPro® cameras over Bluetooth Low Energy (BLE) and Wi-Fi.

---

## 🌟 Key Features

- **BLE Low-Power Remote Control**: Connect, power on/off, trigger shutter/recording, and switch modes over BLE.
- **Model Capability Auto-Detection**: Dynamic UI rendering and setting constraint resolution tailored to specific GoPro models (HERO9, HERO10, HERO11, HERO11 Mini, HERO12, HERO13, MAX).
- **Wi-Fi Live Preview**: Real-time camera preview streaming via Wi-Fi and UDP/RTSP (`react-native-vlc-media-player`).
- **Custom Presets & System Settings**: Create, edit, and apply custom presets and synchronize system settings (clock, LED, sound, etc.).
- **Multi-Camera Control**: Simultaneous batch commands (power off all, start/stop recording all) for multiple paired cameras.
- **Robust Background Monitoring**: Connection status monitoring and notifications powered by native foreground services.
- **Multilingual Support**: Available in 10 languages (English, 日本語, Español, Français, Deutsch, Italiano, Português, 한국어, 简体中文, 繁體中文).

---

## 🛠 Tech Stack

- **Framework**: React Native / Expo (SDK 56)
- **Language**: TypeScript
- **State Management**: Zustand
- **Local Database / Storage**: `expo-sqlite`
- **Native Modules**: `react-native-ble-plx`, `react-native-wifi-reborn`, `react-native-vlc-media-player`, `@notifee/react-native`
- **Testing & Quality Assurance**: Vitest, TypeScript (`tsc`), Madge (Circular Dependency Detection), Prettier

---

## 🚀 Getting Started

### Download

Available on the **App Store** and **Google Play Store**:

- 🍎 [App Store](https://apps.apple.com/jp/app/rsr-ble-remote-for-gopro/id1625036730)
- 🤖 [Google Play](https://play.google.com/store/apps/details?id=jp.co.rs_r.rsrremote)

---

### Prerequisites

- Node.js (v18 or higher recommended)
- npm / npx
- iOS (Xcode) / Android (Android Studio & SDK) development environment for physical device testing

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/aroooy/rsr-remote-react-native.git
   cd rsr-remote-react-native
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up build configuration:**
   Copy `eas.json.example` to `eas.json` (used for EAS Build / Local Build configurations):
   ```bash
   cp eas.json.example eas.json
   ```

### Running Locally

- **Start Metro Bundler:**
  ```bash
  npx expo start -c
  ```
- **Run on Physical Android Device:**
  ```bash
  npx expo run:android --device
  ```
- **Run on Physical iOS Device:**
  ```bash
  npx expo run:ios --device
  ```

---

## 🧪 Testing & Code Quality

Maintain code quality and verify integrity using the built-in commands:

```bash
# Run unit tests
npm test

# Run TypeScript validation
npx tsc --noEmit

# Check for circular imports
npm run check:cycles

# Check for remaining debug logs
npm run check:debug-logs

# Check code formatting
npm run format:check
```

---

## 📚 Technical Documentation

Detailed architecture blueprints, model resolver guides, and build instructions are located in the [`docs/`](./docs/README.md) directory:

- [System Overview](./docs/architecture/01_system-overview.md)
- [BLE Communication Specification](./docs/architecture/03_ble-communication.md)
- [Wi-Fi & Streaming Architecture](./docs/architecture/02_wifi-and-streaming.md)
- [Model Implementation Guide](./docs/guides/02_model-implementation-guide.md)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

## ⚠️ Disclaimer / 免責事項

GOPRO, HERO, and their respective logos are trademarks or registered trademarks of GoPro, Inc. in the United States and other countries.

This application is an independent third-party open-source project and is **not** affiliated with, authorized, maintained, sponsored, or endorsed by GoPro, Inc. or any of its affiliates or subsidiaries.

---

GOPRO、HERO、およびそれぞれのロゴは、GoPro, Inc. の米国およびその他の国における商標または登録商標です。  
本アプリケーションは独立したサードパーティ製のオープンソースプロジェクトであり、GoPro, Inc. およびその関連会社とは一切関係ありません。
