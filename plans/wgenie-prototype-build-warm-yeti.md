# WGenie Prototype Build Plan

## Context
The user wants a complete clickable prototype of WGenie — a shared-flat (WG) energy bill fairness app — built as a single-page React app. The prototype must cover 10 screens/flows, be mobile-first (rendered inside a 390×844 phone frame), use in-memory mock state only, and closely match the provided WGenie brand: dark #0A0E0A background, lime #7CE03A accent, and a modern fintech/energy aesthetic. The demo path must be fully navigable without dead ends.

## Approach

### File changes
- `src/styles/fonts.css` — import Manrope (display/headings) + DM Sans (body) from Google Fonts
- `src/styles/theme.css` — update `:root` tokens to WGenie dark palette; preserve `.dark` block and `@theme inline` contract
- `src/app/App.tsx` — full prototype implementation (all screens, all state)

### Visual tokens (theme.css overrides for `:root`)
```
--background: #0A0E0A
--foreground: #EEF3EE
--card: #161D16
--card-foreground: #EEF3EE
--primary: #7CE03A       (lime)
--primary-foreground: #0A0E0A
--secondary: #1C241C
--secondary-foreground: #EEF3EE
--muted: #161D16
--muted-foreground: #9FB09F
--accent: #7CE03A
--accent-foreground: #0A0E0A
--border: #2A352A
--ring: #7CE03A
--radius: 1.25rem        (20px)
```
Custom CSS vars (not in token contract, used via inline or arbitrary Tailwind):
- `--lime: #7CE03A`, `--lime-dark: #5BBF24`
- `--warm: #FF9B54`
- `--text-faint: #6B7A6B`
- `--sara: #7CE03A`, `--jonas: #54B4FF`, `--alex: #FF9B54`

### Typography
- Google Fonts: **Manrope** (800 weight for display headings) + **DM Sans** (400/500 for body)
- Applied via CSS vars in fonts.css + referenced in App.tsx as `font-[Manrope]` / `font-[DM_Sans]`

### State architecture (all in App.tsx)

```ts
// Top-level navigation state
type Screen = 'splash' | 'onboarding' | 'setup' | 'home' | 'log' | 
              'device-detail' | 'marketplace' | 'pairing' | 'compete' | 
              'impact' | 'profile'

// WG setup wizard steps 1–6
type SetupStep = 1 | 2 | 3 | 4 | 5 | 6

interface Flatmate { id: string; name: string; color: string; isCurrentUser: boolean }
interface Room { id: string; name: string; ownerId: string | 'shared' }
interface Device { id: string; name: string; roomId: string; ownerId: string | 'shared'; 
                   wattsTypical: number; icon: string }
interface DailyLog { date: string; deviceId: string; hoursUsed: number; 
                     attributedTo: string[] }

// Main app state (useReducer or useState)
{
  screen, setupStep, tier (1|2),
  flatName, numRooms, flatmates, rooms, devices, tariff,
  logs,           // DailyLog[] — ~30 days pre-seeded
  streak,         // number (4-day streak for Sara)
  showToast, toastMsg,
  selectedDeviceId,  // for detail view
  plugPairingCode    // for pairing screen
}
```

### Mock data seeds
- **Flatmates**: Sara (lime, currentUser), Jonas (blue #54B4FF), Alex (orange #FF9B54)
- **Rooms**: "Sara's Room" → Sara, "Jonas's Room" → Jonas, "Alex's Room" → Alex, "Kitchen" → shared, "Living Room" → shared
- **Devices** (6): Laptop+Monitor 120W (Sara), Gaming Console 180W (Alex), Space Heater 1500W (Jonas), Fridge 40W (Kitchen/shared), Washing Machine 2000W (shared), TV 80W (Living Room/shared)
- **Logs**: 30 days of plausible random usage per device, generating realistic €/month figures (~Sara €18, Jonas €31, Alex €22, shared €29 → total ~€100)
- **Tariff**: €0.40/kWh

### Screens to implement

**1. Splash** — logo "WGenie", tagline, two buttons (Create / Join)

**2. Onboarding carousel** — 3 slides with progress dots, Skip/Next, last→"Set up my WG"

**3. Setup wizard** (6 steps with top progress bar):
- Step 1: Name the flat (editable text input, pre-filled)
- Step 2: How many rooms (stepper 2–6)
- Step 3: Assign rooms to flatmates (inline person-add, shared toggle per room)
- Step 4: Add devices (per room, device picker modal with 9 presets + custom)
- Step 5: Set tariff (€/kWh input)
- Step 6: Invite code (copy mock link) → "Go to Dashboard"

**4. Home Dashboard (Tier 1)**
- Header: flat name, month, "Free · Tier 1" badge
- Hero card: Sara's share (€18.xx), total, trend pill (↓9% lime)
- Fair-split bars: Sara / Jonas / Alex in avatar colors
- "Equal split would be €X — you'd overpay €Y" contrast line
- "Log today's usage" primary button
- Upgrade banner persistent at bottom
- Bottom nav: Home / Log / Compete / Impact / Profile

**5. Log Usage** (bottom-sheet overlay)
- Device list for Sara + shared devices
- Hours steppers with live kWh/€ conversion
- Shared device: assign who used (chips)
- Streak indicator (🔥 4-day streak)
- Save → toast → dashboard updates

**6. Device detail** (tap any device from dashboard)
- kWh, €, CO₂, attributed-to info
- Month chart (7-day bars using recharts BarChart)

**7. Upgrade / Marketplace**
- Opened from upgrade banner
- "Smart plugs near you" header (mock Augsburg geolocation)
- 2–3 plug cards (name, price ~€15–25, "Buy" mock)
- "I already have a plug" / "Connect plug" → goes to pairing

**8. Pairing screen**
- Code entry input (auto-fills mock code)
- Auto-success after 1.5s → celebratory state
- Assigns plug to device/person
- Subscription confirmation: €4.99/member/month mock checkout
- → upgrades tier to 2

**9. Home Dashboard (Tier 2)** — same layout, badge → "Auto · Tier 2", "Log usage" button → "Auto-tracking on" indicator, data now labeled "automatic"

**10. Compete tab** — leaderboard (lowest kWh = rank 1), streaks, badges (🏆 🔥), "loser buys drinks" flavor

**11. Impact tab** — CO₂ saved, animated trees 🌳, cumulative € saved, % reduction

**12. Profile/settings** — user info, tier badge, tariff editor, manage flatmates, Reset demo button

### Demo dev bar
A small floating pill/tab bar at the very top of the phone frame (outside the scrollable content) listing: Splash | Onboard | Setup | Home | Log | Market | Compete | Impact | Profile — tapping any jumps directly to that screen. Style it as a thin translucent strip.

### Transitions
Use CSS `transition-all` + conditional `opacity-0/100 translate-y-4/0` for screen-enter animations (100ms ease-out). Bottom-sheet uses `translate-y-full` → `translate-y-0`.

### Component structure (all in App.tsx, no file splits)
```
App
  PhoneFrame
    DevJumpBar          (demo nav strip)
    SplashScreen
    OnboardingScreen
    SetupWizard
      SetupStep1..6
    HomeDashboard       (renders Tier1 or Tier2 variant)
    LogSheet            (bottom sheet overlay)
    DeviceDetail
    MarketplaceScreen
    PairingScreen
    CompeteTab
    ImpactTab
    ProfileTab
  Toast                 (absolute overlay)
```

All as plain functions inside the file, sharing state via props drilled from App root.

## Verification
1. Open preview in browser — phone frame should be visible centered on dark desktop
2. Tap "Create a WG" → onboarding → setup wizard (6 steps) → dashboard
3. Tap "Log today's usage" → bottom sheet → Save → toast appears → dashboard numbers update
4. Tap upgrade banner → marketplace → "Connect plug" → pairing → Tier 2 dashboard
5. Navigate all 5 bottom tabs; use DevJumpBar to jump between screens
6. Tap Profile → "Reset demo" → returns to Splash with fresh state
