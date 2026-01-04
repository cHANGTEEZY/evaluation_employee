# 📱 Expo + Tamagui + Better Auth

A modern **Expo (React Native)** application using **Tamagui** for UI and **Better Auth** for secure authentication with **Expo SecureStore** persistence.

---

## 🚀 Tech Stack

- **Expo** (React Native)
- **expo-router** – File-based routing
- **Tamagui** – Cross-platform UI system
- **Better Auth** – Authentication & session management
- **Expo SecureStore** – Encrypted storage for auth tokens
- **TypeScript**

---

## 📂 Folder Structure

```txt
.
├── app/                             # Expo Router entry
│   ├── (auth)/                      # Public authentication routes
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   │
│   ├── (protected)/                 # Authenticated routes
│   │   ├── _layout.tsx              # Auth guard layout
│   │   ├── index.tsx                # Home screen
│   │   └── profile.tsx
│   │
│   ├── _layout.tsx                  # Root layout
│   └── index.tsx                    # Entry redirect
│
├── components/                      # Reusable UI components
│   ├── ui/                          # Tamagui-based UI primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Toast.tsx
│   │
│   └── layout/                      # Layout components
│       └── Screen.tsx
│
├── lib/                             # Core app logic
│   ├── auth-client.ts               # Better Auth Expo client
│   ├── auth-guard.tsx               # Route protection logic
│   └── api.ts                       # API helpers
│
├── tamagui/                         # Tamagui configuration
│   ├── config.ts                    # createTamagui config
│   ├── themes.ts                    # Light / Dark themes
│   ├── tokens.ts                    # Design tokens
│   └── toast.tsx                    # Custom toast styles
│
├── hooks/                           # Custom React hooks
│   └── useAuth.ts                   # Auth state hook
│
├── constants/                       # App constants
│   └── env.ts                       # Environment variables
│
├── assets/                          # Static assets
│   └── images/
│
├── app.config.ts                    # Expo config
├── babel.config.js                  # Babel config
├── tamagui.config.ts                # Tamagui entry
├── tsconfig.json                    # TypeScript config
└── README.md
```
