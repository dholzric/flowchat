# FlowChat Mobile

Native iOS and Android mobile app for FlowChat built with React Native and Expo.

## Features

- 📱 Native iOS & Android apps
- 🔐 Secure authentication with JWT
- 💬 Real-time messaging with Socket.IO
- 📢 Channel-based communication
- 🔔 Push notifications (coming soon)
- 🎨 Clean, modern UI with React Native
- 📊 Unread message tracking
- 👥 User presence indicators

## Tech Stack

- **Framework:** React Native with Expo
- **Language:** TypeScript
- **State Management:** Zustand
- **Navigation:** React Navigation
- **Real-time:** Socket.IO Client
- **HTTP Client:** Axios
- **Secure Storage:** expo-secure-store
- **Messaging UI:** react-native-gifted-chat

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app (for testing on device)
- Android Studio or Xcode (for emulators)

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Run on web
npm run web
```

## Project Structure

```
FlowChatMobile/
├── src/
│   ├── screens/          # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   └── ChannelScreen.tsx
│   ├── navigation/       # Navigation setup
│   │   └── AppNavigator.tsx
│   ├── services/         # API & Socket services
│   │   ├── api.ts
│   │   └── socket.ts
│   ├── store/            # State management
│   │   └── authStore.ts
│   ├── components/       # Reusable components
│   ├── utils/            # Helper functions
│   └── types/            # TypeScript types
├── App.tsx               # Root component
└── package.json
```

## Configuration

### API Endpoint

Update the API URL in `src/services/api.ts` and `src/services/socket.ts`:

```typescript
const API_URL = __DEV__
  ? 'http://10.0.2.2:5000/api' // Android emulator
  : 'https://your-production-api.com/api';
```

**Note:**
- Android emulator uses `10.0.2.2` to access localhost
- iOS simulator uses `localhost` or `127.0.0.1`
- Physical devices need your computer's IP address

## Development

### Testing on Physical Device

1. Install Expo Go app on your device
2. Run `npm start`
3. Scan the QR code with Expo Go (Android) or Camera (iOS)

### Testing on Emulator

#### Android:
```bash
npm run android
```

#### iOS (macOS only):
```bash
npm run ios
```

## Features Implemented

### Authentication
- User registration
- User login
- Secure token storage
- Auto-login on app start
- Logout functionality

### Messaging
- View all workspaces
- Browse channels
- Real-time message delivery
- Send messages
- Unread message indicators
- Scroll to bottom
- Username display

### Real-time
- Socket.IO connection
- Auto-reconnection
- Channel join/leave
- Live message updates
- Message edit/delete events

## Planned Features

- [ ] Direct messages
- [ ] Message threading
- [ ] File attachments
- [ ] Image sharing
- [ ] Push notifications
- [ ] User profiles
- [ ] Search functionality
- [ ] Offline support
- [ ] Message reactions
- [ ] Typing indicators
- [ ] Read receipts

## Building for Production

### Android APK

```bash
# Build APK
expo build:android

# Or with EAS (recommended)
eas build --platform android
```

### iOS IPA

```bash
# Requires Apple Developer account
expo build:ios

# Or with EAS (recommended)
eas build --platform ios
```

## Troubleshooting

### Cannot connect to backend

1. Check API_URL is correct
2. For Android emulator, use `10.0.2.2` instead of `localhost`
3. For physical device, use your computer's IP address
4. Ensure backend is running and accessible

### Socket.IO not connecting

1. Verify Socket URL matches your backend
2. Check that backend CORS allows your origin
3. Ensure authentication token is valid
4. Check network connection

### Build errors

```bash
# Clear cache and rebuild
npm start --clear

# Reinstall dependencies
rm -rf node_modules
npm install
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details
