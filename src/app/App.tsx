import { useState, useEffect, useRef } from "react";
import {
  Home, Zap, Leaf, User, ChevronRight, ChevronLeft,
  Plus, Minus, Copy, Check, X, Wifi, ShoppingBag, Award,
  TrendingDown, Plug, Edit2,
  Tv, Refrigerator, WashingMachine, Laptop, Gamepad2, Thermometer,
  Coffee, Star, RotateCcw, MapPin, Battery
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

type Screen =
  | "splash" | "onboarding" | "setup" | "home" | "log"
  | "device-detail" | "marketplace" | "pairing" | "compete"
  | "impact" | "profile";

interface Flatmate {
  id: string;
  name: string;
  color: string;
  isCurrentUser: boolean;
}

interface Room {
  id: string;
  name: string;
  ownerId: string;
}

interface Device {
  id: string;
  name: string;
  roomId: string;
  ownerId: string;
  wattsTypical: number;
  iconName: string;
}

interface DailyLog {
  date: string;
  deviceId: string;
  hoursUsed: number;
  attributedTo: string[];
}

// ─── Mock seed data ───────────────────────────────────────────────────────────

const SEED_FLATMATES: Flatmate[] = [
  { id: "sara", name: "Sara", color: "#7CE03A", isCurrentUser: true },
  { id: "jonas", name: "Jonas", color: "#54B4FF", isCurrentUser: false },
  { id: "alex", name: "Alex", color: "#FF9B54", isCurrentUser: false },
];

const SEED_ROOMS: Room[] = [
  { id: "r-sara", name: "Sara's Room", ownerId: "sara" },
  { id: "r-jonas", name: "Jonas's Room", ownerId: "jonas" },
  { id: "r-alex", name: "Alex's Room", ownerId: "alex" },
  { id: "r-kitchen", name: "Kitchen", ownerId: "shared" },
  { id: "r-living", name: "Living Room", ownerId: "shared" },
];

const SEED_DEVICES: Device[] = [
  { id: "d-laptop", name: "Laptop & Monitor", roomId: "r-sara", ownerId: "sara", wattsTypical: 120, iconName: "laptop" },
  { id: "d-console", name: "Gaming Console", roomId: "r-alex", ownerId: "alex", wattsTypical: 180, iconName: "gamepad" },
  { id: "d-heater", name: "Space Heater", roomId: "r-jonas", ownerId: "jonas", wattsTypical: 1500, iconName: "heater" },
  { id: "d-fridge", name: "Fridge", roomId: "r-kitchen", ownerId: "shared", wattsTypical: 40, iconName: "fridge" },
  { id: "d-washer", name: "Washing Machine", roomId: "r-kitchen", ownerId: "shared", wattsTypical: 2000, iconName: "washer" },
  { id: "d-tv", name: "Living Room TV", roomId: "r-living", ownerId: "shared", wattsTypical: 80, iconName: "tv" },
];

function generateLogs(): DailyLog[] {
  const logs: DailyLog[] = [];
  const now = new Date();
  for (let day = 0; day < 30; day++) {
    const d = new Date(now);
    d.setDate(d.getDate() - day);
    const dateStr = d.toISOString().split("T")[0];

    logs.push({ date: dateStr, deviceId: "d-laptop", hoursUsed: 5 + Math.random() * 4, attributedTo: ["sara"] });
    logs.push({ date: dateStr, deviceId: "d-console", hoursUsed: 2 + Math.random() * 3, attributedTo: ["alex"] });
    logs.push({ date: dateStr, deviceId: "d-heater", hoursUsed: day < 15 ? 3 + Math.random() * 4 : 1 + Math.random() * 2, attributedTo: ["jonas"] });
    logs.push({ date: dateStr, deviceId: "d-fridge", hoursUsed: 24, attributedTo: ["sara", "jonas", "alex"] });
    if (Math.random() > 0.6) {
      logs.push({ date: dateStr, deviceId: "d-washer", hoursUsed: 1.5, attributedTo: ["sara", "jonas", "alex"] });
    }
    logs.push({ date: dateStr, deviceId: "d-tv", hoursUsed: 2 + Math.random() * 3, attributedTo: ["sara", "jonas", "alex"] });
  }
  return logs;
}

const SEED_LOGS = generateLogs();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeCosts(logs: DailyLog[], devices: Device[], tariff: number, flatmates: Flatmate[]) {
  const byOwner: Record<string, number> = { sara: 0, jonas: 0, alex: 0, shared: 0 };
  for (const log of logs) {
    const dev = devices.find((d) => d.id === log.deviceId);
    if (!dev) continue;
    const kwh = (dev.wattsTypical * log.hoursUsed) / 1000;
    const cost = kwh * tariff;
    if (dev.ownerId === "shared") {
      const perPerson = cost / log.attributedTo.length;
      for (const pid of log.attributedTo) {
        byOwner[pid] = (byOwner[pid] || 0) + perPerson;
      }
    } else {
      byOwner[dev.ownerId] = (byOwner[dev.ownerId] || 0) + cost;
    }
  }
  return byOwner;
}

function computeKwh(logs: DailyLog[], devices: Device[]) {
  const byOwner: Record<string, number> = { sara: 0, jonas: 0, alex: 0 };
  for (const log of logs) {
    const dev = devices.find((d) => d.id === log.deviceId);
    if (!dev) continue;
    const kwh = (dev.wattsTypical * log.hoursUsed) / 1000;
    if (dev.ownerId === "shared") {
      const perPerson = kwh / log.attributedTo.length;
      for (const pid of log.attributedTo) {
        if (byOwner[pid] !== undefined) byOwner[pid] += perPerson;
      }
    } else if (byOwner[dev.ownerId] !== undefined) {
      byOwner[dev.ownerId] += kwh;
    }
  }
  return byOwner;
}

const fmt = (n: number) => `€${n.toFixed(2)}`;
const fmtKwh = (n: number) => `${n.toFixed(1)} kWh`;

// ─── Device icon helper ───────────────────────────────────────────────────────

function DeviceIcon({ name, size = 18, className = "" }: { name: string; size?: number; className?: string }) {
  const props = { size, className };
  switch (name) {
    case "laptop": return <Laptop {...props} />;
    case "gamepad": return <Gamepad2 {...props} />;
    case "heater": return <Thermometer {...props} />;
    case "fridge": return <Refrigerator {...props} />;
    case "washer": return <WashingMachine {...props} />;
    case "tv": return <Tv {...props} />;
    case "coffee": return <Coffee {...props} />;
    default: return <Zap {...props} />;
  }
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, color, size = 32 }: { name: string; color: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-[#0A0E0A] flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.38, fontFamily: "Manrope, sans-serif" }}
    >
      {name[0]}
    </div>
  );
}

// ─── App state ────────────────────────────────────────────────────────────────

interface AppState {
  screen: Screen;
  prevScreen: Screen | null;
  tier: 1 | 2;
  flatName: string;
  numRooms: number;
  flatmates: Flatmate[];
  rooms: Room[];
  devices: Device[];
  tariff: number;
  logs: DailyLog[];
  streak: number;
  toast: string | null;
  selectedDeviceId: string | null;
  setupStep: number;
  onboardingSlide: number;
  pairingStage: "enter" | "success";
  logDraft: Record<string, number>;
  showDevicePicker: string | null; // roomId
  newDeviceName: string;
  newFlatmateName: string;
  copiedInvite: boolean;
}

const initialState = (): AppState => ({
  screen: "splash",
  prevScreen: null,
  tier: 1,
  flatName: "Sonnenstraße 12",
  numRooms: 3,
  flatmates: SEED_FLATMATES,
  rooms: SEED_ROOMS,
  devices: SEED_DEVICES,
  tariff: 0.4,
  logs: SEED_LOGS,
  streak: 4,
  toast: null,
  selectedDeviceId: null,
  setupStep: 1,
  onboardingSlide: 0,
  pairingStage: "enter",
  logDraft: {},
  showDevicePicker: null,
  newDeviceName: "",
  newFlatmateName: "",
  copiedInvite: false,
});

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [s, setS] = useState<AppState>(initialState);

  const go = (screen: Screen) =>
    setS((p) => ({ ...p, screen, prevScreen: p.screen }));

  const showToast = (msg: string) => {
    setS((p) => ({ ...p, toast: msg }));
    setTimeout(() => setS((p) => ({ ...p, toast: null })), 2500);
  };

  const costs = computeCosts(s.logs, s.devices, s.tariff, s.flatmates);
  const kwhMap = computeKwh(s.logs, s.devices);
  const totalCost = Object.values(costs).reduce((a, b) => a + b, 0);
  const equalSplit = totalCost / 3;
  const saraShare = costs["sara"] || 0;
  const saraOverpay = equalSplit - saraShare;

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#060906", fontFamily: "DM Sans, sans-serif" }}
    >
      {/* Desktop backdrop label */}
      <div className="fixed top-4 left-6 text-xs font-bold tracking-widest" style={{ color: "#2A352A", fontFamily: "Manrope, sans-serif" }}>
        WGENIE PROTOTYPE
      </div>

      {/* Phone frame */}
      <div
        className="relative flex flex-col overflow-hidden shadow-2xl"
        style={{
          width: 390,
          height: 844,
          background: "#0A0E0A",
          borderRadius: 44,
          border: "1px solid #2A352A",
          boxShadow: "0 0 0 8px #0D120D, 0 40px 80px rgba(0,0,0,0.8)",
        }}
      >
        {/* Status bar */}
        <div className="flex justify-between items-center px-6 pt-3 pb-1 flex-shrink-0" style={{ fontSize: 11, color: "#6B7A6B" }}>
          <span style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700 }}>9:41</span>
          <div className="flex gap-1 items-center">
            <Wifi size={12} />
            <Battery size={14} />
          </div>
        </div>

        {/* Dev jump bar */}
        <DevJumpBar current={s.screen} go={go} />

        {/* Screen content */}
        <div className="flex-1 overflow-hidden relative">
          {s.screen === "splash" && <SplashScreen go={go} />}
          {s.screen === "onboarding" && (
            <OnboardingScreen
              slide={s.onboardingSlide}
              setSlide={(n) => setS((p) => ({ ...p, onboardingSlide: n }))}
              go={go}
            />
          )}
          {s.screen === "setup" && (
            <SetupWizard
              s={s}
              setS={setS}
              go={go}
              showToast={showToast}
            />
          )}
          {s.screen === "home" && (
            <HomeDashboard
              s={s}
              go={go}
              setS={setS}
              costs={costs}
              kwhMap={kwhMap}
              totalCost={totalCost}
              equalSplit={equalSplit}
              saraShare={saraShare}
              saraOverpay={saraOverpay}
            />
          )}
          {s.screen === "log" && (
            <LogSheet
              s={s}
              setS={setS}
              go={go}
              showToast={showToast}
            />
          )}
          {s.screen === "device-detail" && (
            <DeviceDetail
              s={s}
              go={go}
              costs={costs}
              kwhMap={kwhMap}
            />
          )}
          {s.screen === "marketplace" && (
            <MarketplaceScreen go={go} showToast={showToast} />
          )}
          {s.screen === "pairing" && (
            <PairingScreen
              s={s}
              setS={setS}
              go={go}
              showToast={showToast}
            />
          )}
          {s.screen === "compete" && (
            <CompeteTab s={s} go={go} kwhMap={kwhMap} />
          )}
          {s.screen === "impact" && (
            <ImpactTab s={s} go={go} kwhMap={kwhMap} />
          )}
          {s.screen === "profile" && (
            <ProfileTab
              s={s}
              setS={setS}
              go={go}
              reset={() => setS(initialState())}
            />
          )}
        </div>

        {/* Bottom nav (shown on main app screens) */}
        {["home", "log", "compete", "impact", "profile"].includes(s.screen) && (
          <BottomNav current={s.screen} go={go} />
        )}

        {/* Toast */}
        {s.toast && (
          <div
            className="absolute bottom-24 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-sm font-semibold z-50"
            style={{ background: "#7CE03A", color: "#0A0E0A", fontFamily: "Manrope, sans-serif", whiteSpace: "nowrap" }}
          >
            {s.toast}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dev jump bar ─────────────────────────────────────────────────────────────

function DevJumpBar({ current, go }: { current: Screen; go: (s: Screen) => void }) {
  const items: { label: string; screen: Screen }[] = [
    { label: "Splash", screen: "splash" },
    { label: "Onboard", screen: "onboarding" },
    { label: "Setup", screen: "setup" },
    { label: "Home", screen: "home" },
    { label: "Log", screen: "log" },
    { label: "Market", screen: "marketplace" },
    { label: "Compete", screen: "compete" },
    { label: "Impact", screen: "impact" },
    { label: "Profile", screen: "profile" },
  ];
  return (
    <div
      className="flex gap-1 px-2 py-1 overflow-x-auto flex-shrink-0"
      style={{ background: "rgba(22,29,22,0.95)", borderBottom: "1px solid #2A352A" }}
    >
      {items.map((item) => (
        <button
          key={item.screen}
          onClick={() => go(item.screen)}
          className="px-2 py-0.5 rounded text-[10px] flex-shrink-0 transition-all"
          style={{
            fontFamily: "Manrope, sans-serif",
            fontWeight: 700,
            background: current === item.screen ? "#7CE03A" : "transparent",
            color: current === item.screen ? "#0A0E0A" : "#6B7A6B",
            letterSpacing: "0.04em",
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ─── Bottom nav ───────────────────────────────────────────────────────────────

function BottomNav({ current, go }: { current: Screen; go: (s: Screen) => void }) {
  const items = [
    { icon: Home, label: "Home", screen: "home" as Screen },
    { icon: Zap, label: "Log", screen: "log" as Screen },
    { icon: Award, label: "Compete", screen: "compete" as Screen },
    { icon: Leaf, label: "Impact", screen: "impact" as Screen },
    { icon: User, label: "Profile", screen: "profile" as Screen },
  ];
  return (
    <div
      className="flex justify-around items-center px-2 py-2 flex-shrink-0"
      style={{ background: "#0D120D", borderTop: "1px solid #2A352A" }}
    >
      {items.map(({ icon: Icon, label, screen }) => {
        const active = current === screen;
        return (
          <button
            key={screen}
            onClick={() => go(screen)}
            className="flex flex-col items-center gap-0.5 min-w-[52px] py-1 transition-all"
          >
            <Icon size={20} color={active ? "#7CE03A" : "#6B7A6B"} />
            <span
              className="text-[10px]"
              style={{ color: active ? "#7CE03A" : "#6B7A6B", fontFamily: "Manrope, sans-serif", fontWeight: active ? 700 : 500 }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Splash ───────────────────────────────────────────────────────────────────

function SplashScreen({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-between px-8 py-12" style={{ background: "#0A0E0A" }}>
      <div />
      <div className="flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "#7CE03A" }}
          >
            <Zap size={28} color="#0A0E0A" strokeWidth={2.5} />
          </div>
          <span
            className="text-4xl"
            style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, color: "#EEF3EE", letterSpacing: "-0.02em" }}
          >
            WGenie
          </span>
        </div>
        <p
          className="text-center text-lg leading-snug"
          style={{ color: "#9FB09F", maxWidth: 260, fontFamily: "DM Sans, sans-serif" }}
        >
          Save money. Save the planet.<br />Save your friendships.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full">
        <Btn onClick={() => go("onboarding")}>Create a WG</Btn>
        <BtnSecondary onClick={() => go("home")}>Join with a code</BtnSecondary>
      </div>
    </div>
  );
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

const SLIDES = [
  {
    emoji: "💸",
    title: "Shared bills,\nunequal usage.",
    body: "Your flatmate has a space heater running 24/7. Why should you split that equally?",
  },
  {
    emoji: "⚡",
    title: "Pay for exactly\nwhat you use.",
    body: "WGenie tracks each device per person, so the bill is always fair — no spreadsheets needed.",
  },
  {
    emoji: "🚀",
    title: "Start free.\nGo automatic\nwhen you're ready.",
    body: "Tier 1 is free — just log your usage daily. Upgrade to smart plugs for automatic tracking.",
  },
];

function OnboardingScreen({
  slide, setSlide, go,
}: { slide: number; setSlide: (n: number) => void; go: (s: Screen) => void }) {
  const isLast = slide === SLIDES.length - 1;
  const current = SLIDES[slide];
  return (
    <div className="h-full flex flex-col px-8 py-6" style={{ background: "#0A0E0A" }}>
      {/* Skip */}
      <div className="flex justify-end">
        <button
          className="text-sm"
          style={{ color: "#6B7A6B" }}
          onClick={() => go("setup")}
        >
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
        <div className="text-6xl">{current.emoji}</div>
        <h1
          className="text-3xl leading-tight whitespace-pre-line"
          style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, color: "#EEF3EE", letterSpacing: "-0.02em" }}
        >
          {current.title}
        </h1>
        <p className="text-base leading-relaxed" style={{ color: "#9FB09F", maxWidth: 280 }}>
          {current.body}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-6">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all"
            style={{
              width: i === slide ? 20 : 6,
              height: 6,
              background: i === slide ? "#7CE03A" : "#2A352A",
            }}
          />
        ))}
      </div>

      {/* CTA */}
      {isLast ? (
        <Btn onClick={() => go("setup")}>Set up my WG</Btn>
      ) : (
        <Btn onClick={() => setSlide(slide + 1)}>Next</Btn>
      )}
    </div>
  );
}

// ─── Setup Wizard ─────────────────────────────────────────────────────────────

const DEVICE_PRESETS = [
  { name: "Laptop", iconName: "laptop", watts: 60 },
  { name: "Monitor", iconName: "laptop", watts: 30 },
  { name: "Gaming Console", iconName: "gamepad", watts: 180 },
  { name: "Space Heater", iconName: "heater", watts: 1500 },
  { name: "Fridge", iconName: "fridge", watts: 40 },
  { name: "Washing Machine", iconName: "washer", watts: 2000 },
  { name: "TV", iconName: "tv", watts: 80 },
  { name: "Kettle", iconName: "coffee", watts: 2000 },
  { name: "Other", iconName: "zap", watts: 100 },
];

function SetupWizard({
  s, setS, go, showToast,
}: {
  s: AppState;
  setS: React.Dispatch<React.SetStateAction<AppState>>;
  go: (sc: Screen) => void;
  showToast: (m: string) => void;
}) {
  const totalSteps = 6;
  const progress = (s.setupStep / totalSteps) * 100;

  return (
    <div className="h-full flex flex-col" style={{ background: "#0A0E0A" }}>
      {/* Progress bar */}
      <div className="px-6 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-3 mb-1">
          {s.setupStep > 1 && (
            <button onClick={() => setS((p) => ({ ...p, setupStep: p.setupStep - 1 }))}>
              <ChevronLeft size={20} color="#9FB09F" />
            </button>
          )}
          <div className="flex-1 h-1 rounded-full" style={{ background: "#2A352A" }}>
            <div
              className="h-1 rounded-full transition-all"
              style={{ width: `${progress}%`, background: "#7CE03A" }}
            />
          </div>
          <span className="text-xs" style={{ color: "#6B7A6B", fontFamily: "Manrope, sans-serif", fontWeight: 700 }}>
            {s.setupStep}/{totalSteps}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {s.setupStep === 1 && <SetupStep1 s={s} setS={setS} />}
        {s.setupStep === 2 && <SetupStep2 s={s} setS={setS} />}
        {s.setupStep === 3 && <SetupStep3 s={s} setS={setS} />}
        {s.setupStep === 4 && <SetupStep4 s={s} setS={setS} />}
        {s.setupStep === 5 && <SetupStep5 s={s} setS={setS} />}
        {s.setupStep === 6 && <SetupStep6 s={s} setS={setS} go={go} showToast={showToast} />}
      </div>

      {s.setupStep < 6 && (
        <div className="px-6 py-4 flex-shrink-0">
          <Btn onClick={() => setS((p) => ({ ...p, setupStep: p.setupStep + 1 }))}>
            Continue
          </Btn>
        </div>
      )}
    </div>
  );
}

function SetupStep1({ s, setS }: { s: AppState; setS: React.Dispatch<React.SetStateAction<AppState>> }) {
  return (
    <div className="px-6 py-4">
      <StepHeader step={1} title="Name your flat" subtitle="What do you call your home?" />
      <input
        className="w-full px-4 py-3 rounded-2xl text-lg mt-2 outline-none border"
        style={{
          background: "#1C241C",
          color: "#EEF3EE",
          borderColor: "#2A352A",
          fontFamily: "Manrope, sans-serif",
          fontWeight: 700,
        }}
        value={s.flatName}
        onChange={(e) => setS((p) => ({ ...p, flatName: e.target.value }))}
        placeholder="e.g. Sonnenstraße 12"
      />
      <p className="mt-3 text-sm" style={{ color: "#6B7A6B" }}>
        This is shown to all flatmates in the app.
      </p>
    </div>
  );
}

function SetupStep2({ s, setS }: { s: AppState; setS: React.Dispatch<React.SetStateAction<AppState>> }) {
  return (
    <div className="px-6 py-4">
      <StepHeader step={2} title="How many rooms?" subtitle="Private rooms only — shared spaces come later." />
      <div className="flex items-center justify-center gap-8 mt-8">
        <button
          className="w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all"
          style={{ borderColor: s.numRooms <= 2 ? "#2A352A" : "#7CE03A" }}
          onClick={() => setS((p) => ({ ...p, numRooms: Math.max(2, p.numRooms - 1) }))}
        >
          <Minus size={20} color={s.numRooms <= 2 ? "#6B7A6B" : "#7CE03A"} />
        </button>
        <span
          className="text-6xl"
          style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, color: "#EEF3EE", minWidth: 60, textAlign: "center" }}
        >
          {s.numRooms}
        </span>
        <button
          className="w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all"
          style={{ borderColor: s.numRooms >= 6 ? "#2A352A" : "#7CE03A" }}
          onClick={() => setS((p) => ({ ...p, numRooms: Math.min(6, p.numRooms + 1) }))}
        >
          <Plus size={20} color={s.numRooms >= 6 ? "#6B7A6B" : "#7CE03A"} />
        </button>
      </div>
      <p className="text-center mt-4 text-sm" style={{ color: "#9FB09F" }}>
        You can add more flatmates later
      </p>
    </div>
  );
}

function SetupStep3({ s, setS }: { s: AppState; setS: React.Dispatch<React.SetStateAction<AppState>> }) {
  const addFlatmate = () => {
    if (!s.newFlatmateName.trim()) return;
    const colors = ["#54B4FF", "#FF9B54", "#C084FC", "#FB7185", "#34D399"];
    const usedColors = s.flatmates.map((f) => f.color);
    const color = colors.find((c) => !usedColors.includes(c)) || "#9FB09F";
    const newFm: Flatmate = {
      id: s.newFlatmateName.toLowerCase().replace(/\s+/g, "-"),
      name: s.newFlatmateName,
      color,
      isCurrentUser: false,
    };
    const newRoom: Room = {
      id: `r-${newFm.id}`,
      name: `${s.newFlatmateName}'s Room`,
      ownerId: newFm.id,
    };
    setS((p) => ({
      ...p,
      flatmates: [...p.flatmates, newFm],
      rooms: [...p.rooms.filter((r) => r.ownerId !== "shared"), newRoom, ...p.rooms.filter((r) => r.ownerId === "shared")],
      newFlatmateName: "",
    }));
  };

  const privateRooms = s.rooms.filter((r) => r.ownerId !== "shared");
  const sharedRooms = s.rooms.filter((r) => r.ownerId === "shared");

  return (
    <div className="px-6 py-4">
      <StepHeader step={3} title="Assign rooms" subtitle="Who lives where? Tap to change owner." />

      <div className="flex flex-col gap-2 mt-3">
        {privateRooms.map((room) => {
          const owner = s.flatmates.find((f) => f.id === room.ownerId);
          return (
            <div
              key={room.id}
              className="flex items-center justify-between px-4 py-3 rounded-2xl border"
              style={{ background: "#161D16", borderColor: "#2A352A" }}
            >
              <span style={{ color: "#EEF3EE" }}>{room.name}</span>
              {owner && <Avatar name={owner.name} color={owner.color} size={28} />}
            </div>
          );
        })}
      </div>

      <div className="mt-4 px-4 py-3 rounded-2xl border" style={{ background: "#1C241C", borderColor: "#2A352A" }}>
        <p className="text-xs mb-2" style={{ color: "#9FB09F", fontFamily: "Manrope, sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}>SHARED SPACES</p>
        {sharedRooms.map((r) => (
          <div key={r.id} className="flex items-center gap-2 py-1">
            <div className="w-2 h-2 rounded-full" style={{ background: "#9FB09F" }} />
            <span className="text-sm" style={{ color: "#9FB09F" }}>{r.name}</span>
          </div>
        ))}
      </div>

      {/* Add flatmate inline */}
      <div className="mt-4">
        <p className="text-xs mb-2" style={{ color: "#6B7A6B" }}>Add another flatmate</p>
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 rounded-xl border outline-none text-sm"
            style={{ background: "#1C241C", borderColor: "#2A352A", color: "#EEF3EE" }}
            placeholder="Their name"
            value={s.newFlatmateName}
            onChange={(e) => setS((p) => ({ ...p, newFlatmateName: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && addFlatmate()}
          />
          <button
            className="px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: "#7CE03A", color: "#0A0E0A", fontFamily: "Manrope, sans-serif" }}
            onClick={addFlatmate}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function SetupStep4({ s, setS }: { s: AppState; setS: React.Dispatch<React.SetStateAction<AppState>> }) {
  const addDeviceFromPreset = (roomId: string, preset: typeof DEVICE_PRESETS[0]) => {
    const newDev: Device = {
      id: `d-${Date.now()}`,
      name: preset.name,
      roomId,
      ownerId: s.rooms.find((r) => r.id === roomId)?.ownerId || "shared",
      wattsTypical: preset.watts,
      iconName: preset.iconName,
    };
    setS((p) => ({ ...p, devices: [...p.devices, newDev], showDevicePicker: null }));
  };

  return (
    <div className="px-6 py-4 relative">
      <StepHeader step={4} title="Add devices" subtitle="Track what consumes power in each space." />

      <div className="flex flex-col gap-3 mt-3">
        {s.rooms.map((room) => {
          const roomDevices = s.devices.filter((d) => d.roomId === room.id);
          return (
            <div key={room.id} className="rounded-2xl border overflow-hidden" style={{ borderColor: "#2A352A" }}>
              <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "#1C241C" }}>
                <span className="text-sm font-semibold" style={{ fontFamily: "Manrope, sans-serif", color: "#EEF3EE" }}>
                  {room.name}
                </span>
                <button
                  className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg"
                  style={{ background: "#7CE03A22", color: "#7CE03A" }}
                  onClick={() => setS((p) => ({ ...p, showDevicePicker: room.id }))}
                >
                  <Plus size={12} /> Add
                </button>
              </div>
              {roomDevices.length > 0 && (
                <div className="px-4 py-2 flex flex-col gap-1" style={{ background: "#161D16" }}>
                  {roomDevices.map((d) => (
                    <div key={d.id} className="flex items-center gap-2 py-1">
                      <DeviceIcon name={d.iconName} size={14} className="" />
                      <span className="text-sm" style={{ color: "#9FB09F" }}>{d.name}</span>
                      <span className="ml-auto text-xs" style={{ color: "#6B7A6B" }}>{d.wattsTypical}W</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-center">
        <span className="text-sm" style={{ color: "#9FB09F" }}>
          {s.devices.length} devices added
        </span>
      </div>

      {/* Device picker modal */}
      {s.showDevicePicker && (
        <div className="absolute inset-0 flex flex-col" style={{ background: "#0A0E0A" }}>
          <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: "#2A352A" }}>
            <button onClick={() => setS((p) => ({ ...p, showDevicePicker: null }))}>
              <X size={20} color="#9FB09F" />
            </button>
            <span className="font-bold" style={{ fontFamily: "Manrope, sans-serif", color: "#EEF3EE" }}>
              Choose a device
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-2 content-start">
            {DEVICE_PRESETS.map((preset) => (
              <button
                key={preset.name}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all"
                style={{ background: "#161D16", borderColor: "#2A352A" }}
                onClick={() => addDeviceFromPreset(s.showDevicePicker!, preset)}
              >
                <DeviceIcon name={preset.iconName} size={24} />
                <span className="text-sm font-semibold" style={{ color: "#EEF3EE", fontFamily: "Manrope, sans-serif" }}>{preset.name}</span>
                <span className="text-xs" style={{ color: "#6B7A6B" }}>{preset.watts}W</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SetupStep5({ s, setS }: { s: AppState; setS: React.Dispatch<React.SetStateAction<AppState>> }) {
  return (
    <div className="px-6 py-4">
      <StepHeader step={5} title="Electricity tariff" subtitle="Used to calculate your fair share in euros." />

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex items-center gap-3 px-4 py-4 rounded-2xl border" style={{ background: "#1C241C", borderColor: "#2A352A" }}>
          <span className="text-2xl font-bold" style={{ color: "#7CE03A", fontFamily: "Manrope, sans-serif" }}>€</span>
          <input
            type="number"
            step="0.01"
            min="0.1"
            max="1.0"
            className="flex-1 text-2xl font-bold bg-transparent outline-none"
            style={{ color: "#EEF3EE", fontFamily: "Manrope, sans-serif" }}
            value={s.tariff}
            onChange={(e) => setS((p) => ({ ...p, tariff: parseFloat(e.target.value) || 0.4 }))}
          />
          <span style={{ color: "#9FB09F" }}>/ kWh</span>
        </div>

        <p className="text-sm text-center" style={{ color: "#6B7A6B" }}>
          Germany average is approx. €0.40/kWh
        </p>

        <div className="mt-2">
          <p className="text-xs mb-2" style={{ color: "#9FB09F", fontFamily: "Manrope, sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}>OR PICK YOUR PROVIDER</p>
          {["E.ON (€0.38)", "Vattenfall (€0.41)", "Stadtwerke Augsburg (€0.43)"].map((prov) => (
            <button
              key={prov}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl mb-2 border"
              style={{ background: "#161D16", borderColor: "#2A352A", color: "#9FB09F" }}
              onClick={() => {
                const rate = parseFloat(prov.match(/€([\d.]+)/)?.[1] || "0.4");
                setS((p) => ({ ...p, tariff: rate }));
              }}
            >
              <span className="text-sm">{prov}</span>
              <ChevronRight size={16} color="#6B7A6B" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SetupStep6({ s, setS, go, showToast }: { s: AppState; setS: React.Dispatch<React.SetStateAction<AppState>>; go: (sc: Screen) => void; showToast: (m: string) => void }) {
  const code = "WGENIE-SN12-4X7R";
  return (
    <div className="px-6 py-4 flex flex-col gap-6">
      <StepHeader step={6} title="Invite flatmates" subtitle="Share this code so they can join your WG." />

      <div className="flex flex-col items-center gap-4 mt-4">
        <div
          className="w-full px-6 py-6 rounded-3xl border flex flex-col items-center gap-3"
          style={{ background: "#161D16", borderColor: "#2A352A" }}
        >
          <p className="text-xs" style={{ color: "#6B7A6B", letterSpacing: "0.1em", fontFamily: "Manrope, sans-serif" }}>INVITE CODE</p>
          <span
            className="text-2xl tracking-widest"
            style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, color: "#7CE03A" }}
          >
            {code}
          </span>
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold mt-1 transition-all"
            style={{ background: s.copiedInvite ? "#5BBF24" : "#7CE03A", color: "#0A0E0A", fontFamily: "Manrope, sans-serif" }}
            onClick={() => {
              setS((p) => ({ ...p, copiedInvite: true }));
              showToast("Code copied!");
              setTimeout(() => setS((p) => ({ ...p, copiedInvite: false })), 2000);
            }}
          >
            {s.copiedInvite ? <Check size={14} /> : <Copy size={14} />}
            {s.copiedInvite ? "Copied!" : "Copy code"}
          </button>
        </div>

        <div className="flex items-center w-full gap-3">
          <div className="flex-1 h-px" style={{ background: "#2A352A" }} />
          <span className="text-xs" style={{ color: "#6B7A6B" }}>or</span>
          <div className="flex-1 h-px" style={{ background: "#2A352A" }} />
        </div>

        <button className="text-sm" style={{ color: "#9FB09F" }}>
          Skip for now — do it later
        </button>
      </div>

      <div className="mt-auto">
        <Btn onClick={() => go("home")}>Go to Dashboard →</Btn>
      </div>
    </div>
  );
}

function StepHeader({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  return (
    <div className="mb-2">
      <p className="text-xs mb-1" style={{ color: "#7CE03A", fontFamily: "Manrope, sans-serif", fontWeight: 700, letterSpacing: "0.1em" }}>
        STEP {step}
      </p>
      <h2 className="text-2xl leading-tight" style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, color: "#EEF3EE", letterSpacing: "-0.02em" }}>
        {title}
      </h2>
      <p className="text-sm mt-1" style={{ color: "#9FB09F" }}>{subtitle}</p>
    </div>
  );
}

// ─── Home Dashboard ───────────────────────────────────────────────────────────

function HomeDashboard({
  s, go, setS, costs, kwhMap, totalCost, equalSplit, saraShare, saraOverpay,
}: {
  s: AppState; go: (sc: Screen) => void; setS: React.Dispatch<React.SetStateAction<AppState>>;
  costs: Record<string, number>; kwhMap: Record<string, number>;
  totalCost: number; equalSplit: number; saraShare: number; saraOverpay: number;
}) {
  const maxCost = Math.max(...s.flatmates.map((f) => costs[f.id] || 0));

  return (
    <div className="h-full flex flex-col overflow-y-auto" style={{ background: "#0A0E0A" }}>
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-xs font-bold" style={{ color: "#6B7A6B", letterSpacing: "0.08em", fontFamily: "Manrope, sans-serif" }}>
            {s.flatName.toUpperCase()}
          </p>
          <h2 className="text-xl" style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, color: "#EEF3EE" }}>
            {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
          </h2>
        </div>
        <div
          className="px-3 py-1 rounded-full text-xs font-bold"
          style={{
            background: s.tier === 2 ? "#7CE03A" : "#1C241C",
            color: s.tier === 2 ? "#0A0E0A" : "#7CE03A",
            border: "1px solid #2A352A",
            fontFamily: "Manrope, sans-serif",
          }}
        >
          {s.tier === 2 ? "Auto · Tier 2" : "Free · Tier 1"}
        </div>
      </div>

      <div className="px-5 flex flex-col gap-4 pb-4">
        {/* Hero card */}
        <div
          className="rounded-3xl p-5 border"
          style={{ background: "#161D16", borderColor: "#2A352A" }}
        >
          <div className="flex items-start justify-between mb-1">
            <p className="text-sm" style={{ color: "#9FB09F" }}>Your share this month</p>
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: "#7CE03A22", color: "#7CE03A", fontFamily: "Manrope, sans-serif" }}
            >
              <TrendingDown size={10} /> ↓ 9%
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span
              className="text-5xl"
              style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, color: "#EEF3EE", letterSpacing: "-0.03em" }}
            >
              {fmt(saraShare)}
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: "#6B7A6B" }}>
            of {fmt(totalCost)} total flat usage
          </p>

          {s.tier === 2 ? (
            <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#1C241C" }}>
              <Wifi size={14} color="#7CE03A" />
              <span className="text-xs font-semibold" style={{ color: "#7CE03A", fontFamily: "Manrope, sans-serif" }}>
                Auto-tracking on — last updated 2 min ago
              </span>
            </div>
          ) : (
            <button
              className="mt-4 w-full py-3 rounded-2xl font-bold text-base transition-all active:scale-95"
              style={{ background: "#7CE03A", color: "#0A0E0A", fontFamily: "Manrope, sans-serif", fontWeight: 800 }}
              onClick={() => go("log")}
            >
              Log today's usage
            </button>
          )}
        </div>

        {/* Fair-split breakdown */}
        <div className="rounded-3xl p-5 border" style={{ background: "#161D16", borderColor: "#2A352A" }}>
          <p className="text-xs font-bold mb-3" style={{ color: "#9FB09F", letterSpacing: "0.08em", fontFamily: "Manrope, sans-serif" }}>
            FAIR SPLIT THIS MONTH
          </p>

          <div className="flex flex-col gap-3">
            {s.flatmates.map((fm) => {
              const cost = costs[fm.id] || 0;
              const pct = maxCost > 0 ? (cost / maxCost) * 100 : 0;
              return (
                <div key={fm.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Avatar name={fm.name} color={fm.color} size={22} />
                      <span className="text-sm font-semibold" style={{ color: "#EEF3EE", fontFamily: "Manrope, sans-serif" }}>
                        {fm.name}{fm.isCurrentUser && " (you)"}
                      </span>
                    </div>
                    <span className="text-sm font-bold" style={{ fontFamily: "Manrope, sans-serif", color: "#EEF3EE" }}>
                      {fmt(cost)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "#2A352A" }}>
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, background: fm.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* The killer feature */}
          <div
            className="mt-4 p-3 rounded-2xl border"
            style={{ background: "#0A0E0A", borderColor: "#7CE03A33" }}
          >
            <p className="text-xs leading-relaxed" style={{ color: "#9FB09F" }}>
              Equal split would be{" "}
              <span style={{ color: "#EEF3EE", fontFamily: "Manrope, sans-serif", fontWeight: 700 }}>{fmt(equalSplit)}</span>{" "}
              each. With WGenie,{" "}
              <span style={{ color: "#7CE03A", fontFamily: "Manrope, sans-serif", fontWeight: 700 }}>
                you save {fmt(Math.abs(saraOverpay))} this month
              </span>{" "}
              because you use less.
            </p>
          </div>
        </div>

        {/* Devices */}
        <div className="rounded-3xl p-5 border" style={{ background: "#161D16", borderColor: "#2A352A" }}>
          <p className="text-xs font-bold mb-3" style={{ color: "#9FB09F", letterSpacing: "0.08em", fontFamily: "Manrope, sans-serif" }}>
            YOUR DEVICES
          </p>
          <div className="flex flex-col gap-2">
            {s.devices.filter((d) => d.ownerId === "sara" || d.ownerId === "shared").map((dev) => {
              const devLogs = s.logs.filter((l) => l.deviceId === dev.id);
              const kwh = devLogs.reduce((sum, l) => sum + (dev.wattsTypical * l.hoursUsed) / 1000, 0);
              const cost = kwh * s.tariff / (dev.ownerId === "shared" ? 3 : 1);
              return (
                <button
                  key={dev.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all"
                  style={{ background: "#1C241C", borderColor: "#2A352A" }}
                  onClick={() => {
                    setS((p) => ({ ...p, selectedDeviceId: dev.id }));
                    go("device-detail");
                  }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#2A352A" }}>
                    <DeviceIcon name={dev.iconName} size={16} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold" style={{ color: "#EEF3EE", fontFamily: "Manrope, sans-serif" }}>{dev.name}</p>
                    <p className="text-xs" style={{ color: "#6B7A6B" }}>{fmtKwh(kwh)}</p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: "#EEF3EE", fontFamily: "Manrope, sans-serif" }}>{fmt(cost)}</span>
                  <ChevronRight size={14} color="#6B7A6B" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Upgrade banner */}
        {s.tier === 1 && (
          <button
            className="w-full rounded-3xl p-4 border flex items-center gap-4 transition-all"
            style={{ background: "#1C241C", borderColor: "#7CE03A44" }}
            onClick={() => go("marketplace")}
          >
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#7CE03A22" }}>
              <Plug size={18} color="#7CE03A" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold" style={{ color: "#EEF3EE", fontFamily: "Manrope, sans-serif" }}>
                Tired of logging by hand?
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#9FB09F" }}>Go automatic with a smart plug →</p>
            </div>
            <ChevronRight size={16} color="#7CE03A" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Log Sheet ────────────────────────────────────────────────────────────────

function LogSheet({
  s, setS, go, showToast,
}: {
  s: AppState;
  setS: React.Dispatch<React.SetStateAction<AppState>>;
  go: (sc: Screen) => void;
  showToast: (m: string) => void;
}) {
  const myDevices = s.devices.filter((d) => d.ownerId === "sara" || d.ownerId === "shared");

  const getHours = (devId: string) => s.logDraft[devId] ?? 0;
  const setHours = (devId: string, val: number) =>
    setS((p) => ({ ...p, logDraft: { ...p.logDraft, [devId]: Math.max(0, Math.min(24, val)) } }));

  const totalKwh = myDevices.reduce((sum, d) => {
    const h = getHours(d.id);
    return sum + (d.wattsTypical * h) / 1000;
  }, 0);
  const totalCost = totalKwh * s.tariff;

  const save = () => {
    const today = new Date().toISOString().split("T")[0];
    const newLogs: DailyLog[] = myDevices
      .filter((d) => getHours(d.id) > 0)
      .map((d) => ({
        date: today,
        deviceId: d.id,
        hoursUsed: getHours(d.id),
        attributedTo: d.ownerId === "shared" ? ["sara", "jonas", "alex"] : ["sara"],
      }));
    setS((p) => ({
      ...p,
      logs: [...p.logs, ...newLogs],
      logDraft: {},
      streak: p.streak + 1,
    }));
    showToast("Logged ✓ Dashboard updated");
    go("home");
  };

  return (
    <div className="h-full flex flex-col" style={{ background: "#0A0E0A" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b flex-shrink-0" style={{ borderColor: "#2A352A" }}>
        <button onClick={() => go("home")}>
          <X size={20} color="#9FB09F" />
        </button>
        <h3 style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, color: "#EEF3EE" }}>Log usage</h3>
        <div className="flex items-center gap-1 text-sm font-bold" style={{ color: "#FF9B54", fontFamily: "Manrope, sans-serif" }}>
          🔥 {s.streak}d
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        <p className="text-xs" style={{ color: "#6B7A6B" }}>
          How long did you use each device today?
        </p>

        {myDevices.map((dev) => {
          const h = getHours(dev.id);
          const kwh = (dev.wattsTypical * h) / 1000;
          const cost = kwh * s.tariff;
          return (
            <div
              key={dev.id}
              className="flex flex-col gap-2 px-4 py-3 rounded-2xl border"
              style={{ background: "#161D16", borderColor: "#2A352A" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#1C241C" }}>
                  <DeviceIcon name={dev.iconName} size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: "#EEF3EE", fontFamily: "Manrope, sans-serif" }}>{dev.name}</p>
                  {dev.ownerId === "shared" && (
                    <p className="text-xs" style={{ color: "#6B7A6B" }}>shared · split equally</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold" style={{ color: "#7CE03A", fontFamily: "Manrope, sans-serif" }}>{fmt(cost)}</p>
                  <p className="text-xs" style={{ color: "#6B7A6B" }}>{fmtKwh(kwh)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-1">
                <button
                  className="w-8 h-8 rounded-xl flex items-center justify-center border"
                  style={{ borderColor: "#2A352A" }}
                  onClick={() => setHours(dev.id, h - 0.5)}
                >
                  <Minus size={14} color="#9FB09F" />
                </button>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#2A352A" }}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${(h / 12) * 100}%`, background: "#7CE03A" }}
                  />
                </div>
                <span className="text-sm font-bold w-10 text-center" style={{ color: "#EEF3EE", fontFamily: "Manrope, sans-serif" }}>
                  {h}h
                </span>
                <button
                  className="w-8 h-8 rounded-xl flex items-center justify-center border"
                  style={{ borderColor: "#2A352A" }}
                  onClick={() => setHours(dev.id, h + 0.5)}
                >
                  <Plus size={14} color="#9FB09F" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Daily total */}
        <div
          className="flex items-center justify-between px-4 py-3 rounded-2xl"
          style={{ background: "#1C241C", border: "1px solid #2A352A" }}
        >
          <span className="text-sm" style={{ color: "#9FB09F" }}>Today's total</span>
          <div className="text-right">
            <span className="font-bold" style={{ fontFamily: "Manrope, sans-serif", color: "#EEF3EE" }}>{fmt(totalCost)}</span>
            <span className="text-xs ml-2" style={{ color: "#6B7A6B" }}>{fmtKwh(totalKwh)}</span>
          </div>
        </div>

        <div
          className="flex items-center gap-2 px-4 py-3 rounded-2xl"
          style={{ background: "#FF9B5411", border: "1px solid #FF9B5433" }}
        >
          <span className="text-lg">🔥</span>
          <div>
            <p className="text-sm font-bold" style={{ color: "#FF9B54", fontFamily: "Manrope, sans-serif" }}>
              {s.streak}-day logging streak!
            </p>
            <p className="text-xs" style={{ color: "#9FB09F" }}>Keep it going — or upgrade to auto-tracking</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-t flex-shrink-0" style={{ borderColor: "#2A352A" }}>
        <Btn onClick={save}>Save & Update Dashboard</Btn>
      </div>
    </div>
  );
}

// ─── Device Detail ────────────────────────────────────────────────────────────

function DeviceDetail({ s, go, costs, kwhMap }: { s: AppState; go: (sc: Screen) => void; costs: Record<string, number>; kwhMap: Record<string, number> }) {
  const dev = s.devices.find((d) => d.id === s.selectedDeviceId) || s.devices[0];
  const devLogs = s.logs.filter((l) => l.deviceId === dev.id);

  const kwh = devLogs.reduce((sum, l) => sum + (dev.wattsTypical * l.hoursUsed) / 1000, 0);
  const cost = kwh * s.tariff;
  const co2 = kwh * 0.4;

  // Last 7 days chart
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const dayLogs = devLogs.filter((l) => l.date === dateStr);
    const dayKwh = dayLogs.reduce((sum, l) => sum + (dev.wattsTypical * l.hoursUsed) / 1000, 0);
    return {
      day: d.toLocaleDateString("default", { weekday: "short" }),
      kwh: parseFloat(dayKwh.toFixed(2)),
    };
  });

  const owner = s.flatmates.find((f) => f.id === dev.ownerId);

  return (
    <div className="h-full flex flex-col overflow-y-auto" style={{ background: "#0A0E0A" }}>
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 flex-shrink-0">
        <button onClick={() => go("home")}>
          <ChevronLeft size={22} color="#9FB09F" />
        </button>
        <h3 style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, color: "#EEF3EE" }}>{dev.name}</h3>
      </div>

      <div className="px-5 flex flex-col gap-4 pb-6">
        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Cost", value: fmt(cost), color: "#7CE03A" },
            { label: "Energy", value: fmtKwh(kwh), color: "#54B4FF" },
            { label: "CO₂", value: `${co2.toFixed(1)}kg`, color: "#FF9B54" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1 p-3 rounded-2xl border"
              style={{ background: "#161D16", borderColor: "#2A352A" }}
            >
              <span className="text-xl font-bold" style={{ fontFamily: "Manrope, sans-serif", color: stat.color }}>
                {stat.value}
              </span>
              <span className="text-xs" style={{ color: "#6B7A6B" }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* 7-day chart */}
        <div className="rounded-3xl p-4 border" style={{ background: "#161D16", borderColor: "#2A352A" }}>
          <p className="text-xs font-bold mb-3" style={{ color: "#9FB09F", letterSpacing: "0.08em", fontFamily: "Manrope, sans-serif" }}>
            LAST 7 DAYS (kWh)
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData} barSize={24}>
              <XAxis dataKey="day" tick={{ fill: "#6B7A6B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Bar dataKey="kwh" radius={[6, 6, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i === 6 ? "#7CE03A" : "#2A352A"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Attribution */}
        <div className="rounded-3xl p-4 border" style={{ background: "#161D16", borderColor: "#2A352A" }}>
          <p className="text-xs font-bold mb-3" style={{ color: "#9FB09F", letterSpacing: "0.08em", fontFamily: "Manrope, sans-serif" }}>
            ATTRIBUTED TO
          </p>
          {dev.ownerId === "shared" ? (
            <div className="flex items-center gap-2">
              {s.flatmates.map((fm) => (
                <div key={fm.id} className="flex items-center gap-1.5">
                  <Avatar name={fm.name} color={fm.color} size={24} />
                  <span className="text-xs" style={{ color: "#9FB09F" }}>{fm.name}</span>
                </div>
              ))}
              <span className="text-xs ml-1" style={{ color: "#6B7A6B" }}>(shared equally)</span>
            </div>
          ) : owner ? (
            <div className="flex items-center gap-2">
              <Avatar name={owner.name} color={owner.color} size={28} />
              <span style={{ color: "#EEF3EE", fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>{owner.name}</span>
              <span className="text-xs ml-1" style={{ color: "#6B7A6B" }}>· private device</span>
            </div>
          ) : null}
        </div>

        {/* CO2 equivalence */}
        <div className="rounded-3xl p-4 border" style={{ background: "#1C241C", borderColor: "#2A352A" }}>
          <p className="text-sm" style={{ color: "#9FB09F" }}>
            {co2.toFixed(1)} kg CO₂ this month ={" "}
            <span style={{ color: "#7CE03A", fontFamily: "Manrope, sans-serif", fontWeight: 700 }}>
              {(co2 / 22).toFixed(1)} trees'
            </span>{" "}
            annual absorption
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Marketplace ──────────────────────────────────────────────────────────────

const PLUGS = [
  { id: "p1", name: "TP-Link Tapo P110", price: 17.99, rating: 4.7, reviews: 2840, desc: "Energy monitoring, voice control, easy setup." },
  { id: "p2", name: "NOUS A1T", price: 14.99, rating: 4.5, reviews: 1120, desc: "Open-source Tasmota, local control, no cloud." },
  { id: "p3", name: "Shelly Plug S", price: 24.90, rating: 4.8, reviews: 3450, desc: "WiFi + Bluetooth, precise energy monitoring." },
];

function MarketplaceScreen({ go, showToast }: { go: (s: Screen) => void; showToast: (m: string) => void }) {
  return (
    <div className="h-full flex flex-col overflow-y-auto" style={{ background: "#0A0E0A" }}>
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 flex-shrink-0">
        <button onClick={() => go("home")}>
          <ChevronLeft size={22} color="#9FB09F" />
        </button>
        <div>
          <h3 style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, color: "#EEF3EE" }}>Smart plugs</h3>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={10} color="#7CE03A" />
            <span className="text-xs" style={{ color: "#7CE03A" }}>Available in Augsburg</span>
          </div>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-4 pb-6">
        {/* Banner */}
        <div className="rounded-3xl p-4 border" style={{ background: "#1C241C", borderColor: "#7CE03A33" }}>
          <p className="text-sm font-bold" style={{ fontFamily: "Manrope, sans-serif", color: "#EEF3EE" }}>
            Why upgrade to Tier 2?
          </p>
          <p className="text-xs mt-1" style={{ color: "#9FB09F" }}>
            No more daily logging. A smart plug automatically measures exact kWh per device and syncs with WGenie.
            €4.99/person/month after setup.
          </p>
        </div>

        {/* Plug cards */}
        {PLUGS.map((plug) => (
          <div
            key={plug.id}
            className="rounded-3xl p-4 border"
            style={{ background: "#161D16", borderColor: "#2A352A" }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#2A352A" }}>
                <Plug size={22} color="#7CE03A" />
              </div>
              <span className="text-xl font-bold" style={{ fontFamily: "Manrope, sans-serif", color: "#7CE03A" }}>
                €{plug.price}
              </span>
            </div>
            <h4 className="font-bold mb-1" style={{ fontFamily: "Manrope, sans-serif", color: "#EEF3EE" }}>
              {plug.name}
            </h4>
            <p className="text-sm mb-1" style={{ color: "#9FB09F" }}>{plug.desc}</p>
            <div className="flex items-center gap-1 mb-3">
              <Star size={12} color="#7CE03A" fill="#7CE03A" />
              <span className="text-xs font-bold" style={{ color: "#7CE03A", fontFamily: "Manrope, sans-serif" }}>{plug.rating}</span>
              <span className="text-xs" style={{ color: "#6B7A6B" }}>({plug.reviews.toLocaleString()} reviews)</span>
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1"
                style={{ background: "#7CE03A", color: "#0A0E0A", fontFamily: "Manrope, sans-serif" }}
                onClick={() => showToast("Opening Amazon... (mock)")}
              >
                <ShoppingBag size={14} /> Buy
              </button>
              <button
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border"
                style={{ borderColor: "#2A352A", color: "#9FB09F" }}
                onClick={() => go("pairing")}
              >
                I have one
              </button>
            </div>
          </div>
        ))}

        <p className="text-xs text-center" style={{ color: "#6B7A6B" }}>
          WGenie may earn an affiliate commission on purchases. Prices vary by retailer.
        </p>

        <button
          className="w-full py-3 rounded-2xl border font-bold text-sm"
          style={{ borderColor: "#2A352A", color: "#9FB09F", fontFamily: "Manrope, sans-serif" }}
          onClick={() => go("pairing")}
        >
          Connect a plug I already own →
        </button>
      </div>
    </div>
  );
}

// ─── Pairing ──────────────────────────────────────────────────────────────────

function PairingScreen({
  s, setS, go, showToast,
}: {
  s: AppState;
  setS: React.Dispatch<React.SetStateAction<AppState>>;
  go: (sc: Screen) => void;
  showToast: (m: string) => void;
}) {
  const [code, setCode] = useState("WGPAIR-8F2X");
  const [stage, setStage] = useState<"enter" | "pairing" | "subscription" | "success">("enter");
  const [selectedDevice, setSelectedDevice] = useState("d-laptop");

  const startPairing = () => {
    setStage("pairing");
    setTimeout(() => setStage("subscription"), 1800);
  };

  const confirmSubscription = () => {
    setStage("success");
    setTimeout(() => {
      setS((p) => ({ ...p, tier: 2 }));
      showToast("🎉 Auto-tracking activated!");
      go("home");
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col" style={{ background: "#0A0E0A" }}>
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 flex-shrink-0">
        <button onClick={() => go("marketplace")}>
          <ChevronLeft size={22} color="#9FB09F" />
        </button>
        <h3 style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, color: "#EEF3EE" }}>Connect plug</h3>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
        {stage === "enter" && (
          <>
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: "#1C241C", border: "1px solid #2A352A" }}>
              <Plug size={36} color="#7CE03A" />
            </div>
            <div className="text-center">
              <h2 style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, color: "#EEF3EE", fontSize: 24 }}>Pair your plug</h2>
              <p className="text-sm mt-2" style={{ color: "#9FB09F" }}>Enter the code from the plug's label or the manufacturer app.</p>
            </div>
            <input
              className="w-full px-4 py-3 rounded-2xl text-center text-lg font-bold border outline-none"
              style={{ background: "#1C241C", borderColor: "#7CE03A", color: "#7CE03A", fontFamily: "Manrope, sans-serif", letterSpacing: "0.1em" }}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />

            <div className="w-full">
              <p className="text-xs mb-2" style={{ color: "#9FB09F" }}>Assign to device:</p>
              <div className="flex flex-col gap-2">
                {s.devices.filter((d) => d.ownerId === "sara").map((dev) => (
                  <button
                    key={dev.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all"
                    style={{
                      background: selectedDevice === dev.id ? "#7CE03A22" : "#161D16",
                      borderColor: selectedDevice === dev.id ? "#7CE03A" : "#2A352A",
                    }}
                    onClick={() => setSelectedDevice(dev.id)}
                  >
                    <DeviceIcon name={dev.iconName} size={16} />
                    <span className="text-sm" style={{ color: "#EEF3EE", fontFamily: "Manrope, sans-serif" }}>{dev.name}</span>
                    {selectedDevice === dev.id && <Check size={14} color="#7CE03A" className="ml-auto" />}
                  </button>
                ))}
              </div>
            </div>

            <Btn onClick={startPairing}>Connect plug</Btn>
          </>
        )}

        {stage === "pairing" && (
          <>
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center animate-pulse" style={{ background: "#7CE03A22", border: "1px solid #7CE03A" }}>
              <Wifi size={36} color="#7CE03A" />
            </div>
            <div className="text-center">
              <h2 style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, color: "#EEF3EE", fontSize: 22 }}>Connecting…</h2>
              <p className="text-sm mt-2" style={{ color: "#9FB09F" }}>Detecting your plug on the network</p>
            </div>
          </>
        )}

        {stage === "subscription" && (
          <div className="w-full flex flex-col gap-4">
            <div className="text-center">
              <div className="text-5xl mb-4">⚡</div>
              <h2 style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, color: "#EEF3EE", fontSize: 24 }}>Plug connected!</h2>
              <p className="text-sm mt-2" style={{ color: "#9FB09F" }}>Activate Tier 2 for automatic tracking</p>
            </div>
            <div className="p-4 rounded-3xl border" style={{ background: "#161D16", borderColor: "#2A352A" }}>
              <div className="flex items-center justify-between mb-3">
                <span style={{ color: "#EEF3EE", fontFamily: "Manrope, sans-serif", fontWeight: 700 }}>WGenie Tier 2</span>
                <span style={{ color: "#7CE03A", fontFamily: "Manrope, sans-serif", fontWeight: 800 }}>€4.99/mo</span>
              </div>
              {["Automatic kWh tracking", "Real-time dashboard", "No daily logging", "Cancel anytime"].map((f) => (
                <div key={f} className="flex items-center gap-2 py-1">
                  <Check size={14} color="#7CE03A" />
                  <span className="text-sm" style={{ color: "#9FB09F" }}>{f}</span>
                </div>
              ))}
              <p className="text-xs mt-3" style={{ color: "#6B7A6B" }}>
                Per person. Mock checkout — no real payment taken.
              </p>
            </div>
            <Btn onClick={confirmSubscription}>Activate — €4.99/month</Btn>
            <button className="text-sm text-center" style={{ color: "#6B7A6B" }} onClick={() => go("home")}>
              Maybe later
            </button>
          </div>
        )}

        {stage === "success" && (
          <>
            <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: "#7CE03A" }}>
              <Check size={44} color="#0A0E0A" strokeWidth={3} />
            </div>
            <div className="text-center">
              <h2 style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, color: "#EEF3EE", fontSize: 26 }}>You're on Tier 2!</h2>
              <p className="text-sm mt-2" style={{ color: "#9FB09F" }}>No more manual logging. Same app, automatic data.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Compete ──────────────────────────────────────────────────────────────────

function CompeteTab({ s, go, kwhMap }: { s: AppState; go: (sc: Screen) => void; kwhMap: Record<string, number> }) {
  const ranked = [...s.flatmates]
    .map((fm) => ({ ...fm, kwh: kwhMap[fm.id] || 0 }))
    .sort((a, b) => a.kwh - b.kwh);

  const medals = ["🥇", "🥈", "🥉"];
  const badges: Record<string, string> = { sara: "🏆 Energy Saint", jonas: "🔥 Heatwave", alex: "🎮 Night Owl" };

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#0A0E0A" }}>
      <div className="px-5 pt-4 pb-2">
        <h2 style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, color: "#EEF3EE", fontSize: 26 }}>Compete</h2>
        <p className="text-sm" style={{ color: "#9FB09F" }}>Lowest kWh wins. Loser buys the Feierabend drink 🍻</p>
      </div>

      <div className="px-5 mt-4 flex flex-col gap-3 pb-6">
        {/* Leaderboard */}
        {ranked.map((fm, i) => (
          <div
            key={fm.id}
            className="flex items-center gap-4 px-4 py-4 rounded-3xl border transition-all"
            style={{
              background: fm.isCurrentUser ? "#7CE03A18" : "#161D16",
              borderColor: fm.isCurrentUser ? "#7CE03A44" : "#2A352A",
            }}
          >
            <span className="text-2xl">{medals[i]}</span>
            <Avatar name={fm.name} color={fm.color} size={36} />
            <div className="flex-1">
              <p className="font-bold" style={{ fontFamily: "Manrope, sans-serif", color: "#EEF3EE" }}>
                {fm.name}{fm.isCurrentUser && " (you)"}
              </p>
              <p className="text-xs" style={{ color: "#9FB09F" }}>{badges[fm.id]}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg" style={{ fontFamily: "Manrope, sans-serif", color: i === 0 ? "#7CE03A" : "#EEF3EE" }}>
                {fm.kwh.toFixed(0)}
              </p>
              <p className="text-xs" style={{ color: "#6B7A6B" }}>kWh</p>
            </div>
          </div>
        ))}

        {/* Streak section */}
        <div className="rounded-3xl p-4 border mt-2" style={{ background: "#161D16", borderColor: "#2A352A" }}>
          <p className="text-xs font-bold mb-3" style={{ color: "#9FB09F", letterSpacing: "0.08em", fontFamily: "Manrope, sans-serif" }}>LOGGING STREAKS</p>
          {s.flatmates.map((fm) => {
            const streak = fm.isCurrentUser ? s.streak : Math.floor(Math.random() * 8) + 1;
            return (
              <div key={fm.id} className="flex items-center gap-3 py-1.5">
                <Avatar name={fm.name} color={fm.color} size={24} />
                <span className="text-sm flex-1" style={{ color: "#EEF3EE" }}>{fm.name}</span>
                <span className="text-sm font-bold" style={{ fontFamily: "Manrope, sans-serif", color: "#FF9B54" }}>
                  🔥 {streak}d
                </span>
              </div>
            );
          })}
        </div>

        <div
          className="p-3 rounded-2xl text-center"
          style={{ background: "#1C241C", border: "1px solid #2A352A" }}
        >
          <p className="text-xs" style={{ color: "#6B7A6B" }}>
            Resets on the 1st of each month. Results are final!
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Impact ───────────────────────────────────────────────────────────────────

function ImpactTab({ s, go, kwhMap }: { s: AppState; go: (sc: Screen) => void; kwhMap: Record<string, number> }) {
  const totalKwh = Object.values(kwhMap).reduce((a, b) => a + b, 0);
  const co2Total = totalKwh * 0.4;
  const treesEquiv = co2Total / 22;
  const [animTrees, setAnimTrees] = useState(0);

  useEffect(() => {
    let frame: number;
    let start: number | null = null;
    const duration = 1200;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setAnimTrees(Math.floor(progress * treesEquiv));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [treesEquiv]);

  const baselineKwh = totalKwh * 1.18;
  const savedKwh = baselineKwh - totalKwh;
  const savedEuros = savedKwh * s.tariff;
  const reductionPct = Math.round((savedKwh / baselineKwh) * 100);

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#0A0E0A" }}>
      <div className="px-5 pt-4 pb-2">
        <h2 style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, color: "#EEF3EE", fontSize: 26 }}>Impact</h2>
        <p className="text-sm" style={{ color: "#9FB09F" }}>Your flat's green footprint this month</p>
      </div>

      <div className="px-5 mt-4 flex flex-col gap-4 pb-6">
        {/* Trees hero */}
        <div
          className="rounded-3xl p-6 border text-center"
          style={{ background: "#161D16", borderColor: "#2A352A" }}
        >
          <div className="flex justify-center gap-1 mb-3 flex-wrap">
            {Array.from({ length: Math.min(Math.ceil(treesEquiv), 12) }).map((_, i) => (
              <span key={i} className="text-3xl transition-all" style={{ opacity: i < animTrees ? 1 : 0.15 }}>🌳</span>
            ))}
          </div>
          <p className="text-4xl font-bold" style={{ fontFamily: "Manrope, sans-serif", color: "#7CE03A" }}>
            {treesEquiv.toFixed(1)} trees
          </p>
          <p className="text-sm mt-1" style={{ color: "#9FB09F" }}>
            equivalent annual CO₂ absorption
          </p>
          <p className="text-xs mt-2" style={{ color: "#6B7A6B" }}>
            Based on {co2Total.toFixed(0)} kg CO₂ from {totalKwh.toFixed(0)} kWh
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl p-4 border flex flex-col gap-1" style={{ background: "#161D16", borderColor: "#2A352A" }}>
            <span className="text-2xl font-bold" style={{ fontFamily: "Manrope, sans-serif", color: "#7CE03A" }}>{fmt(savedEuros)}</span>
            <span className="text-xs" style={{ color: "#9FB09F" }}>saved vs. equal split</span>
          </div>
          <div className="rounded-3xl p-4 border flex flex-col gap-1" style={{ background: "#161D16", borderColor: "#2A352A" }}>
            <span className="text-2xl font-bold" style={{ fontFamily: "Manrope, sans-serif", color: "#54B4FF" }}>{reductionPct}%</span>
            <span className="text-xs" style={{ color: "#9FB09F" }}>below national avg.</span>
          </div>
        </div>

        {/* Per-person breakdown */}
        <div className="rounded-3xl p-4 border" style={{ background: "#161D16", borderColor: "#2A352A" }}>
          <p className="text-xs font-bold mb-3" style={{ color: "#9FB09F", letterSpacing: "0.08em", fontFamily: "Manrope, sans-serif" }}>
            CO₂ PER FLATMATE
          </p>
          {s.flatmates.map((fm) => {
            const co2 = (kwhMap[fm.id] || 0) * 0.4;
            return (
              <div key={fm.id} className="flex items-center gap-3 py-1.5">
                <Avatar name={fm.name} color={fm.color} size={24} />
                <span className="text-sm flex-1" style={{ color: "#EEF3EE" }}>{fm.name}</span>
                <span className="text-sm font-bold" style={{ fontFamily: "Manrope, sans-serif", color: fm.color }}>
                  {co2.toFixed(0)} kg CO₂
                </span>
              </div>
            );
          })}
        </div>

        <div className="p-4 rounded-2xl" style={{ background: "#1C241C", border: "1px solid #7CE03A22" }}>
          <p className="text-sm" style={{ color: "#9FB09F" }}>
            <span style={{ color: "#7CE03A", fontWeight: 700 }}>Tip:</span> Running the washing machine at 30°C instead of 60°C can save up to 40% energy per cycle.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────

function ProfileTab({
  s, setS, go, reset,
}: {
  s: AppState;
  setS: React.Dispatch<React.SetStateAction<AppState>>;
  go: (sc: Screen) => void;
  reset: () => void;
}) {
  const sara = s.flatmates.find((f) => f.isCurrentUser)!;
  const [editingTariff, setEditingTariff] = useState(false);
  const [tariffInput, setTariffInput] = useState(s.tariff.toString());

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#0A0E0A" }}>
      <div className="px-5 pt-4 pb-2">
        <h2 style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, color: "#EEF3EE", fontSize: 26 }}>Profile</h2>
      </div>

      <div className="px-5 flex flex-col gap-4 pb-6">
        {/* User card */}
        <div className="rounded-3xl p-5 border flex items-center gap-4" style={{ background: "#161D16", borderColor: "#2A352A" }}>
          <Avatar name={sara.name} color={sara.color} size={52} />
          <div className="flex-1">
            <p className="text-xl font-bold" style={{ fontFamily: "Manrope, sans-serif", color: "#EEF3EE" }}>{sara.name}</p>
            <p className="text-sm" style={{ color: "#9FB09F" }}>{s.flatName}</p>
          </div>
          <div
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={{
              background: s.tier === 2 ? "#7CE03A" : "#1C241C",
              color: s.tier === 2 ? "#0A0E0A" : "#7CE03A",
              border: "1px solid #2A352A",
              fontFamily: "Manrope, sans-serif",
            }}
          >
            {s.tier === 2 ? "Tier 2" : "Tier 1 · Free"}
          </div>
        </div>

        {/* Tariff editor */}
        <div className="rounded-3xl p-4 border" style={{ background: "#161D16", borderColor: "#2A352A" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold" style={{ fontFamily: "Manrope, sans-serif", color: "#EEF3EE" }}>Electricity tariff</p>
            <button onClick={() => setEditingTariff((v) => !v)}>
              <Edit2 size={16} color="#7CE03A" />
            </button>
          </div>
          {editingTariff ? (
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 rounded-xl border outline-none text-lg font-bold"
                style={{ background: "#1C241C", borderColor: "#7CE03A", color: "#7CE03A", fontFamily: "Manrope, sans-serif" }}
                value={tariffInput}
                onChange={(e) => setTariffInput(e.target.value)}
                type="number"
                step="0.01"
              />
              <button
                className="px-4 py-2 rounded-xl font-bold"
                style={{ background: "#7CE03A", color: "#0A0E0A", fontFamily: "Manrope, sans-serif" }}
                onClick={() => {
                  const val = parseFloat(tariffInput) || 0.4;
                  setS((p) => ({ ...p, tariff: val }));
                  setEditingTariff(false);
                }}
              >
                Save
              </button>
            </div>
          ) : (
            <p className="text-2xl font-bold" style={{ fontFamily: "Manrope, sans-serif", color: "#7CE03A" }}>
              €{s.tariff.toFixed(2)} / kWh
            </p>
          )}
        </div>

        {/* Flatmates */}
        <div className="rounded-3xl p-4 border" style={{ background: "#161D16", borderColor: "#2A352A" }}>
          <p className="font-bold mb-3" style={{ fontFamily: "Manrope, sans-serif", color: "#EEF3EE" }}>Flatmates</p>
          {s.flatmates.map((fm) => (
            <div key={fm.id} className="flex items-center gap-3 py-2">
              <Avatar name={fm.name} color={fm.color} size={32} />
              <span className="flex-1 text-sm" style={{ color: "#EEF3EE" }}>{fm.name}{fm.isCurrentUser && " (you)"}</span>
              <span className="text-xs" style={{ color: "#6B7A6B" }}>
                {fm.isCurrentUser ? "🏆 Energy Saint" : fm.id === "jonas" ? "🔥 Heatwave" : "🎮 Night Owl"}
              </span>
            </div>
          ))}
        </div>

        {/* Tier toggle for demo */}
        <div className="rounded-3xl p-4 border" style={{ background: "#1C241C", borderColor: "#2A352A" }}>
          <p className="text-xs font-bold mb-3" style={{ color: "#6B7A6B", letterSpacing: "0.08em", fontFamily: "Manrope, sans-serif" }}>
            DEMO OPTIONS
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "#9FB09F" }}>Tier 2 (smart plug)</span>
            <button
              className="w-12 h-6 rounded-full transition-all relative"
              style={{ background: s.tier === 2 ? "#7CE03A" : "#2A352A" }}
              onClick={() => setS((p) => ({ ...p, tier: p.tier === 1 ? 2 : 1 }))}
            >
              <div
                className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                style={{ background: "#EEF3EE", left: s.tier === 2 ? "calc(100% - 22px)" : 2 }}
              />
            </button>
          </div>
        </div>

        {/* Reset */}
        <button
          className="w-full py-3.5 rounded-2xl border font-bold flex items-center justify-center gap-2 transition-all"
          style={{ borderColor: "#FF9B5444", color: "#FF9B54", fontFamily: "Manrope, sans-serif" }}
          onClick={reset}
        >
          <RotateCcw size={16} />
          Reset demo
        </button>
      </div>
    </div>
  );
}

// ─── Shared button components ─────────────────────────────────────────────────

function Btn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95"
      style={{
        background: "#7CE03A",
        color: "#0A0E0A",
        fontFamily: "Manrope, sans-serif",
        fontWeight: 800,
        fontSize: 16,
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function BtnSecondary({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95"
      style={{
        background: "transparent",
        color: "#EEF3EE",
        fontFamily: "Manrope, sans-serif",
        fontWeight: 700,
        fontSize: 16,
        border: "1px solid #2A352A",
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
