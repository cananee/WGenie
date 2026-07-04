WGenie — Prototype Build Prompt


Paste everything below the line into your AI builder (Claude, v0, Bolt, Lovable, Cursor) or hand to a developer. It builds a clickable, front-end-only prototype of the WGenie app: onboarding, WG layout setup, room→user assignment, device adding, manual daily logging (Tier 1, free), the fair-split dashboard, gamification, and the Tier 1 → Tier 2 (smart plug) upgrade flow. No backend needed — use in-memory/mock state.




ROLE

You are a senior product designer + front-end engineer. Build a high-fidelity, clickable prototype (not a production app) of a mobile app called WGenie. It runs entirely in the browser with mock data held in memory (React state only — no backend, no database, no localStorage). Every screen must be navigable so the flow can be demoed live and screen-recorded.

PRODUCT IN ONE LINE

WGenie makes shared-flat (German "WG") energy bills fair and transparent: each flatmate pays for what they actually use instead of splitting equally. It is freemium — Tier 1 is free (users log usage manually), Tier 2 is paid (a smart plug tracks usage automatically). The prototype must make the "start free → upgrade to automatic" story obvious.

TECH & FORMAT


Single-page React app, mobile-first, rendered inside a phone frame (approx 390×844) centered on a neutral desktop backdrop.
Tailwind utility classes only; no external UI kit required. Use lucide-react for icons.
All state in React (useState/useReducer). Seed with realistic mock data; no persistence.
Smooth screen transitions; everything tappable; nothing is a dead end.
Include a small "demo reset" control and a hidden dev tab-bar to jump between top-level screens for presenting.


VISUAL IDENTITY (match the WGenie brand)


Dark theme. Background near-black #0A0E0A; cards #161D16 / #1C241C with 1px border #2A352A and soft shadow; rounded corners (radius ~20px).
Accent lime #7CE03A (primary actions, highlights, positive states); darker lime #5BBF24 for pressed.
Text: primary #EEF3EE, dim #9FB09F, faint #6B7A6B.
Warm accent for "over-consuming" states: #FF9B54.
Occasional cream surface #F4F6EE with dark text for contrast screens.
Big, bold display headings; clean sans body. Generous spacing. Feels like a modern fintech/energy app, playful but trustworthy. No emojis in UI chrome except sparingly in gamification (🔥 streaks, 🌳 trees, 🏆 badges).


PERSONAS / MOCK DATA (seed the flat)


Flat "Sonnenstraße 12" in Augsburg, 3 flatmates:

Sara (you / current user) — avatar color lime #7CE03A
Jonas — blue #54B4FF
Alex — orange #FF9B54



Rooms: Sara's room, Jonas's room, Alex's room, + shared spaces: Kitchen, Living Room.
Devices (pre-seedable but also addable in-flow): Laptop+monitor (Sara), Gaming console (Alex), Space heater (Jonas), Fridge (Kitchen/shared), Washing machine (shared), Living-room TV (shared).
Electricity tariff: €0.40 / kWh (editable).
Seed ~1 month of plausible usage so the dashboard and leaderboard have numbers.



SCREENS & FLOWS TO BUILD

1. Splash / Welcome


Logo "WGenie", tagline "Save money. Save the planet. Save your friendships."
Two buttons: "Create a WG" (primary) and "Join with a code" (secondary).


2. Onboarding carousel (3 short slides, skippable)


"Shared bills, unequal usage." — the problem.
"Pay for exactly what you use." — the fair-split promise.
"Start free. Go automatic when you're ready." — introduces Tier 1 vs Tier 2.



Progress dots; "Skip" and "Next"; last slide button = "Set up my WG".


3. Create WG → set the layout (this is the core Tier 1 setup)

Step-by-step wizard, one decision per screen, with a top progress bar:


Name the flat (pre-filled "Sonnenstraße 12", editable).
How many rooms? — stepper/selector (2–6). Choosing e.g. 3 creates 3 room slots.
Assign each room to a flatmate — list of rooms, tap to attach a person (add people inline: name + auto-assigned avatar color). Include shared spaces (Kitchen, Living Room) that belong to "Shared", not one person.
Add appliances/devices — for each room and each shared space, "＋ Add device": pick from a list (laptop, monitor, console, heater, fridge, washing machine, TV, kettle, other) or type a custom name. Each device shows which room/person it belongs to. Show a running count.
Set the electricity tariff — €/kWh input (default 0.40) or "pick my provider" mock list.
Invite flatmates — show a shareable invite code / link (mock) + "Copy".
Finish → land on the Home dashboard.


Make step 3 (room→user) and step 4 (add devices) feel effortless and central — these are the flows the pitch highlights.

4. Home Dashboard (Tier 1 — manual)


Top: flat name + current month + a "Free · Tier 1" badge.
Hero card: "Your share this month" — big € figure for Sara, with "of €[total] total", and a small pill showing trend vs last month (e.g. "↓ 9% — you're the saver" in lime, or "↑ over average" in warm orange).
Fair-split breakdown: horizontal bars per flatmate (Sara/Jonas/Alex) showing € owed, each in their avatar color, plus a line: "Equal split would be €[x] each — you'd overpay €[y]." (This contrast is the killer feature — make it prominent.)
"Log today's usage" primary button → opens the logging sheet (screen 5).
Persistent upgrade banner (see screen 7).
Bottom nav: Home / Log / Compete / Impact / Profile.


5. Manual logging (Tier 1 core interaction)


A bottom sheet / screen titled "Log usage" for today.
List of the user's devices + shared devices they used; for each, a quick input: hours used or a simple usage estimate (slider or +/- steppers), auto-converting to kWh and € live using the tariff.
Shared devices: let the user tag who used it (or "everyone").
"Save" → toast "Logged ✓", dashboard numbers update immediately.
Reinforce that this is a daily habit (a small streak indicator: "🔥 4-day logging streak"). The mild effort here is intentional — it motivates the Tier 2 upgrade.


6. Transparency / detail views


Per-device breakdown: tap any device → its kWh, €, and who it's attributed to over the month.
Shared consumption: how communal usage (kitchen, living room) is split.
CO₂ view: total kWh converted to CO₂, shown relatably ("= 3 trees' annual absorption").


7. Upgrade flow (Tier 1 → Tier 2) — the conversion engine


In-app upgrade banner on the dashboard: "Tired of logging by hand? Go automatic." → tap opens the marketplace.
Marketplace screen: header "Smart plugs available near you" (mock geolocation — "Showing options in Augsburg"). Show 2–3 compatible smart-plug cards (name, price ~€15–25, "Buy" → opens external link mock). Note: WGenie earns affiliate commission (can be a tiny footnote for realism).
After a mock "I got a plug" / "Connect plug" action: a short pairing screen (enter/scan code — mocked, auto-succeeds), assign the plug to a device/person.
On success: celebratory state → the app "upgrades" to Tier 2: badge changes to "Auto · Tier 2", the manual "Log usage" button is replaced by "Auto-tracking on", and the same dashboard UI now shows live/automatic data. Emphasize: same screens, no relearning — just no more manual logging.
Show the €4.99/member/month subscription confirmation as part of activating Tier 2 (mock checkout, no real payment).
Optional: mention TRV (smart radiator valve) as a later add-on for automatic heating fairness.


8. Gamification — "Compete" tab


Leaderboard: flatmates ranked by efficiency this month (lowest kWh = top). Highlight current user. Show streaks (🔥) and a badge (🏆 "Energy Saint").
Rewards/streaks; a light "loser buys the Feierabend drink" flavor line.
Monthly reset note.


9. Impact tab


Flat's total CO₂ saved, shown as trees 🌳 with a short animation.
Cumulative € saved and % consumption reduction stats.


10. Profile / settings (light)


User + flat info, tier status (Tier 1/Tier 2 toggle for demo), tariff edit, "manage flatmates", and a "Reset demo" button.



INTERACTION & POLISH REQUIREMENTS


Every button does something; no dead ends. Back navigation everywhere.
Live-updating numbers: logging or toggling tier immediately changes dashboard figures.
Include a presenter-friendly path: Splash → onboarding → create WG → assign rooms → add devices → dashboard → log usage → upgrade banner → marketplace → connect plug → Tier 2 dashboard → leaderboard → impact. Make this happen in taps, smoothly.
Add a subtle dev/demo switcher (small tab bar or menu) to jump to any top-level screen for presenting out of order.
Accessibility-reasonable contrast; tap targets ≥ 44px.


DELIVERABLE

A single runnable React file (or minimal file set) I can open and click through immediately, seeded with the mock flat above, matching the dark-lime-cream WGenie identity. Prioritize the setup flow (rooms → users → devices), the fair-split dashboard with the "equal split would cost you more" contrast, and the Tier 1 → Tier 2 upgrade — those are the three moments the demo depends on.