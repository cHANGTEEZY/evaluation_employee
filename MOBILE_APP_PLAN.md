# Mobile App Implementation Plan

## Overview

This document outlines the complete implementation plan for the mobile app based on the project requirements. The app is for **field valuators (employees)** to collect property valuation data with offline-first capability.

---

## 1. Authentication & Session

### Completed

- [x] Better Auth client setup
- [x] Zustand auth store with session management
- [x] Login screen with redirect logic
- [x] Tab layout with auth protection

### Todo

- [✅] **Secure token storage** — Use `expo-secure-store` instead of AsyncStorage for tokens
- [ ] **Login as Guest** - Allow User to login as a guest but need authentication when syncing
- [ ] **Session refresh** — Handle token expiration gracefully, auto-refresh or prompt re-login
- [ ] **Logout with local data warning** — If user has unsynced data, warn before logout
- [ ] **Biometric unlock (optional)** — Allow fingerprint/face unlock for returning users
- [ ] **Network state awareness** — Check if offline at login, show appropriate message

### Edge Cases to Handle

- Token expired while app was in background
- Login attempted while offline (should fail with clear message)
- Server unreachable vs invalid credentials (different error messages)
- Session invalidated by admin (user deactivated)

---

## 2. Local Database (Offline Storage)

### Options

1. **WatermelonDB** — Best for React Native, handles sync, lazy loading
2. **SQLite (expo-sqlite)** — Direct SQL, more control, but manual sync logic
3. **MMKV** — Fast key-value store, good for small data

### Recommended: WatermelonDB

### Tables to Create

```
valuations
├── id (local UUID)
├── serverid (nullable - populated after sync)
├── organization_name
├── organization_address
├── organization_contact
├── branch_name
├── employee_name
├── employee_contact
├── employee_role
├── employee_branch
├── property_data (JSON - all valuation fields)
├── status (draft | pending_sync | synced | failed)
├── sync_status (pending | synced | failed)
├── created_at
├── updated_at
├── submitted_at (nullable)
├── synced_at (nullable)
├── error_message (nullable - sync failure reason)

valuation_images
├── id
├── valuation_id (FK)
├── local_uri (file path on device)
├── remote_url (nullable - after upload)
├── upload_status (pending | uploading | uploaded | failed)
├── captured_at
├── latitude
├── longitude

sync_queue
├── id
├── entity_type (valuation | image)
├── entity_id
├── action (create | update | delete)
├── attempts
├── last_attempt_at
├── status (pending | in_progress | completed | failed)
├── error_message
```

### Todo

- [ ] Install and configure WatermelonDB
- [ ] Define schema models
- [ ] Create database initialization on app start
- [ ] Implement CRUD operations for valuations
- [ ] Implement image record management
- [ ] Handle schema migrations for app updates

### Edge Cases

- App update with schema changes (need migration strategy)
- Database corruption recovery
- Storage limit reached on device
- Multiple valuations with same property (allowed or not?)

---

## 3. Valuation Data Entry Form

### Required Fields (from project spec)

**Auto-populated from session:**

- Organization Name
- Organization Address
- Organization Contact
- Branch Name
- Employee Name
- Employee Contact
- Employee Role
- Employee Branch

**User enters:**

- Property valuation fields (as per bank format)
- Status selection

### Form Implementation

- [ ] Create multi-step form wizard (properties can have many fields)
- [ ] Implement form state with `react-hook-form` + `zod` validation
- [ ] Save draft to local DB on every field change (debounced)
- [ ] Show draft indicator in UI
- [ ] Add "Save as Draft" and "Submit" buttons
- [ ] Implement required field validation before submit
- [ ] Handle form restoration when reopening incomplete valuation

### Timestamps (Auto-captured)

- [ ] `created_at` — When valuation record first created
- [ ] `updated_at` — Every time any field changes
- [ ] `submitted_at` — When user taps "Submit"
- [ ] `synced_at` — When successfully synced to server

### Edge Cases

- App killed while filling form (auto-save must work)
- Form with 50+ fields (need pagination/sections)
- Validation errors on submit (highlight all errors)
- Network comes back mid-form (don't auto-submit)
- User navigates away without saving (prompt to save draft)

---

## 4. Status Management

### Status Values (Employee can set)

- `Site Visit Started`
- `Site Visit Completed`
- `Data Submitted`

### Status Values (Admin only, synced from server)

- `Verified by Admin`
- `Sent to Client`
- `Closed`

### Implementation

- [ ] Status dropdown/selector in valuation form
- [ ] Status history log (local + synced)
- [ ] Visual status badges in valuation list
- [ ] Filter valuations by status
- [ ] Prevent editing after certain statuses (e.g., Verified, Closed)

### Edge Cases

- Status changed on server while offline (sync conflict)
- Employee tries to edit "Closed" valuation (block with message)
- Status rollback if sync fails

---

## 5. Image Capture & Management

### Features

- [ ] Camera integration with `expo-camera` or `expo-image-picker`
- [ ] Capture high-resolution photos
- [ ] Store images locally in app's file system
- [ ] Compress images before upload (configurable quality)
- [ ] Capture GPS coordinates at moment of photo capture
- [ ] Store capture timestamp with each image
- [ ] Gallery view for valuation images
- [ ] Delete image option (with confirmation)
- [ ] Maximum image count per valuation (configurable)

### Image Metadata to Store

```typescript
{
  localUri: string;
  capturedAt: Date;
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number;
  altitude?: number;
}
```

### Edge Cases

- Camera permission denied
- Location permission denied (capture anyway, mark as no-GPS)
- Storage full on device
- Image file deleted externally (broken reference)
- Very large images (need compression)
- Multiple images captured rapidly (queue processing)

---

## 6. GPS Location Capture

### Implementation

- [ ] Use `expo-location` for GPS
- [ ] Request location permission on first use
- [ ] Capture location with photo automatically
- [ ] Option to capture current location manually
- [ ] Show location on mini-map in form
- [ ] Store accuracy level (high/medium/low)
- [ ] Handle GPS timeout

### Location Data

```typescript
{
  latitude: number;
  longitude: number;
  accuracy: number; // meters
  altitude?: number;
  heading?: number;
  timestamp: Date;
}
```

### Edge Cases

- GPS disabled on device
- Indoor location (poor accuracy)
- Mock location apps (detect and warn)
- Location services timeout
- Permission denied (allow proceeding without GPS, flag record)

---

## 7. Sync Engine

### Sync Strategy

1. **Background sync** — Attempt sync when network available
2. **Manual sync** — User can trigger sync from UI
3. **Priority queue** — Images upload after data (data is more critical)
4. **Retry logic** — Exponential backoff on failures

### Implementation

- [ ] Create sync service/manager
- [ ] Network state listener (`@react-native-community/netinfo`)
- [ ] Sync queue processor
- [ ] Progress tracking (X of Y synced)
- [ ] Error handling with user-friendly messages
- [ ] Conflict resolution (server wins for admin-edited data)
- [ ] Image upload to Google Drive (via backend proxy)

### Sync Flow

```
1. Check network status
2. Get all pending items from sync_queue
3. For each item:
   a. Mark as in_progress
   b. Send to server API
   c. If success: mark completed, update synced_at
   d. If fail: increment attempts, set error, mark failed
   e. If retries exhausted: notify user
4. Update UI with sync status
```

### Sync Queue Screen

- [ ] List of pending syncs
- [ ] Show status: Pending | Syncing | Failed
- [ ] Retry failed items button
- [ ] Show error message for failed items
- [ ] Pull-to-refresh to trigger sync

### Edge Cases

- Network drops mid-sync (pause and resume)
- Server returns 401 (session expired, need re-auth)
- Partial upload (some items sync, others fail)
- Duplicate sync attempts (prevent race conditions)
- Large image upload timeout
- Server rejects data (validation error) — cannot auto-retry

---

## 8. Offline Mode UI/UX

### Visual Indicators

- [ ] Offline banner at top of screen when no network
- [ ] Sync status icon in header (cloud with checkmark/x/spinner)
- [ ] Badge on valuations tab showing pending sync count
- [ ] Last synced timestamp display

### Offline Behavior

- [ ] All forms work fully offline
- [ ] Valuations list shows local data
- [ ] Clear messaging: "You're offline. Data saved locally."
- [ ] Sync automatically when back online
- [ ] Manual sync button always visible

---

## 9. Valuation List & History

### Features

- [ ] List all valuations (local + synced)
- [ ] Search by property address/client name
- [ ] Filter by status, date range
- [ ] Sort by date, status
- [ ] Show sync status indicator per item
- [ ] Tap to view/edit valuation
- [ ] Pull-to-refresh (triggers sync if online)

### List Item Display

- Property address (primary text)
- Status badge
- Created date
- Sync status icon
- Image count

---

## 10. App Architecture

### Folder Structure

```
evaluation_employee/
├── app/                    # Expo Router screens
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── _layout.tsx
│   ├── (tabs)/
│   │   ├── index.tsx       # Valuations list
│   │   ├── new.tsx         # New valuation form
│   │   ├── sync.tsx        # Sync queue screen
│   │   └── profile.tsx     # User profile
│   └── valuation/
│       └── [id].tsx        # View/edit valuation
├── components/
│   ├── ui/                 # Base UI components
│   ├── forms/              # Form components
│   ├── valuation/          # Valuation-specific
│   └── sync/               # Sync status components
├── lib/
│   ├── auth-client.ts      # Existing
│   ├── auth-store.ts       # Existing
│   ├── db/                 # Database layer
│   │   ├── schema.ts
│   │   ├── models/
│   │   └── queries/
│   ├── sync/               # Sync engine
│   │   ├── manager.ts
│   │   ├── queue.ts
│   │   └── network.ts
│   └── services/
│       ├── camera.ts
│       ├── location.ts
│       └── storage.ts
├── hooks/
│   ├── useValuations.ts
│   ├── useSync.ts
│   ├── useCamera.ts
│   └── useLocation.ts
└── types/
    └── valuation.ts
```

---

## 11. Dependencies to Install

```json
{
  "dependencies": {
    "@nozbe/watermelondb": "^0.27.0",
    "@react-native-community/netinfo": "^11.0.0",
    "expo-camera": "~14.0.0",
    "expo-file-system": "~16.0.0",
    "expo-image-picker": "~14.0.0",
    "expo-location": "~16.0.0",
    "expo-secure-store": "~12.0.0",
    "react-hook-form": "^7.0.0",
    "zod": "^3.0.0",
    "@hookform/resolvers": "^3.0.0",
    "@tanstack/react-query": "^5.0.0"
  }
}
```

---

## 12. Implementation Order

### Phase 1: Foundation (Week 1)

1. [ ] Set up WatermelonDB with schema
2. [ ] Create valuation CRUD operations
3. [ ] Build basic valuation form (text fields only)
4. [ ] Save drafts to local DB

### Phase 2: Media (Week 2)

5. [ ] Add camera integration
6. [ ] Add GPS capture
7. [ ] Store images locally with metadata
8. [ ] Display images in form

### Phase 3: Sync (Week 3)

9. [ ] Build sync queue system
10. [ ] Implement network detection
11. [ ] Create sync manager with retry logic
12. [ ] Build sync status UI

### Phase 4: Polish (Week 4)

13. [ ] Valuation list with search/filter
14. [ ] Status management
15. [ ] Offline indicators
16. [ ] Error handling and edge cases
17. [ ] Testing on real devices

---

## 13. Testing Checklist

### Offline Scenarios

- [ ] Create valuation with no network
- [ ] Take photos offline
- [ ] Reconnect and verify auto-sync
- [ ] Kill app while offline, reopen and verify data persists

### Sync Scenarios

- [ ] Sync 10 valuations with images
- [ ] Interrupt sync mid-way, verify resume
- [ ] Handle server 500 error during sync
- [ ] Handle session expiry during sync

### Edge Cases

- [ ] Fill form, switch apps, return — form state preserved
- [ ] Take photo, GPS times out — photo saved without GPS
- [ ] Storage full — graceful error message
- [ ] Two devices, same account — data isolation?

---

## Summary Priority

| Priority | Feature                         | Effort |
| -------- | ------------------------------- | ------ |
| **P0**   | Local database + valuation form | High   |
| **P0**   | Save drafts offline             | Medium |
| **P0**   | Basic sync to server            | High   |
| **P1**   | Camera + images                 | Medium |
| **P1**   | GPS capture                     | Low    |
| **P1**   | Sync queue UI                   | Medium |
| **P2**   | Valuation list + search         | Medium |
| **P2**   | Status management               | Low    |
| **P3**   | Offline indicators              | Low    |
| **P3**   | Biometric unlock                | Low    |
