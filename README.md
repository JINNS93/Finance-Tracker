# FinTrack

FinTrack is a cross-platform personal finance tracking app built with React Native. It helps users manage their spending by tracking transactions, organizing them into categories, and setting daily or monthly budgets — with all data kept private and isolated per user account.

## Features

- **User Authentication** — Email/password sign-up and login powered by Firebase Authentication, with persistent sessions across app restarts
- **Transaction Tracking** — Add, view, and delete spending records with category, amount, note, and date
- **Custom Categories** — Create your own spending categories beyond the default set (Food, Transport, Entertainment, Daily)
- **Budgeting** — Set daily or monthly budget limits per category, with visual progress bars and over-budget alerts
- **History & Search** — Browse past transactions and budgets, filter by type (All / Spend / Budget), and search by category, note, or amount
- **Date Range Reports** — View spending breakdowns and totals over custom date ranges (Today, Last 7 Days, Last 30 Days, This Month, or a custom range)
- **Per-User Data Isolation** — Each account's data is stored separately on-device, so switching accounts never shows another user's data
- **Custom Iconography** — All category and UI icons use custom image assets instead of emoji for consistent rendering across devices

## Tech Stack

| Category | Technology |
|---|---|
| Language | TypeScript |
| Framework | React Native (CLI) |
| Navigation | React Navigation (Native Stack + Bottom Tabs) |
| Authentication | Firebase Authentication |
| State Management | React Context API + custom hooks |
| Local Storage | AsyncStorage |
| Date Picker | @react-native-community/datetimepicker |
| Build Tools | Gradle, Metro Bundler, npm |

## Project Structure

```
FinTrack/
├── android/                      # Native Android project (Gradle config, Firebase setup)
├── src/
│   ├── asset/
│   │   └── icon/                 # Custom PNG icons (replacing emoji)
│   ├── context/
│   │   └── AppContext.tsx        # Global state: transactions, categories, budgets
│   ├── navigation/
│   │   └── TabNavigator.tsx      # Bottom tab navigation (Home, History, Add, View)
│   ├── screens/
│   │   ├── loginscreen.tsx
│   │   ├── SignUpScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   ├── AddScreen.tsx
│   │   └── viewScreen.tsx
│   └── utils/
│       └── categoriesIcons.tsx   # Icon name → image asset mapping
├── App.tsx                       # Root component, auth state listener, navigation root
└── package.json
```

## Getting Started

### Prerequisites

- Node.js (LTS version)
- npm
- Android Studio with an emulator configured, or a physical Android device
- A Firebase project with Authentication (Email/Password) enabled

### Installation

1. Clone the repository
   ```
   git clone <repository-url>
   cd FinTrack
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up Firebase
   - Create a project in the [Firebase Console](https://console.firebase.google.com/)
   - Enable **Authentication → Sign-in method → Email/Password**
   - Download `google-services.json` and place it in `android/app/`

4. Configure the Android build
   - Ensure `android/build.gradle` includes the Google services classpath
   - Ensure `android/app/build.gradle` applies the Google services plugin at the bottom of the file

5. Run the app
   ```
   npx react-native start --reset-cache
   ```
   In a separate terminal:
   ```
   npx react-native run-android
   ```

## Key Implementation Notes

- **Auth-driven navigation**: `App.tsx` listens to Firebase's `onAuthStateChanged` and automatically switches between the auth flow (Login/SignUp) and the main app (bottom tabs) — no manual navigation resets needed.
- **Per-account storage keys**: AsyncStorage keys are scoped to the logged-in user's Firebase UID, so each account's transactions, categories, and budgets are stored and loaded independently.
- **Date-based budgeting**: Budgets are stored as dictionaries keyed by date (`YYYY-MM-DD` for daily, `YYYY-MM` for monthly), allowing historical budgets to remain intact even as the current date changes.

## License

！！ This project is for personal/portfolio use.