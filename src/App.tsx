"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  LogOut,
  Download,
  Plus,
  Trash2,
  Camera,
  AlertTriangle,
  Menu,
  X,
  Check,
  Phone,
  FileSpreadsheet,
  Search,
  Upload,
  UserPlus,
} from "lucide-react";
// const paletteImg = "/imports/WhatsApp_Image_2026-07-03_at_02.04.28.jpeg";
// const dressImg = "/imports/WhatsApp_Image_2026-07-03_at_01.49.37.jpeg";
// const charl23 = "/imports/charl--23.jpg";
// const charl231 = "/imports/charl--23-1.jpg";
const landingHero = "https://d3inrmu4gz56hz.cloudfront.net/051A4378-2-1.avif";
const inviteHero = landingHero;
const charl051 = "https://d3inrmu4gz56hz.cloudfront.net/051A4485.avif";
const g4233 = "https://d3inrmu4gz56hz.cloudfront.net/051A4233.avif";
const g4250 = "https://d3inrmu4gz56hz.cloudfront.net/051A4250.avif";
const g4300 = "https://d3inrmu4gz56hz.cloudfront.net/051A4300.avif";
const g4355 = "https://d3inrmu4gz56hz.cloudfront.net/051A4355.avif";
const g4708 = "https://d3inrmu4gz56hz.cloudfront.net/051A4708-2.avif";
const g4568 = "https://d3inrmu4gz56hz.cloudfront.net/051A4568.avif";
const g4378 = "https://d3inrmu4gz56hz.cloudfront.net/051A4378-2.avif";
const g5209 = "https://d3inrmu4gz56hz.cloudfront.net/051A5209.avif";
const g5078 = "https://d3inrmu4gz56hz.cloudfront.net/051A5078.avif";
const g5037 = "https://d3inrmu4gz56hz.cloudfront.net/051A4355.jpg - Copy.avif";
// const chelaVideo = "/imports/CHELA_50MB.mp4";
// const chalVideo = "/imports/Charlene3.mp4";
const chalVideo =
  "https://d3hdvkdux4mpo1.cloudfront.net/C.R%20WebsiteReduced.mp4";

// ─── Guest Data ────────────────────────────────────────────────────────────────

interface GuestRecord {
  name: string;
  title?: string;
  relation: string;
  table: string;
  pin?: string;
}
interface StoredGuest extends GuestRecord {
  pin: string;
  revoked: boolean;
}
interface RSVPRecord {
  id: string;
  guestId?: string;
  pin: string;
  name: string;
  attending: "yes" | "no" | "pending";
  guestName: string;
  dietary: string;
  message: string;
  timestamp: string;
  status?: string;
  cardSent?: boolean;
  cardSentAt?: string | null;
  sentBy?: string | null;
  cluster?: string;
  phone?: string;
}

// Composite key used for revoke: "pin::name"
const guestKey = (pin: string, name: string) => `${pin}::${name}`;

const getGuestDisplayName = (g: any) => {
  const baseName = g.name || g.fullName || "";
  const titleStr = g.title || (g.titleRecord ? g.titleRecord.name : "");

  if (baseName) {
    return titleStr &&
      !baseName.toLowerCase().startsWith(titleStr.toLowerCase())
      ? `${titleStr} ${baseName}`
      : baseName;
  }

  if (titleStr) {
    return titleStr.trim();
  }

  return g.code || g.pin || "";
};

const MAX_ATTEMPTS = 3;
type Screen = "pin" | "select" | "invitation" | "rsvp" | "confirmed" | "admin";

// ─── Session persistence helpers ───────────────────────────────────────────────
const SESSION_KEY = "koito_guest_session";
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

interface PersistedSession {
  screen: Screen;
  guest: GuestRecord | null;
  pin: string;
  pendingGuests: StoredGuest[];
  adminPermissions?: string[];
  lastActivity: number;
}

function saveSession(data: PersistedSession) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {}
}

function loadSession(): PersistedSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data: PersistedSession = JSON.parse(raw);
    // Invalidate if inactive for more than 5 minutes
    if (Date.now() - data.lastActivity > INACTIVITY_TIMEOUT_MS) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}

// ─── SVG Design Elements ───────────────────────────────────────────────────────

function DiamondOrnament({
  size = 10,
  color = "#C9A84C",
  opacity = 1,
}: {
  size?: number;
  color?: string;
  opacity?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      fill="none"
      style={{ opacity }}
    >
      <path d="M5 0.5 L9.5 5 L5 9.5 L0.5 5 Z" fill={color} />
    </svg>
  );
}

function OrnamentalRule({
  className = "",
  wide = false,
}: {
  className?: string;
  wide?: boolean;
}) {
  const w = wide ? 320 : 220;
  return (
    <svg
      viewBox={`0 0 ${w} 16`}
      className={className}
      style={{ width: wide ? 280 : 200, height: 14 }}
      fill="none"
    >
      <line
        x1="0"
        y1="8"
        x2={w / 2 - 18}
        y2="8"
        stroke="#C9A84C"
        strokeWidth="0.7"
        strokeOpacity="0.55"
      />
      <path
        d={`M${w / 2 - 10} 8 L${w / 2 - 5} 3 L${w / 2} 8 L${w / 2 - 5} 13 Z`}
        fill="#C9A84C"
        fillOpacity="0.5"
      />
      <circle cx={w / 2} cy="8" r="3.5" fill="#C9A84C" fillOpacity="0.85" />
      <path
        d={`M${w / 2 + 10} 8 L${w / 2 + 5} 3 L${w / 2} 8 L${w / 2 + 5} 13 Z`}
        fill="#C9A84C"
        fillOpacity="0.5"
      />
      <line
        x1={w / 2 + 18}
        y1="8"
        x2={w}
        y2="8"
        stroke="#C9A84C"
        strokeWidth="0.7"
        strokeOpacity="0.55"
      />
    </svg>
  );
}

function CornerOrnament({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
    >
      <path
        d="M4 4 L4 22"
        stroke="#C9A84C"
        strokeWidth="0.8"
        strokeOpacity="0.6"
      />
      <path
        d="M4 4 L22 4"
        stroke="#C9A84C"
        strokeWidth="0.8"
        strokeOpacity="0.6"
      />
      <path
        d="M4 4 L18 18"
        stroke="#C9A84C"
        strokeWidth="0.5"
        strokeOpacity="0.3"
      />
      <circle cx="4" cy="4" r="2.5" fill="#C9A84C" fillOpacity="0.7" />
      <circle cx="4" cy="14" r="1" fill="#C9A84C" fillOpacity="0.4" />
      <circle cx="14" cy="4" r="1" fill="#C9A84C" fillOpacity="0.4" />
    </svg>
  );
}

function WaxSeal({
  cracking,
  onAnimationComplete,
}: {
  cracking: boolean;
  onAnimationComplete?: () => void;
}) {
  return (
    <motion.div
      animate={
        cracking
          ? {
              scale: [1, 1.08, 0.95, 1.1, 0],
              opacity: [1, 1, 1, 1, 0],
              rotate: [0, -4, 5, -8, 18],
            }
          : {}
      }
      transition={{ duration: 1.1, ease: "easeInOut" }}
      onAnimationComplete={cracking ? onAnimationComplete : undefined}
    >
      <svg width="152" height="152" viewBox="0 0 152 152" fill="none">
        <defs>
          <radialGradient id="sg" cx="38%" cy="32%">
            <stop offset="0%" stopColor="#2B5A3C" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0A1C10" stopOpacity="0.3" />
          </radialGradient>
        </defs>
        <circle cx="76" cy="76" r="74" fill="#1A3D28" />
        <circle cx="76" cy="76" r="74" fill="url(#sg)" />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a, i) => (
          <ellipse
            key={i}
            cx={76 + 67 * Math.cos((a * Math.PI) / 180)}
            cy={76 + 67 * Math.sin((a * Math.PI) / 180)}
            rx="5"
            ry="2.5"
            fill="#C9A84C"
            fillOpacity="0.55"
            transform={`rotate(${a},${76 + 67 * Math.cos((a * Math.PI) / 180)},${76 + 67 * Math.sin((a * Math.PI) / 180)})`}
          />
        ))}
        <circle
          cx="76"
          cy="76"
          r="60"
          fill="none"
          stroke="#C9A84C"
          strokeWidth="0.9"
          strokeOpacity="0.4"
          strokeDasharray="5 3.5"
        />
        <circle
          cx="76"
          cy="76"
          r="52"
          fill="none"
          stroke="#C9A84C"
          strokeWidth="0.4"
          strokeOpacity="0.25"
        />
        <text
          x="76"
          y="67"
          textAnchor="middle"
          fill="#C9A84C"
          fontSize="26"
          fontFamily="Playfair Display,serif"
          fontStyle="italic"
        >
          K
        </text>
        <text
          x="76"
          y="84"
          textAnchor="middle"
          fill="#C9A84C"
          fontSize="11"
          fontFamily="Playfair Display,serif"
          fontStyle="italic"
        >
          &amp;
        </text>
        <text
          x="76"
          y="100"
          textAnchor="middle"
          fill="#C9A84C"
          fontSize="22"
          fontFamily="Playfair Display,serif"
          fontStyle="italic"
        >
          C
        </text>
        <path id="tArc" d="M 18,76 A 58,58 0 0,1 134,76" fill="none" />
        <path id="bArc" d="M 18,76 A 58,58 0 0,0 134,76" fill="none" />
        <text
          fontSize="7.5"
          fill="#C9A84C"
          fillOpacity="0.75"
          letterSpacing="3"
          fontFamily="Lato,sans-serif"
        >
          <textPath href="#tArc" startOffset="50%" textAnchor="middle">
            KOITO • AK • CHAIK
          </textPath>
        </text>
        <text
          fontSize="7"
          fill="#C9A84C"
          fillOpacity="0.55"
          letterSpacing="2"
          fontFamily="Lato,sans-serif"
        >
          <textPath href="#bArc" startOffset="50%" textAnchor="middle">
            8TH AUGUST 2026
          </textPath>
        </text>
      </svg>
    </motion.div>
  );
}

// ─── PIN Gate ──────────────────────────────────────────────────────────────────

function PinGate({
  onSuccess,
}: {
  onSuccess: (
    pin: string,
    matches: StoredGuest[],
    isAdmin: boolean,
    permissions?: string[],
  ) => void;
}) {
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [attempts, setAttempts] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [cracking, setCracking] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleSubmit = async (pin: string) => {
    try {
      const res = await fetch(`/api/qr/verify?code=${encodeURIComponent(pin)}`);
      if (res.ok) {
        const dbGuest = await res.json();
        if (dbGuest && (dbGuest.name || dbGuest.code) && !dbGuest.error) {
          setCracking(true);
          return;
        }
      }
    } catch (e) {
      console.error("🔴 [DATABASE PIN ERROR] Error verifying PIN:", e);
    }

    const next = attempts + 1;
    setAttempts(next);
    shake(
      next >= MAX_ATTEMPTS
        ? "Access locked. Please contact the event team."
        : `Incorrect PIN — ${MAX_ATTEMPTS - next} attempt${MAX_ATTEMPTS - next !== 1 ? "s" : ""} remaining`,
    );
  };

  const shake = (msg: string) => {
    setShaking(true);
    setErrorMsg(msg);
    setTimeout(() => {
      setShaking(false);
      setDigits(["", "", "", ""]);
      refs[0].current?.focus();
    }, 650);
  };

  const handleChange = (i: number, val: string) => {
    // Accept any alphanumeric character, uppercased
    const cleaned = val
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "") // strip non-alphanumeric
      .slice(-1);
    const c = cleaned;
    const next = [...digits];
    next[i] = c;
    setDigits(next);
    if (c && i < 3) refs[i + 1].current?.focus();
    if (c && i === 3) {
      const pin = [...next.slice(0, 3), c].join("");
      if (pin.length === 4) setTimeout(() => handleSubmit(pin), 150);
    }
  };

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && digits[i] === "" && i > 0) {
      const next = [...digits];
      next[i - 1] = "";
      setDigits(next);
      refs[i - 1].current?.focus();
    }
  };

  const onSealDone = async () => {
    const pin = digits.join("");

    try {
      const res = await fetch(`/api/qr/verify?code=${encodeURIComponent(pin)}`);
      if (res.ok) {
        const dbGuest = await res.json();
        if (dbGuest && (dbGuest.name || dbGuest.code) && !dbGuest.error) {
          if (dbGuest.isAdmin || dbGuest.role?.toUpperCase() === "ADMIN") {
            setTimeout(
              () => onSuccess(pin, [], true, dbGuest.clusterPermissions || []),
              150,
            );
            return;
          }
          const mapped: StoredGuest = {
            pin: dbGuest.code || pin,
            name: dbGuest.name,
            title: dbGuest.title || undefined,
            relation: dbGuest.role || "Honored Guest",
            table:
              typeof dbGuest.table === "object"
                ? dbGuest.table?.name
                : dbGuest.table || "Reserved Table",
            revoked: dbGuest.status === "CANCELLED",
          };
          setTimeout(() => onSuccess(pin, [mapped], false), 150);
          return;
        }
      }
    } catch (e) {
      console.error("🔴 [DATABASE GUEST PROFILE ERROR]:", e);
    }
  };

  const locked = attempts >= MAX_ATTEMPTS;

  // No wax seal visible — auto-complete transition when cracking fires
  useEffect(() => {
    if (cracking) {
      const t = setTimeout(onSealDone, 900);
      return () => clearTimeout(t);
    }
  }, [cracking]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col">
      {/* ── Full-bleed hero photo ── */}
      <img
        src={landingHero}
        alt="Miss Charlene Chelagat Ruto at the gate"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          objectPosition: "center 18%",
          filter: "brightness(1.08) contrast(1.06) saturate(1.12)",
        }}
      />

      {/* ── Solid faded dark green overlay — uniform, all text readable ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "rgba(4,18,8,0.62)" }}
      />
      {/* Top gradient — deepens toward the header */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(2,12,5,0.72) 0%, rgba(2,12,5,0.30) 22%, transparent 45%)",
        }}
      />
      {/* Bottom gradient — deepens toward the PIN panel */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(2,12,5,0.88) 0%, rgba(2,12,5,0.50) 25%, transparent 50%)",
        }}
      />

      {/* ── Double gold border frame ── */}
      <div
        className="absolute inset-4 pointer-events-none border"
        style={{ borderColor: "rgba(201,168,76,0.22)" }}
      />
      <div
        className="absolute inset-[22px] pointer-events-none border"
        style={{ borderColor: "rgba(201,168,76,0.08)" }}
      />

      {/* ── Corner ornaments ── */}
      <div className="absolute top-5 left-5 opacity-80">
        <CornerOrnament />
      </div>
      <div className="absolute top-5 right-5 opacity-80">
        <CornerOrnament flip />
      </div>
      <div
        className="absolute bottom-5 left-5 opacity-80"
        style={{ transform: "scaleY(-1)" }}
      >
        <CornerOrnament />
      </div>
      <div
        className="absolute bottom-5 right-5 opacity-80"
        style={{ transform: "scale(-1,-1)" }}
      >
        <CornerOrnament flip />
      </div>

      {/* ══ TOP HEADER — compact, pressed to top so face is fully clear ══ */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center pt-8 px-10 pb-1"
      >
        <p
          onClick={() => setShowAdminPin(true)}
          role="button"
          className="text-[10px] tracking-[0.55em] uppercase mb-3 cursor-pointer select-none"
          style={{
            fontFamily: "Lato,sans-serif",
            color: "rgba(201,168,76,0.9)",
          }}
          title="Click for admin PIN (6 digits)"
        >
          A Private Invitation
        </p>
        <div className="flex items-center gap-3 w-full max-w-xs mb-3">
          <div
            className="flex-1 h-px"
            style={{ background: "rgba(201,168,76,0.40)" }}
          />
          <DiamondOrnament size={6} color="#C9A84C" opacity={0.75} />
          <div
            className="flex-1 h-px"
            style={{ background: "rgba(201,168,76,0.40)" }}
          />
        </div>
      </motion.div>

      {/* ── Spacer — Charlene's face breathes completely freely ── */}
      <div className="flex-1" />

      {/* ══ BOTTOM PANEL ══ */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center px-8 pb-14"
      >
        {/* Top divider of panel */}
        <div className="flex items-center gap-4 w-full max-w-sm mb-5">
          <div
            className="flex-1 h-px"
            style={{ background: "rgba(201,168,76,0.22)" }}
          />
          <DiamondOrnament size={9} color="#C9A84C" opacity={0.6} />
          <div
            className="flex-1 h-px"
            style={{ background: "rgba(201,168,76,0.22)" }}
          />
        </div>

        {/* Celebrating label */}
        <p
          className="text-xs tracking-[0.5em] uppercase mb-2"
          style={{
            fontFamily: "Lato,sans-serif",
            color: "rgba(201,168,76,0.9)",
          }}
        >
          Celebrating
        </p>

        {/* Name — large script */}
        <h1
          className="text-[3rem] md:text-5xl leading-none text-center mb-3"
          style={{
            fontFamily: "Great Vibes,cursive",
            color: "#FFFFFF",
            textShadow: "0 2px 32px rgba(0,0,0,0.7)",
          }}
        >
          Charlene Chelagat Ruto
        </h1>

        {/* Event pill */}
        {/* <div className="flex items-center gap-3 mb-1">
          <div
            className="h-px w-10"
            style={{ background: "rgba(201,168,76,0.55)" }}
          />
          <p
            className="text-xs tracking-[0.45em] uppercase"
            style={{
              fontFamily: "Lato,sans-serif",
              color: "rgba(201,168,76,1)",
            }}
          >
            Koito ak Chaik
          </p>
          <div
            className="h-px w-10"
            style={{ background: "rgba(201,168,76,0.55)" }}
          />
        </div> */}

        {/* ── PIN Entry ── */}
        <AnimatePresence>
          {!cracking && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-5 w-full max-w-xs"
            >
              <p
                className="text-xs tracking-[0.25em] uppercase text-center mt-5"
                style={{
                  fontFamily: "Lato,sans-serif",
                  color: "rgba(255,255,255,0.78)",
                  fontWeight: 300,
                }}
              >
                Enter Your Pin
              </p>

              {/* PIN boxes */}
              <motion.div
                animate={shaking ? { x: [-10, 10, -8, 8, -5, 5, 0] } : {}}
                transition={{ duration: 0.5 }}
                className="flex gap-3"
              >
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={refs[i]}
                    type="text"
                    inputMode="text"
                    pattern="[A-Z0-9]*"
                    maxLength={1}
                    autoCapitalize="characters"
                    autoCorrect="off"
                    autoComplete="off"
                    spellCheck={false}
                    value={d}
                    disabled={locked || cracking}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKey(i, e)}
                    onFocus={() => errorMsg && setErrorMsg("")}
                    className="text-center text-2xl focus:outline-none transition-all duration-300 disabled:opacity-40"
                    style={
                      {
                        fontFamily: "Playfair Display,serif",
                        caretColor: "#C9A84C",
                        color: "#FFFFFF",
                        WebkitTextSecurity: "disc",
                        background: "rgba(5,11,6,0.65)",
                        border: "1px solid rgba(201,168,76,0.35)",
                        width: "3.25rem",
                        height: "3.75rem",
                      } as React.CSSProperties
                    }
                    onFocusCapture={(e) => {
                      (e.target as HTMLInputElement).style.borderColor =
                        "rgba(201,168,76,0.85)";
                    }}
                    onBlur={(e) => {
                      (e.target as HTMLInputElement).style.borderColor =
                        "rgba(201,168,76,0.35)";
                    }}
                  />
                ))}
              </motion.div>

              <AnimatePresence>
                {errorMsg && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] text-center max-w-[220px] leading-5"
                    style={{
                      fontFamily: "Lato,sans-serif",
                      color: "rgba(220,80,80,0.85)",
                    }}
                  >
                    {errorMsg}
                  </motion.p>
                )}
              </AnimatePresence>
              {showAdminPin && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(0,0,0,0.55)]">
                  <div
                    className="p-6 rounded-3xl border border-[rgba(201,168,76,0.18)] shadow-[0_22px_60px_-20px_rgba(0,0,0,0.8)]"
                    style={{ background: "rgba(4,18,8,0.92)" }}
                  >
                    <AdminPinGate
                      onCancel={() => setShowAdminPin(false)}
                      onSuccess={(pin: string) => {
                        setShowAdminPin(false);
                        onSuccess(pin, [], true);
                      }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Footer rule ── */}
        <div className="flex items-center gap-4 w-full max-w-sm mt-9">
          <div
            className="flex-1 h-px"
            style={{ background: "rgba(201,168,76,0.14)" }}
          />
          <DiamondOrnament size={6} color="#C9A84C" opacity={0.4} />
          <div
            className="flex-1 h-px"
            style={{ background: "rgba(201,168,76,0.14)" }}
          />
        </div>
      </motion.div>
    </div>
  );
}

// ─── Guest Selector ────────────────────────────────────────────────────────────

function GuestSelector({
  guests,
  onSelect,
  onHelpRsvp,
  onBack,
}: {
  guests: StoredGuest[];
  onSelect: (g: StoredGuest) => void;
  onHelpRsvp: (g: StoredGuest) => void;
  onBack: () => void;
}) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col">
      {/* Matching background from PIN gate */}
      <img
        src={inviteHero}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: "center 30%" }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "rgba(6,14,8,0.62)" }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(6,14,8,0.97) 0%, rgba(6,14,8,0.5) 45%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(6,14,8,0.75) 0%, transparent 30%)",
        }}
      />

      {/* Border frame */}
      <div
        className="absolute inset-5 border pointer-events-none"
        style={{ borderColor: "rgba(201,168,76,0.22)" }}
      />
      <div
        className="absolute inset-7 border pointer-events-none"
        style={{ borderColor: "rgba(201,168,76,0.08)" }}
      />
      <div className="absolute top-6 left-6">
        <CornerOrnament />
      </div>
      <div className="absolute top-6 right-6">
        <CornerOrnament flip />
      </div>
      <div
        className="absolute bottom-6 left-6"
        style={{ transform: "scaleY(-1)" }}
      >
        <CornerOrnament />
      </div>
      <div
        className="absolute bottom-6 right-6"
        style={{ transform: "scale(-1,-1)" }}
      >
        <CornerOrnament flip />
      </div>

      {/* Top label */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center pt-12 pb-4 px-8"
      >
        <p
          className="text-[9px] tracking-[0.55em] uppercase mb-3"
          style={{
            fontFamily: "Lato,sans-serif",
            color: "rgba(201,168,76,0.75)",
          }}
        >
          Private Invitation
        </p>
        <OrnamentalRule wide />
      </motion.div>

      <div className="flex-1" />

      {/* Selector panel */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center px-8 pb-16 w-full max-w-md mx-auto"
      >
        <DiamondOrnament size={10} color="#C9A84C" opacity={0.6} />
        <p
          className="text-[9px] tracking-[0.5em] uppercase mt-5 mb-2"
          style={{
            fontFamily: "Lato,sans-serif",
            color: "rgba(201,168,76,0.7)",
          }}
        >
          PIN Verified
        </p>
        <h2
          className="text-3xl mb-2 text-center"
          style={{ fontFamily: "Great Vibes,cursive", color: "#FFFFFF" }}
        >
          Welcome
        </h2>
        <p
          className="text-xs text-center mb-8"
          style={{
            fontFamily: "Playfair Display,serif",
            fontStyle: "italic",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          Please select your name to open your invitation
        </p>

        <div className="w-full space-y-px">
          {guests.map((g, i) => (
            <motion.div
              key={g.name}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
              className="w-full flex flex-col gap-2"
            >
              <button
                onClick={() => onSelect(g)}
                className="w-full flex items-center justify-between px-6 py-5 text-left transition-all duration-300 group border"
                style={{
                  background: "rgba(6,14,8,0.5)",
                  borderColor: "rgba(201,168,76,0.2)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(26,61,40,0.55)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(201,168,76,0.5)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(6,14,8,0.5)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(201,168,76,0.2)";
                }}
              >
                <div>
                  <p
                    className="text-base"
                    style={{
                      fontFamily: "Playfair Display,serif",
                      color: "#FFFFFF",
                    }}
                  >
                    {g.title &&
                    !g.name.toLowerCase().startsWith(g.title.toLowerCase())
                      ? `${g.title} ${g.name}`
                      : g.name}
                  </p>
                  <p
                    className="text-[9px] tracking-wider mt-0.5"
                    style={{
                      fontFamily: "Lato,sans-serif",
                      color: "rgba(201,168,76,0.55)",
                    }}
                  >
                    {g.relation} · {g.table}
                  </p>
                </div>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  className="flex-shrink-0 opacity-30 group-hover:opacity-80 transition-opacity"
                >
                  <path
                    d="M5 9 H13 M10 5 L14 9 L10 13"
                    stroke="#C9A84C"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => onHelpRsvp(g)}
                className="w-full text-left px-6 py-3 border border-[rgba(201,168,76,0.2)] rounded-sm text-[11px] tracking-[0.18em] uppercase transition-colors"
                style={{
                  background: "rgba(6,14,8,0.4)",
                  color: "#FFFFFF",
                  fontFamily: "Lato,sans-serif",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(26,61,40,0.6)";
                  (e.currentTarget as HTMLElement).style.color =
                    "rgba(255,255,255,0.95)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(6,14,8,0.4)";
                  (e.currentTarget as HTMLElement).style.color = "#FFFFFF";
                }}
              >
                Help this guest RSVP
              </button>
            </motion.div>
          ))}
        </div>

        <button
          onClick={onBack}
          className="mt-8 text-[9px] tracking-[0.35em] uppercase transition-colors"
          style={{
            fontFamily: "Lato,sans-serif",
            color: "rgba(255,255,255,0.3)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color =
              "rgba(201,168,76,0.7)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color =
              "rgba(255,255,255,0.3)";
          }}
        >
          ← Back
        </button>

        <div className="w-full mt-8">
          <div className="flex items-center gap-4">
            <div
              className="flex-1 h-px"
              style={{ background: "rgba(201,168,76,0.18)" }}
            />
            <p
              className="text-[8px] tracking-[0.35em] uppercase"
              style={{
                fontFamily: "Lato,sans-serif",
                color: "rgba(201,168,76,0.3)",
              }}
            >
              Koito ak Chaik · 8.8.26
            </p>
            <div
              className="flex-1 h-px"
              style={{ background: "rgba(201,168,76,0.18)" }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Admin PIN Gate (6-digit) ───────────────────────────────────────────────
function AdminPinGate({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void;
  onSuccess: (pin: string, permissions: string[]) => void;
}) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [errorMsg, setErrorMsg] = useState("");
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleChange = (i: number, val: string) => {
    const cleaned = val.replace(/[^0-9]/g, "").slice(-1);
    const next = [...digits];
    next[i] = cleaned;
    setDigits(next);
    if (cleaned && i < 5) refs[i + 1].current?.focus();
    if (i === 5 && next.join("").length === 6) {
      submit(next.join(""));
    }
  };

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && digits[i] === "" && i > 0) {
      const next = [...digits];
      next[i - 1] = "";
      setDigits(next);
      refs[i - 1].current?.focus();
    }
  };

  const submit = async (pin: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: pin }),
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        onSuccess(pin, data.admin?.clusterPermissions || []);
        return;
      }
      setErrorMsg(data?.error || "Invalid PIN");
      setDigits(["", "", "", "", "", ""]);
      refs[0].current?.focus();
    } catch (e) {
      setErrorMsg("Network error");
    }
  };

  const inputStyle = {
    fontFamily: "Playfair Display,serif",
    caretColor: "#C9A84C",
    color: "#FFFFFF",
    WebkitTextSecurity: "disc",
    background: "rgba(5,11,6,0.65)",
    border: "1px solid rgba(201,168,76,0.35)",
    width: "3.25rem",
    height: "3.75rem",
  } as React.CSSProperties & { WebkitTextSecurity?: string };

  return (
    <div className="flex flex-col items-center gap-4">
      <p
        className="text-xs tracking-[0.25em] uppercase text-center"
        style={{
          fontFamily: "Lato,sans-serif",
          color: "rgba(255,255,255,0.78)",
          fontWeight: 300,
        }}
      >
        Enter Your Pin
      </p>
      <div className="flex gap-3">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={refs[i]}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoComplete="off"
            spellCheck={false}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
            onFocus={() => errorMsg && setErrorMsg("")}
            className="text-center text-2xl focus:outline-none transition-all duration-300"
            style={inputStyle}
            onFocusCapture={(e) => {
              (e.target as HTMLInputElement).style.borderColor =
                "rgba(201,168,76,0.85)";
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor =
                "rgba(201,168,76,0.35)";
            }}
          />
        ))}
      </div>
      {errorMsg && (
        <div
          className="text-[10px] text-center max-w-[220px] leading-5"
          style={{
            fontFamily: "Lato,sans-serif",
            color: "rgba(220,80,80,0.85)",
          }}
        >
          {errorMsg}
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-2 border"
          style={{
            borderColor: "rgba(201,168,76,0.35)",
            color: "rgba(255,255,255,0.85)",
            background: "rgba(4,12,6,0.7)",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Accommodation Tabs Component ─────────────────────────────────────────────

function AccommodationTabsSection() {
  const [activeTab, setActiveTab] = useState<
    "mara" | "kisii" | "migori" | "nyamira" | "bomet"
  >("mara");
  const [subCategory, setSubCategory] = useState<"hotels" | "airbnbs">(
    "hotels",
  );

  const countyData: Record<
    string,
    {
      name: string;
      summary: string;
      hotels?: Array<{
        name: string;
        desc: string;
        rates: string;
        email?: string;
        phone?: string;
      }>;
      airbnbs?: Array<{
        name: string;
        desc: string;
        link: string;
      }>;
      isMara?: boolean;
    }
  > = {
    mara: {
      name: "Maasai Mara Triangle",
      summary:
        "Curated luxury safari lodges and tented camps in and around the Maasai Mara Triangle.",
      isMara: true,
    },
    kisii: {
      name: "Kisii County",
      summary:
        "Neighbouring county · 65 km to Intonna Heritage Farm (1 hr 23 mins by road)",
      hotels: [
        {
          name: "1. Karmel Park Hotel",
          desc: "A highly-rated, upscale hotel located along the Kisii-Kilgoris Road in Kisii, Kenya. Perched atop a hill, it is well-known for its panoramic views, tranquil atmosphere, and premium amenities.",
          rates: "$45 – $105",
          email: "reservations@kamelpark.com",
          phone: "+254 714 386 594",
        },
        {
          name: "2. Ufanisi Resort",
          desc: "An eco-friendly 4-star hotel located along the Getare-Nyamira Bypass in Kisii, Kenya. Features comfortable rooms and private cottages.",
          rates: "$45 – $80 (Cottages $142)",
          email: "info@ufanisiresorts.com",
          phone: "+254 796 105 718",
        },
        {
          name: "3. Humphreys Hill House",
          desc: "A luxury boutique hotel in Kisii, Kenya, combining upscale accommodation with a strong emphasis on Gusii culture, architecture, and sustainability.",
          rates: "$45 – $105",
          email: "reservations@humphreyshillhouse.com",
          phone: "+254 769 683 706",
        },
        {
          name: "4. Hotel Zesper",
          desc: "A modern hotel in Kisii, Kenya, positioned as a tranquil hilltop property. A highly rated boutique-style property offering comfortable accommodations, great food, and reliable amenities.",
          rates: "$45 – $65",
          phone: "+254 798 450 077",
        },
        {
          name: "5. Mevrose Hotel",
          desc: "A hotel in Jogoo, Kisii, located just 1.4 km from the city center on Kisii-Prisons Road. Rates vary by season.",
          rates: "$30 – $50",
          phone: "+254 795 969 696",
        },
        {
          name: "6. La Zion Hotel Kisii",
          desc: "Premier destination for luxury, comfort, and relaxation in the heart of Kisii, Kenya. Strategically located off the Kisii-Nyamira Highway, just 100 meters from the main road.",
          rates: "$25 – $50",
          email: "info@lazion.co.ke",
          phone: "+254 705 935 500",
        },
      ],
      airbnbs: [
        {
          name: "Kisii Airbnbs & Private Stays",
          desc: "Explore private homes, self-catering apartments, and guest suites available on Airbnb in Kisii.",
          link: "https://www.airbnb.com/s/Kisii--Kisii-County/homes?date_picker_type=calendar&refinement_paths%5B%5D=%2Fhomes&place_id=ChIJYUFfsuw7KxgRsS2Lx5BqUUQ&location_bb=vym490ILLpm%2FMqEJQgsJ0g%3D%3D&acp_id=d4420be9-5c45-4df8-9cc8-a37ea9fea2c0&checkin=2026-08-02&checkout=2026-08-09&search_type=autocomplete_click",
        },
      ],
    },
    migori: {
      name: "Migori County",
      summary:
        "Neighbouring county · 62 km to Intonna Heritage Farm (1 hr 36 mins by road — major part is murram, travel time may vary depending on weather and road conditions)",
      hotels: [
        {
          name: "1. Hotel Vannah",
          desc: "Hotel on the A1 highway in Suna, Migori County, Kenya. Serves leisure travelers, business guests, and conference groups, with amenities including guest rooms, dining, swimming pool, and meeting facilities.",
          rates: "$25 – $50",
          email: "hotelvannah@gmail.com",
          phone: "+254 114 354 972",
        },
        {
          name: "2. Calabash Hotel",
          desc: "Three-star hotel on Ombo-Kadika Road in Migori, Kenya, offering accommodation for business travelers, families, and visitors exploring western Kenya.",
          rates: "$25 – $60",
          email: "reservations@calabash.co.ke",
          phone: "+254 722 407 743",
        },
        {
          name: "3. Florence Hotel",
          desc: "Hotel on Isebania Highway in Migori, Kenya, offering lodging, dining, and leisure facilities for both business and leisure travelers.",
          rates: "$25 – $55",
          phone: "+254 717 055 036",
        },
        {
          name: "4. Hotel Discretion",
          desc: "Hotel Discretion Ltd is a hotel in Migori, Kenya, located along Sirare Road. Operates as a mid-range accommodation option offering guest rooms, an on-site restaurant, and leisure facilities.",
          rates: "$35 – $60",
          phone: "+254 741 931 262",
        },
      ],
      airbnbs: [
        {
          name: "Migori Airbnbs & Private Stays",
          desc: "Discover self-catering apartments, local homes, and private rooms available on Airbnb in Migori.",
          link: "https://www.airbnb.com/s/MIGORI/homes?search_type=search_query&date_picker_type=calendar&refinement_paths%5B%5D=%2Fhomes&acp_id=d4420be9-5c45-4df8-9cc8-a37ea9fea2c0&checkin=2026-08-02&checkout=2026-08-09&flexible_trip_lengths%5B%5D=one_week&monthly_start_date=2026-08-01&monthly_length=3&monthly_end_date=2026-11-01&price_filter_input_type=2&price_filter_num_nights=7&channel=EXPLORE",
        },
      ],
    },
    nyamira: {
      name: "Nyamira County",
      summary:
        "Neighbouring county · 93 km to Intonna Heritage Farm (2 hrs 4 mins by road)",
      hotels: [
        {
          name: "1. Nyamira Height Suites",
          desc: "Serviced apartment-style accommodation in Nyamira, Kenya. Offers apartment-style lodging with kitchens, making it suitable for both short visits and longer stays.",
          rates: "$30 – $50",
          phone: "+254 742 433 143",
        },
        {
          name: "2. Helsinki Hotel",
          desc: "Helsinki Hotel Nyamira is a hotel in Nyabite, Nyamira, Kenya, offering accommodation, dining, and event facilities. Has 53 guest rooms across standard, deluxe, executive, and family categories.",
          rates: "$25 – $50",
          phone: "+254 716 316 600",
        },
      ],
      airbnbs: [
        {
          name: "Nyamira Airbnbs & Private Stays",
          desc: "Browse Airbnb rentals, homestays, and private cottages in Nyamira County.",
          link: "https://www.airbnb.com/s/NYAMIRA/homes?search_type=search_query&date_picker_type=calendar&refinement_paths%5B%5D=%2Fhomes&acp_id=d4420be9-5c45-4df8-9cc8-a37ea9fea2c0&checkin=2026-08-02&checkout=2026-08-09&flexible_trip_lengths%5B%5D=one_week&monthly_start_date=2026-08-01&monthly_length=3&monthly_end_date=2026-11-01&price_filter_input_type=2&price_filter_num_nights=7&channel=EXPLORE",
        },
      ],
    },
    bomet: {
      name: "Bomet County",
      summary:
        "Neighbouring county · 109 km to Intonna Heritage Farm (2 hrs 19 mins by road)",
      hotels: [
        {
          name: "1. Willis Hotel",
          desc: "A 4-star accommodation located just off the Bomet-Silibwet Road (Near Sotik-Tenwek Junction) in Bomet, Kenya. Features free Wi-Fi, restaurant, bar, children's playground, and tranquil gardens.",
          rates: "$45 – $80",
          email: "hotelthewillis@gmail.com",
          phone: "+254 758 000 010",
        },
        {
          name: "2. Famous Gate Hotel",
          desc: "A premier hospitality destination and the largest hotel facility in the South Rift region. Situated in Kyogong along the Bomet–Narok Highway (3 km from Bomet town center).",
          rates: "$45 – $95",
          email: "famousgatesbmt@gmail.com",
          phone: "+254 706 782 828",
        },
      ],
      airbnbs: [
        {
          name: "Bomet Airbnbs & Private Stays",
          desc: "Browse house rentals, apartments, and guest homes available on Airbnb in Bomet.",
          link: "https://www.airbnb.com/s/BOMET/homes?search_type=search_query&date_picker_type=calendar&refinement_paths%5B%5D=%2Fhomes&acp_id=d4420be9-5c45-4df8-9cc8-a37ea9fea2c0&checkin=2026-08-02&checkout=2026-08-09&flexible_trip_lengths%5B%5D=one_week&monthly_start_date=2026-08-01&monthly_length=3&monthly_end_date=2026-11-01&price_filter_input_type=2&price_filter_num_nights=7&channel=EXPLORE",
        },
      ],
    },
  };

  const current = countyData[activeTab];

  return (
    <div
      id="accommodation"
      className="bg-background border border-border mt-8 sm:mt-12 mb-8 sm:mb-12 scroll-mt-20"
    >
      {/* Section Header */}
      <div className="p-4 sm:p-6 border-b border-border text-center">
        <p
          className="text-xs sm:text-sm tracking-[0.4em] text-accent uppercase mb-1 font-bold text-center"
          style={{ fontFamily: "Lato,sans-serif" }}
        >
          Accommodation
        </p>
        <p
          className="text-xs sm:text-sm text-muted-foreground mt-1 leading-5 sm:leading-6 max-w-xl mx-auto"
          style={{ fontFamily: "Lato,sans-serif", fontWeight: 300 }}
        >
          Kilgoris has limited accommodation. We recommend staying in the
          neighboring counties below.
        </p>
      </div>

      {/* Mobile Select Dropdown */}
      <div className="block sm:hidden p-3 bg-card/60 border-b border-border">
        <label
          className="text-[9px] tracking-widest text-accent uppercase font-bold block mb-1.5"
          style={{ fontFamily: "Lato,sans-serif" }}
        >
          Select County / Accommodation Region
        </label>
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as any)}
          className="w-full bg-background border border-accent/50 text-foreground px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-accent rounded-sm shadow-sm"
          style={{ fontFamily: "Lato,sans-serif" }}
        >
          <option value="mara">1. Maasai Mara Triangle (38–62 km)</option>
          <option value="kisii">2. Kisii County (65 km)</option>
          <option value="migori">3. Migori County (62 km)</option>
          <option value="nyamira">4. Nyamira County (93 km)</option>
          <option value="bomet">5. Bomet County (109 km)</option>
        </select>
      </div>

      {/* Navigation Tabs (Desktop & Tablet) */}
      <div className="hidden sm:flex border-b border-border overflow-x-auto scrollbar-none bg-card/40 w-full justify-between">
        {[
          { key: "mara", label: "Maasai Mara " },
          { key: "kisii", label: "Kisii County" },
          { key: "migori", label: "Migori County" },
          { key: "nyamira", label: "Nyamira County" },
          { key: "bomet", label: "Bomet County" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex-1 min-w-0 text-center px-1.5 sm:px-2 md:px-3 py-3 sm:py-3.5 text-[8.5px] sm:text-[9.5px] md:text-[10px] tracking-[0.05em] sm:tracking-[0.1em] md:tracking-[0.15em] uppercase border-b-2 whitespace-nowrap transition-all duration-300 cursor-pointer ${
              activeTab === key
                ? "border-accent text-accent font-bold bg-accent/10"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
            style={{ fontFamily: "Lato,sans-serif" }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Panel Content */}
      <div className="p-4 sm:p-6 md:p-8">
        <div className="flex items-start justify-between flex-wrap gap-2 mb-4 sm:mb-6 border-b border-border/50 pb-3 sm:pb-4">
          <div>
            <p
              className="text-xs tracking-[0.25em] text-accent uppercase font-semibold"
              style={{ fontFamily: "Lato,sans-serif" }}
            >
              {current.name}
            </p>
            <p
              className="text-[10px] sm:text-xs text-muted-foreground/80 mt-1 leading-4 sm:leading-5"
              style={{ fontFamily: "Lato,sans-serif" }}
            >
              {current.summary}
            </p>
          </div>
        </div>

        {/* Category Sub-Filter Navigation Buttons (For counties with Hotels & Airbnbs) */}
        {!current.isMara && (
          <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-3">
            <button
              type="button"
              onClick={() => setSubCategory("hotels")}
              className={`flex-1 py-2.5 text-[9px] sm:text-[10px] uppercase tracking-wider font-bold rounded-sm transition-all duration-200 cursor-pointer ${
                subCategory === "hotels"
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "bg-card text-muted-foreground hover:text-foreground border border-border"
              }`}
              style={{ fontFamily: "Lato,sans-serif" }}
            >
              Hotels & Resorts
            </button>
            <button
              type="button"
              onClick={() => setSubCategory("airbnbs")}
              className={`flex-1 py-2.5 text-[9px] sm:text-[10px] uppercase tracking-wider font-bold rounded-sm transition-all duration-200 cursor-pointer ${
                subCategory === "airbnbs"
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "bg-card text-muted-foreground hover:text-foreground border border-border"
              }`}
              style={{ fontFamily: "Lato,sans-serif" }}
            >
              Airbnbs & Private Stays
            </button>
          </div>
        )}

        {current.isMara ? (
          <div>
            <div className="mb-8">
              <p
                className="text-[10px] tracking-[0.25em] text-accent uppercase font-bold mb-3"
                style={{ fontFamily: "Lato,sans-serif" }}
              >
                Hotels, Tented Camps & Safari Lodges
              </p>
              <p
                className="text-xs sm:text-sm text-muted-foreground mb-3 leading-5 sm:leading-6"
                style={{ fontFamily: "Lato,sans-serif", fontWeight: 300 }}
              >
                Luxury stays in the Maasai Mara Triangle are listed below with
                distance and travel time to Intonna Heritage Farm. Please note
                that parking fees may apply at some hotels for guest vehicles.
                Transportation arrangements will vary depending on the hotel
                selected.
              </p>

              <div className="space-y-3 mb-6">
                {[
                  {
                    name: "Kilima Camp Masai Mara",
                    dist: "38 km (1 hr 15 mins to venue)",
                    subLocation: "Siria Escarpment, Maasai Mara Triangle",
                    tripAdvisor:
                      "https://www.tripadvisor.com/Hotel_Review-g294209-d638879-Reviews-Kilima_Camp_Masai_Mara-Maasai_Mara_National_Reserve_Rift_Valley_Province.html",
                  },
                  {
                    name: "Angama Mara",
                    dist: "41 km (1 hr 25 mins to venue)",
                    subLocation: "Oloololo Escarpment, Maasai Mara Triangle",
                    tripAdvisor:
                      "https://www.tripadvisor.com/Hotel_Review-g294209-d8426025-Reviews-Angama_Mara-Maasai_Mara_National_Reserve_Rift_Valley_Province.html",
                  },
                  {
                    name: "Mara Elatia",
                    dist: "43 km (1 hr 30 mins to venue)",
                    subLocation: "Oloololo Gate, Maasai Mara Triangle",
                    tripAdvisor:
                      "https://www.tripadvisor.com/Hotel_Review-g1026010-d25280925-Reviews-Mara_Elatia_Camp-Narok_Rift_Valley_Province.html",
                    booking:
                      "https://www.booking.com/hotel/ke/mara-elatia-camp-masai-mara.en-gb.html",
                  },
                  {
                    name: "Pearl Mara",
                    dist: "46 km (1 hr 35 mins to venue)",
                    subLocation: "Mara Rianta, Maasai Mara Triangle Sector",
                    tripAdvisor:
                      "https://www.tripadvisor.com/Hotel_Review-g23379736-d33982169-Reviews-Pearl_Mara-Mara_Rianta_Rift_Valley_Province.html",
                    booking:
                      "https://www.booking.com/hotel/ke/pearl-mara-expedition-53-tours-ltd.en-gb.html",
                  },
                  {
                    name: "Sanctuary Olonana",
                    dist: "47 km (1 hr 38 mins to venue)",
                    subLocation: "Mara River, Maasai Mara Triangle Boundary",
                    tripAdvisor:
                      "https://www.tripadvisor.com/Hotel_Review-g23379736-d569566-Reviews-Olonana_Lodge_An_A_k_Sanctuary-Mara_Rianta_Rift_Valley_Province.html",
                  },
                  {
                    name: "Saruni Mara",
                    dist: "52 km (1 hr 45 mins to venue)",
                    subLocation: "Mara North Conservancy & Triangle Access",
                    tripAdvisor:
                      "https://www.tripadvisor.com/Hotel_Review-g9807487-d600516-Reviews-Saruni_Mara-Mara_North_Conservancy_Maasai_Mara_National_Reserve_Rift_Valley_Province.html",
                    booking:
                      "https://www.booking.com/hotel/ke/saruni-mara-narok.en-gb.html",
                  },
                  {
                    name: "Karen Blixen Camp",
                    dist: "54 km (1 hr 48 mins to venue)",
                    subLocation: "Mara North Conservancy / Triangle Border",
                    tripAdvisor:
                      "https://www.tripadvisor.com/Hotel_Review-g9807487-d1051579-Reviews-Karen_Blixen_Camp-Mara_North_Conservancy_Maasai_Mara_National_Reserve_Rift_Valley_Pro.html",
                  },
                  {
                    name: "Mara Serena Safari Lodge",
                    dist: "58 km (1 hr 52 mins to venue)",
                    subLocation: "Central Maasai Mara Triangle",
                    tripAdvisor:
                      "https://www.tripadvisor.com/Hotel_Review-g294209-d305101-Reviews-Mara_Serena_Safari_Lodge-Maasai_Mara_National_Reserve_Rift_Valley_Province.html",
                    booking:
                      "https://www.booking.com/hotel/ke/mara-serena-safari-lodge.en-gb.html",
                  },
                  {
                    name: "Basecamp Maasai Mara",
                    dist: "62 km (2 hrs 05 mins to venue)",
                    subLocation: "Talek River, Maasai Mara Ecosystem",
                    tripAdvisor:
                      "https://www.tripadvisor.com/Hotel_Review-g294209-d472057-Reviews-Basecamp_Masai_Mara-Maasai_Mara_National_Reserve_Rift_Valley_Province.html",
                    booking:
                      "https://www.booking.com/hotel/ke/basecamp-masai-mara.en-gb.html",
                  },
                ].map(({ name, dist, subLocation, tripAdvisor, booking }) => (
                  <div
                    key={name}
                    className="p-4 sm:p-5 bg-card border border-border hover:border-accent/40 transition-colors rounded-sm sm:rounded-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p
                          className="text-sm font-semibold text-foreground"
                          style={{ fontFamily: "Playfair Display,serif" }}
                        >
                          {name}
                        </p>
                        {dist && (
                          <span
                            className="text-[9.5px] font-bold text-accent px-2 py-0.5 bg-accent/10 border border-accent/30 rounded-sm inline-flex items-center"
                            style={{ fontFamily: "Lato,sans-serif" }}
                          >
                            {dist}
                          </span>
                        )}
                      </div>
                      <p
                        className="text-xs text-muted-foreground"
                        style={{
                          fontFamily: "Lato,sans-serif",
                          fontWeight: 300,
                        }}
                      >
                        {subLocation}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                      {tripAdvisor && (
                        <a
                          href={tripAdvisor}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-accent font-bold px-3 py-1.5 bg-accent/10 border border-accent/30 hover:bg-accent/20 transition-colors rounded-sm inline-flex items-center gap-1.5"
                          style={{ fontFamily: "Lato,sans-serif" }}
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                          TripAdvisor
                        </a>
                      )}
                      {booking && (
                        <a
                          href={booking}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-accent/90 font-bold px-3 py-1.5 bg-card border border-border hover:border-accent/50 hover:text-accent transition-colors rounded-sm inline-flex items-center gap-1.5"
                          style={{ fontFamily: "Lato,sans-serif" }}
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                          Booking.com
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hotels Section */}
            {subCategory === "hotels" &&
              current.hotels &&
              current.hotels.length > 0 && (
                <div>
                  <p
                    className="text-[10px] tracking-[0.25em] text-accent uppercase font-bold mb-3"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    Hotels & Resorts
                  </p>
                  <div className="space-y-3">
                    {current.hotels.map(
                      ({ name, desc, rates, email, phone }: any) => (
                        <div
                          key={name}
                          className="p-4 sm:p-5 bg-card border border-border hover:border-accent/40 transition-colors rounded-sm sm:rounded-none"
                        >
                          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                            <div className="space-y-1.5 flex-1 min-w-0 w-full">
                              <div className="flex items-start justify-between gap-2 sm:block">
                                <p
                                  className="text-sm font-semibold text-foreground"
                                  style={{
                                    fontFamily: "Playfair Display,serif",
                                  }}
                                >
                                  {name}
                                </p>
                                <span
                                  className="inline-block sm:hidden text-[10px] text-accent font-bold px-2.5 py-1 bg-accent/10 border border-accent/30 whitespace-nowrap flex-shrink-0"
                                  style={{ fontFamily: "Lato,sans-serif" }}
                                >
                                  {rates}
                                </span>
                              </div>
                              <p
                                className="text-xs text-muted-foreground leading-5"
                                style={{
                                  fontFamily: "Lato,sans-serif",
                                  fontWeight: 300,
                                }}
                              >
                                {desc}
                              </p>
                              <div className="flex flex-wrap gap-2.5 sm:gap-4 pt-2 items-center">
                                {email && (
                                  <a
                                    href={`mailto:${email}`}
                                    className="text-[10px] text-accent/90 hover:text-accent transition-colors underline underline-offset-2 font-medium"
                                    style={{ fontFamily: "Lato,sans-serif" }}
                                  >
                                    ✉ {email}
                                  </a>
                                )}
                                {phone && (
                                  <a
                                    href={`tel:${phone.replace(/\s+/g, "")}`}
                                    className="text-[10px] text-muted-foreground hover:text-accent transition-colors font-medium border border-border/80 px-2.5 py-1 bg-card/60 rounded-sm"
                                    style={{ fontFamily: "Lato,sans-serif" }}
                                  >
                                    📞 {phone}
                                  </a>
                                )}
                              </div>
                            </div>
                            <span
                              className="hidden sm:inline-block text-xs text-accent font-semibold px-3 py-1.5 bg-accent/10 border border-accent/30 whitespace-nowrap flex-shrink-0"
                              style={{ fontFamily: "Lato,sans-serif" }}
                            >
                              {rates}
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

            {/* Airbnbs Section */}
            {subCategory === "airbnbs" &&
              current.airbnbs &&
              current.airbnbs.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p
                      className="text-[10px] tracking-[0.25em] text-accent uppercase font-bold"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      Airbnbs & Private Stays
                    </p>
                  </div>
                  <div className="space-y-3">
                    {current.airbnbs.map(
                      ({ name, desc, rates, link, phone, email }: any) => (
                        <div
                          key={name}
                          className="p-4 sm:p-5 bg-card border border-accent/30 hover:border-accent/70 transition-colors rounded-sm sm:rounded-none"
                        >
                          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                            <div className="space-y-1.5 flex-1 min-w-0 w-full">
                              <div className="flex items-start justify-between gap-2 sm:block">
                                {link ? (
                                  <a
                                    href={link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm sm:text-base font-semibold text-accent hover:text-accent/80 underline underline-offset-4 transition-colors inline-flex items-center gap-1.5"
                                    style={{
                                      fontFamily: "Playfair Display,serif",
                                    }}
                                  >
                                    <span>{name}</span>
                                    <svg
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                      <polyline points="15 3 21 3 21 9" />
                                      <line x1="10" y1="14" x2="21" y2="3" />
                                    </svg>
                                  </a>
                                ) : (
                                  <p
                                    className="text-sm font-semibold text-foreground"
                                    style={{
                                      fontFamily: "Playfair Display,serif",
                                    }}
                                  >
                                    {name}
                                  </p>
                                )}
                                {rates && (
                                  <span
                                    className="inline-block sm:hidden text-[10px] text-accent font-bold px-2.5 py-1 bg-accent/10 border border-accent/30 whitespace-nowrap flex-shrink-0"
                                    style={{ fontFamily: "Lato,sans-serif" }}
                                  >
                                    {rates}
                                  </span>
                                )}
                              </div>
                              <p
                                className="text-xs text-muted-foreground leading-5"
                                style={{
                                  fontFamily: "Lato,sans-serif",
                                  fontWeight: 300,
                                }}
                              >
                                {desc}
                              </p>
                              <div className="flex flex-wrap gap-2.5 sm:gap-4 pt-2 items-center">
                                {link && (
                                  <a
                                    href={link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-accent font-bold px-3 py-1 bg-accent/15 border border-accent/50 hover:bg-accent/30 transition-colors rounded-sm inline-flex items-center gap-1.5"
                                    style={{ fontFamily: "Lato,sans-serif" }}
                                  >
                                    <svg
                                      width="10"
                                      height="10"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                      <polyline points="15 3 21 3 21 9" />
                                      <line x1="10" y1="14" x2="21" y2="3" />
                                    </svg>
                                    View on Airbnb
                                  </a>
                                )}
                                {email && (
                                  <a
                                    href={`mailto:${email}`}
                                    className="text-[10px] text-accent/90 hover:text-accent transition-colors underline underline-offset-2 font-medium"
                                    style={{ fontFamily: "Lato,sans-serif" }}
                                  >
                                    ✉ {email}
                                  </a>
                                )}
                                {phone && (
                                  <a
                                    href={`tel:${phone.replace(/\s+/g, "")}`}
                                    className="text-[10px] text-muted-foreground hover:text-accent transition-colors font-medium border border-border/80 px-2.5 py-1 bg-card/60 rounded-sm"
                                    style={{ fontFamily: "Lato,sans-serif" }}
                                  >
                                    📞 {phone}
                                  </a>
                                )}
                              </div>
                            </div>
                            {rates && (
                              <span
                                className="hidden sm:inline-block text-xs text-accent font-semibold px-3 py-1.5 bg-accent/10 border border-accent/30 whitespace-nowrap flex-shrink-0"
                                style={{ fontFamily: "Lato,sans-serif" }}
                              >
                                {rates}
                              </span>
                            )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Invitation Screen ─────────────────────────────────────────────────────────

function InvitationScreen({
  guest,
  onExit,
}: {
  guest: GuestRecord;
  onRSVP: () => void;
  onExit: () => void;
}) {
  const [cardStatus, setCardStatus] = useState<"unanswered" | "yes" | "no">(
    "unanswered",
  );
  const [rsvpRecord, setRsvpRecord] = useState<RSVPRecord | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inlineSubmitting, setInlineSubmitting] = useState(false);
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  // Fetch existing guest RSVP directly from PostgreSQL database whenever guest logs in / screen mounts
  useEffect(() => {
    let isMounted = true;
    const guestPin = (
      guest.pin ||
      (guest as any).code ||
      (guest as any).pin ||
      ""
    )
      .toString()
      .trim();
    const guestName = (guest.name || (guest as any).fullName || "")
      .toString()
      .trim()
      .toLowerCase();
    const guestId = (guest as any).id || "";

    fetch("/api/rsvp")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted || !data?.rsvps) return;
        const found = data.rsvps.find((r: any) => {
          if (guestId && r.guestId && r.guestId === guestId) return true;
          if (guestPin && r.pin && r.pin.toString().trim() === guestPin)
            return true;
          if (
            guestName &&
            r.name &&
            r.name.toString().trim().toLowerCase() === guestName
          )
            return true;
          if (
            guestName &&
            r.guestName &&
            r.guestName.toString().trim().toLowerCase() === guestName
          )
            return true;
          return false;
        });

        if (found) {
          setRsvpRecord({
            id: found.id || Date.now().toString(),
            pin: found.pin || guestPin,
            name: found.name || guest.name,
            attending: found.attending === "yes" ? "yes" : "no",
            guestName: found.guestName || "",
            dietary: found.dietary || "",
            message: found.message || "",
            timestamp: found.timestamp || new Date().toISOString(),
          });
          setCardStatus(found.attending === "yes" ? "yes" : "no");
        }
      })
      .catch(() => {
        // Silently default to unanswered/empty RSVP state if fetch fails or no RSVP exists
      });

    return () => {
      isMounted = false;
    };
  }, [guest]);

  const copyBankDetails = (
    bankName: string,
    paybill: string,
    account: string,
  ) => {
    const text = `${bankName} — Paybill: ${paybill}, Account No: ${account}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedBank(bankName);
    setTimeout(() => setCopiedBank(null), 2500);
  };

  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [modalAttending, setModalAttending] = useState<"yes" | "no">("yes");
  const [modalDietary, setModalDietary] = useState("");
  const [modalGuestName, setModalGuestName] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftBank, setGiftBank] = useState<string>("");
  const [giftPhone, setGiftPhone] = useState("");
  const [giftAmount, setGiftAmount] = useState("");
  const [giftSubmitting, setGiftSubmitting] = useState(false);
  const [giftSuccessMsg, setGiftSuccessMsg] = useState<string | null>(null);

  const handleQuickRsvpChoice = async (attendingChoice: "yes" | "no") => {
    setInlineSubmitting(true);
    setModalAttending(attendingChoice);
    const pin = guest.pin || (guest as any).code || "";
    const record: RSVPRecord = {
      id: Date.now().toString(),
      pin,
      name: guest.name,
      attending: attendingChoice,
      guestName: modalGuestName,
      dietary: modalDietary,
      message: modalMessage,
      timestamp: new Date().toISOString(),
    };
    setRsvpRecord(record);
    setCardStatus(attendingChoice);

    try {
      await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: pin || guest.name,
          attending: attendingChoice,
          guestName: modalGuestName,
          dietary: modalDietary,
          message: modalMessage,
        }),
      });
    } catch (err) {
      console.error("🔴 [RSVP MODAL ERROR] Failed to save RSVP:", err);
    } finally {
      setInlineSubmitting(false);
      setShowRsvpModal(false);
    }
  };

  const handleSaveTheDate = () => {
    const title = encodeURIComponent("Koito ak Chaik - Charlene Chelagat Ruto");
    const details = encodeURIComponent(
      "Koito ak Chaik (Engagement & Farewell) of Charlene Chelagat Ruto.\n\nDate: Saturday, 8th August 2026\nTime: 10:00 A.M.\nLocation: Intonna Heritage Farm, Kilgoris, Narok County",
    );
    const location = encodeURIComponent(
      "Intonna Heritage Farm, Kilgoris, Narok County",
    );
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=20260808T070000Z/20260808T150000Z&details=${details}&location=${location}`;

    window.open(googleUrl, "_blank");
  };

  const stagger = (i: number) => ({
    initial: { opacity: 0, y: 36 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 1.1,
      delay: 0.15 + i * 0.2,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  });

  const [activeSection, setActiveSection] = useState<string>("rsvp");

  useEffect(() => {
    const sectionIds = [
      "rsvp",
      "event-details",
      "getting-there",
      "accommodation",
      "gifts",
      "gallery",
    ];
    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      rootMargin: "-20% 0px -55% 0px",
      threshold: 0,
    });

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 60);
  };

  const navItems = [
    { label: "Event Details", id: "event-details" },
    { label: "RSVP", id: "rsvp" },
    { label: "Getting There", id: "getting-there" },
    { label: "Accommodation", id: "accommodation" },
    { label: "Gift", id: "gifts" },
    { label: "Gallery", id: "gallery" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Fixed top bar with Responsive Menu Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 md:px-8 py-3">
          {/* Logo / Title */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <DiamondOrnament size={8} opacity={0.7} color="#C9A84C" />
            <p
              className="text-[9px] sm:text-[10px] tracking-[0.35em] text-accent uppercase font-bold"
              style={{ fontFamily: "Lato,sans-serif" }}
            >
              Private Invitation
            </p>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map(({ label, id }) => {
              const isActive = activeSection === id;
              return (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={`text-[10px] tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer font-bold relative py-1 border-b-2 ${
                    isActive
                      ? "text-accent border-accent"
                      : "text-muted-foreground hover:text-accent border-transparent"
                  }`}
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Right Action & Mobile Toggle */}
          <div className="flex items-center gap-3">
            {/* Exit — visible on desktop only; on mobile it lives inside the drawer */}
            <button
              onClick={onExit}
              className="hidden md:flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors tracking-widest uppercase border border-border/80 px-3 py-1.5 rounded-sm cursor-pointer"
              style={{ fontFamily: "Lato,sans-serif" }}
            >
              <LogOut size={12} /> Exit
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-accent hover:text-foreground transition-colors cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border bg-background/98 px-6 py-4 space-y-3"
            >
              {navItems.map(({ label, id }) => {
                const isActive = activeSection === id;
                return (
                  <button
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className={`block w-full text-left text-xs tracking-[0.25em] uppercase transition-colors py-2 border-b font-semibold cursor-pointer ${
                      isActive
                        ? "text-accent border-accent bg-accent/10 px-3 rounded-sm"
                        : "text-foreground hover:text-accent border-border/40"
                    }`}
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    {label}
                  </button>
                );
              })}

              {/* Exit — mobile only, visually distinct from nav items */}
              <div className="pt-2 mt-1 border-t border-rose-500/20">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onExit();
                  }}
                  className="flex items-center gap-2 w-full text-xs tracking-[0.25em] uppercase font-semibold py-2.5 px-3 rounded-sm text-rose-400 hover:text-rose-200 hover:bg-rose-500/10 border border-rose-500/30 transition-all cursor-pointer"
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  <LogOut size={13} />
                  <span>Exit Invitation</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="pt-12">
        {/* ── Opening: Full-bleed Charlene portrait — face zone clear, text below ── */}
        <motion.div
          {...stagger(0)}
          className="relative min-h-screen flex flex-col overflow-hidden"
        >
          {/* Photo background */}
          {/* Mobile image */}
          <img
            src={g5037}
            alt="Miss Charlene Chelagat Ruto"
            className="absolute inset-0 w-full h-full object-cover md:hidden"
            style={{ objectPosition: "center 15%" }}
          />

          {/* Tablet & Desktop image */}
          <img
            src={charl051}
            alt="Miss Charlene Chelagat Ruto"
            className="absolute inset-0 hidden w-full h-full object-cover md:block"
            style={{ objectPosition: "center 15%" }}
          />

          {/* Top veil — darkens behind "Celebrating" text above her head */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, rgba(4,12,6,0.82) 0%, rgba(4,12,6,0.55) 14%, rgba(4,12,6,0.10) 32%, transparent 48%)",
            }}
          />
          {/* Bottom veil — darkens behind all text below her face */}
          <div
            className="absolute inset-0 pointer-events-none h-full md:hidden"
            style={{
              background:
                "linear-gradient(to top, rgba(4,12,6,0.98) 0%, rgba(4, 12, 6, 1) 22%, rgba(4,12,6,0.65) 65%, transparent 75%)",
            }}
          />

          <div
            className="absolute inset-0 pointer-events-none h-full hidden md:block"
            style={{
              background:
                "linear-gradient(to top, rgba(4,12,6,0.98) 0%, rgba(4, 12, 6, 1) 22%, rgba(4,12,6,0.65) 40%, transparent 62%)",
            }}
          />
          {/* Side vignettes */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, rgba(4,12,6,0.35) 0%, transparent 20%, transparent 80%, rgba(4,12,6,0.35) 100%)",
            }}
          />

          {/* Gold border frame */}
          <div
            className="absolute inset-5 border pointer-events-none"
            style={{ borderColor: "rgba(201,168,76,0.25)" }}
          />
          <div
            className="absolute inset-7 border pointer-events-none"
            style={{ borderColor: "rgba(201,168,76,0.09)" }}
          />

          {/* Corner ornaments */}
          <div className="absolute top-6 left-6 opacity-70">
            <CornerOrnament />
          </div>
          <div className="absolute top-6 right-6 opacity-70">
            <CornerOrnament flip />
          </div>
          <div
            className="absolute bottom-6 left-6 opacity-70"
            style={{ transform: "scaleY(-1)" }}
          >
            <CornerOrnament />
          </div>
          <div
            className="absolute bottom-6 right-6 opacity-70"
            style={{ transform: "scale(-1,-1)" }}
          >
            <CornerOrnament flip />
          </div>

          {/* ══ TOP ZONE — minimal label above her head ══ */}
          <div className="relative z-10 flex flex-col items-center text-center pt-12 px-8">
            <p
              className="text-[9px] tracking-[0.55em] uppercase mb-4"
              style={{
                fontFamily: "Lato,sans-serif",
                color: "rgba(201,168,76,1)",
              }}
            >
              A Private Invitation
            </p>
            <div className="flex items-center gap-3 w-full max-w-xs">
              <div
                className="flex-1 h-px"
                style={{ background: "rgba(201,168,76,0.30)" }}
              />
              <DiamondOrnament size={6} color="#C9A84C" opacity={0.65} />
              <div
                className="flex-1 h-px"
                style={{ background: "rgba(201,168,76,0.30)" }}
              />
            </div>
          </div>

          {/* ── Face zone — completely clear ── */}
          {/* <div className="flex-1" style={{ minHeight: "2vh" }} /> */}
          {/* <div className="flex-1 min-h-[20vh] sm:min-h-[28vh] md:min-h-[36vh] lg:min-h-[42vh]" /> */}
          <div className="flex-1 min-h-[4vh] sm:min-h-[28vh] md:min-h-[36vh] lg:min-h-[42vh]" />

          {/* ══ BOTTOM ZONE — family announcement + cards ══ */}
          <div className="relative z-10 flex flex-col items-center text-center px-8 pb-12 max-w-xl w-full bg-red-900/0 mx-auto">
            {/* <DiamondOrnament size={10} color="#C9A84C" opacity={0.65} /> */}
            {/* <div className="flex justify-center mt-4 mb-6">
              <OrnamentalRule wide />
            </div> */}

            <div className="w-full max-w-xl flex flex-col items-center text-center mx-auto">
              {/* WE, THE FAMILY OF */}
              <p
                className="text-xs tracking-[0.45em] uppercase mb-4"
                style={{
                  fontFamily: "Lato,sans-serif",
                  color: "rgba(201,168,76,0.95)",
                }}
              >
                We, The Family Of
              </p>

              <p
                className="text-2xl md:text-3xl leading-snug"
                style={{
                  fontFamily: "Playfair Display,serif",
                  color: "#FFFFFF",
                  textShadow: "0 2px 12px rgba(0,0,0,0.8)",
                }}
              >
                Dr William Samoei Ruto
              </p>

              <p
                className="text-2xl my-3"
                style={{
                  fontFamily: "Playfair Display,serif",
                  fontStyle: "italic",
                  color: "#C9A84C",
                }}
              >
                &amp;
              </p>

              <p
                className="text-2xl md:text-3xl leading-snug mb-6"
                style={{
                  fontFamily: "Playfair Display,serif",
                  color: "#FFFFFF",
                  textShadow: "0 2px 12px rgba(0,0,0,0.8)",
                }}
              >
                Mrs Rachel Chebet Ruto
              </p>

              {/* WARMLY INVITE */}
              <p
                className="text-xs tracking-[0.45em] uppercase mb-5"
                style={{
                  fontFamily: "Lato,sans-serif",
                  color: "rgba(201,168,76,0.95)",
                }}
              >
                Warmly Invite
              </p>

              <div
                className="inline-flex items-center justify-center border px-5 py-2.5 mb-6 max-w-[90%] sm:max-w-[80%] w-auto min-h-[46px] mx-auto"
                style={{
                  borderColor: "rgba(201,168,76,0.55)",
                  background: "rgba(4,12,6,0.65)",
                }}
              >
                <p
                  className="text-sm sm:text-base md:text-xl lg:text-2xl leading-snug max-w-full text-center break-words"
                  style={{
                    fontFamily: "Playfair Display,serif",
                    fontStyle: "italic",
                    color: "#FFFFFF",
                    textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                  }}
                >
                  {guest.title &&
                  !guest.name
                    .toLowerCase()
                    .startsWith(guest.title.toLowerCase())
                    ? `${guest.title} ${guest.name}`
                    : guest.name}
                </p>
              </div>

              {/* TO THE */}
              <p
                className="text-xs tracking-[0.45em] uppercase mb-4"
                style={{
                  fontFamily: "Lato,sans-serif",
                  color: "rgba(201,168,76,0.95)",
                }}
              >
                To The
              </p>

              {/* Koito ak Chaik */}
              <h1
                className="text-5xl md:text-6xl leading-none mb-3"
                style={{
                  fontFamily: "Great Vibes,cursive",
                  color: "#FFFFFF",
                  textShadow: "0 2px 20px rgba(0,0,0,0.8)",
                  fontSize: "40px",
                }}
              >
                Koito ak Chaik
              </h1>

              {/* ENGAGEMENT AND FAREWELL */}
              <p
                className="text-xs tracking-[0.45em] uppercase mb-2"
                style={{
                  fontFamily: "Lato,sans-serif",
                  color: "rgba(201,168,76,0.95)",
                  fontSize: "9px",
                }}
              >
                (Engagement & Farewell)
              </p>

              <div className="flex justify-center mb-2">
                <OrnamentalRule wide />
              </div>

              {/* OF THEIR DAUGHTER */}
              <p
                className="text-xs tracking-[0.45em] uppercase mb-4"
                style={{
                  fontFamily: "Lato,sans-serif",
                  color: "rgba(201,168,76,0.95)",
                }}
              >
                Of Their Daughter
              </p>

              {/* Charlene Chelagat Ruto */}
              <p
                className="text-2xl md:text-3xl leading-snug mb-6"
                style={{
                  fontFamily: "Playfair Display,serif",
                  color: "#FFFFFF",
                  textShadow: "0 2px 12px rgba(0,0,0,0.8)",
                }}
              >
                Charlene Chelagat Ruto
              </p>
            </div>
            <div className="flex justify-center mb-4">
              <OrnamentalRule wide />
            </div>

            <div className=""></div>

            {/* ── Digital card confirmation ── */}
            {/* <div className="flex justify-center mt-7 mb-3">
              <OrnamentalRule wide />
            </div> */}

            {/* <div
              className="w-full mt-4 border px-7 py-6"
              style={{
                borderColor: "rgba(201,168,76,0.3)",
                background: "rgba(4,12,6,0.72)",
              }}
            >
              <p
                className="text-xs tracking-[0.4em] uppercase mb-2 text-center"
                style={{
                  fontFamily: "Lato,sans-serif",
                  color: "rgba(201,168,76,0.95)",
                }}
              >
                Digital Invitation Card
              </p>
              <p
                className="text-sm text-center mb-5 leading-6"
                style={{
                  fontFamily: "Playfair Display,serif",
                  fontStyle: "italic",
                  color: "rgba(255,255,255,0.88)",
                }}
              >
                Have you received your digital invitation card?
              </p>

              <AnimatePresence mode="wait">
                {cardStatus === "unanswered" && (
                  <motion.div
                    key="buttons"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex gap-3"
                  >
                    <button
                      onClick={() => confirmCard("yes")}
                      className="flex-1 py-3 text-xs tracking-[0.3em] uppercase transition-all duration-300 border hover:border-accent"
                      style={{
                        fontFamily: "Lato,sans-serif",
                        color: "rgba(255,255,255,0.95)",
                        borderColor: "rgba(201,168,76,0.55)",
                        background: "rgba(26,61,40,0.5)",
                      }}
                    >
                      Yes, I Have It
                    </button>
                    <button
                      onClick={() => confirmCard("no")}
                      className="flex-1 py-3 text-xs tracking-[0.3em] uppercase transition-all duration-300 border hover:border-white/60"
                      style={{
                        fontFamily: "Lato,sans-serif",
                        color: "rgba(255,255,255,0.78)",
                        borderColor: "rgba(255,255,255,0.3)",
                        background: "rgba(4,12,6,0.5)",
                      }}
                    >
                      Not Yet
                    </button>
                  </motion.div>
                )}

                {cardStatus === "yes" && (
                  <motion.div
                    key="confirmed"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center gap-3"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <circle
                        cx="9"
                        cy="9"
                        r="8"
                        stroke="#C9A84C"
                        strokeWidth="0.8"
                        strokeOpacity="0.5"
                      />
                      <polyline
                        points="5,9 8,12 13,6"
                        stroke="#C9A84C"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                    <p
                      className="text-xs"
                      style={{
                        fontFamily: "Playfair Display,serif",
                        fontStyle: "italic",
                        color: "rgba(201,168,76,0.85)",
                      }}
                    >
                      Wonderful — we look forward to seeing you.
                    </p>
                    <button
                      onClick={() => confirmCard("unanswered" as "yes")}
                      className="ml-auto text-[8px] opacity-30 hover:opacity-60 transition-opacity"
                      style={{ fontFamily: "Lato,sans-serif", color: "white" }}
                    >
                      Change
                    </button>
                  </motion.div>
                )}

                {cardStatus === "no" && (
                  <motion.div
                    key="notyet"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3 text-center"
                  >
                    <p
                      className="text-xs leading-6"
                      style={{
                        fontFamily: "Playfair Display,serif",
                        fontStyle: "italic",
                        color: "rgba(255,255,255,0.65)",
                      }}
                    >
                      Please contact the event team to have your digital
                      invitation resent.
                    </p>
                    <p
                      className="text-[9px] tracking-wide"
                      style={{
                        fontFamily: "Lato,sans-serif",
                        color: "rgba(201,168,76,0.6)",
                      }}
                    >
                      events@koitoakchaik.com
                    </p>
                    <button
                      onClick={() => confirmCard("unanswered" as "yes")}
                      className="text-[8px] tracking-wider uppercase opacity-40 hover:opacity-70 transition-opacity"
                      style={{ fontFamily: "Lato,sans-serif", color: "white" }}
                    >
                      I have received it now
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div> */}

            {/* ── Confirm Attendance card ── */}
            <div
              id="rsvp"
              className="w-full mt-6 border px-7 py-6 relative scroll-mt-24 z-20 transition-all duration-500"
              style={{
                borderColor: rsvpRecord
                  ? rsvpRecord.attending === "yes"
                    ? "rgba(16, 185, 129, 0.45)"
                    : "rgba(244, 63, 94, 0.45)"
                  : "rgba(201,168,76,0.3)",
                background: rsvpRecord
                  ? rsvpRecord.attending === "yes"
                    ? "rgba(4, 20, 12, 0.9)"
                    : "rgba(24, 6, 10, 0.9)"
                  : "rgba(4,12,6,0.85)",
              }}
            >
              {!rsvpRecord && (
                <p
                  className="text-xs tracking-[0.4em] uppercase mb-2 text-center font-bold"
                  style={{
                    fontFamily: "Lato,sans-serif",
                    color: "rgba(201,168,76,0.95)",
                  }}
                >
                  Kindly RSVP
                </p>
              )}

              {rsvpRecord ? (
                <div className="flex flex-col items-center gap-3 text-center py-2">
                  <div
                    className={`flex flex-col items-center justify-center gap-1 px-5 py-3 border transition-colors ${
                      rsvpRecord.attending === "yes"
                        ? "border-emerald-500/60 bg-emerald-950/50 text-emerald-300"
                        : "border-rose-500/60 bg-rose-950/50 text-rose-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {rsvpRecord.attending === "yes" ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 18 18"
                          fill="none"
                        >
                          <circle
                            cx="9"
                            cy="9"
                            r="8"
                            stroke="#34D399"
                            strokeWidth="1.2"
                          />
                          <polyline
                            points="5,9 8,12 13,6"
                            stroke="#34D399"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 18 18"
                          fill="none"
                        >
                          <circle
                            cx="9"
                            cy="9"
                            r="8"
                            stroke="#F87171"
                            strokeWidth="1.2"
                          />
                          <line
                            x1="6"
                            y1="6"
                            x2="12"
                            y2="12"
                            stroke="#F87171"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                          <line
                            x1="12"
                            y1="6"
                            x2="6"
                            y2="12"
                            stroke="#F87171"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                      <span
                        className="text-xs tracking-[0.2em] uppercase font-bold"
                        style={{ fontFamily: "Lato,sans-serif" }}
                      >
                        {rsvpRecord.attending === "yes"
                          ? "RSVP Confirmed"
                          : "RSVP Recorded"}
                      </span>
                    </div>
                    <span
                      className="text-xs tracking-widest uppercase font-semibold opacity-90"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      {rsvpRecord.attending === "yes"
                        ? "Joyfully Accepted"
                        : "Regretfully Declined"}
                    </span>
                  </div>
                  <p
                    className="text-sm text-center leading-6 mt-1"
                    style={{
                      fontFamily: "Playfair Display,serif",
                      fontStyle: "italic",
                      color:
                        rsvpRecord.attending === "yes"
                          ? "rgba(209, 250, 229, 0.95)"
                          : "rgba(254, 226, 226, 0.95)",
                    }}
                  >
                    {rsvpRecord.attending === "yes"
                      ? "Thank you! Your attendance is confirmed. We look forward to celebrating with you on 8th August 2026."
                      : "Thank you for letting us know. Your response has been received."}
                  </p>
                  {rsvpRecord.attending === "yes" && (
                    <p
                      className="text-xs text-center text-emerald-300/90 tracking-wider font-medium mt-1"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      Please note: Your table will be assigned 24 hours to the
                      event.
                    </p>
                  )}

                  {rsvpRecord.dietary && (
                    <p
                      className={`text-[10px] tracking-wider ${
                        rsvpRecord.attending === "yes"
                          ? "text-emerald-300/80"
                          : "text-rose-300/80"
                      }`}
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      Dietary: {rsvpRecord.dietary}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setRsvpRecord(null)}
                    className="mt-3 text-[11px] tracking-widest uppercase font-semibold text-accent/80 hover:text-accent border-b border-accent/40 hover:border-accent transition-all duration-300 cursor-pointer pt-1"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    Change / Update Response
                  </button>
                </div>
              ) : (
                <>
                  <p
                    className="text-sm text-center mb-2 leading-6"
                    style={{
                      fontFamily: "Playfair Display,serif",
                      fontStyle: "italic",
                      color: "rgba(255,255,255,0.88)",
                    }}
                  >
                    Kindly RSVP by{" "}
                    <span
                      style={{
                        color: "#D4AF37",
                        fontStyle: "normal",
                        fontWeight: 600,
                      }}
                    >
                      3rd August 2026
                    </span>
                  </p>
                  <p
                    className="text-[10px] tracking-[0.2em] text-center mb-5"
                    style={{
                      fontFamily: "Lato,sans-serif",
                      color: "rgba(255,255,255,0.45)",
                    }}
                  >
                    Your response helps us prepare for you
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                    <button
                      type="button"
                      disabled={inlineSubmitting}
                      onClick={() => handleQuickRsvpChoice("yes")}
                      className="py-3.5 px-4 text-xs tracking-wider uppercase border border-emerald-500/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 transition-all duration-300 font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      {inlineSubmitting && modalAttending === "yes"
                        ? "Saving…"
                        : "✓ Joyfully Accepts"}
                    </button>
                    <button
                      type="button"
                      disabled={inlineSubmitting}
                      onClick={() => handleQuickRsvpChoice("no")}
                      className="py-3.5 px-4 text-xs tracking-wider uppercase border border-rose-500/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 transition-all duration-300 font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      {inlineSubmitting && modalAttending === "no"
                        ? "Saving…"
                        : "✕ Regretfully Declines"}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* ----------------------------------------------------------------------------- */}

            {/* Closing ornament */}
            <div className="flex justify-center mt-8 mb-5">
              <OrnamentalRule wide />
            </div>
            <DiamondOrnament size={10} color="#C9A84C" opacity={0.5} />

            {/* Scroll prompt */}
            {/* <motion.div
              className="mt-10 flex flex-col items-center gap-2 opacity-50"
              animate={{ y: [0, 6, 0] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <p
                className="text-[8px] tracking-[0.4em] uppercase"
                style={{
                  fontFamily: "Lato,sans-serif",
                  color: "rgba(201,168,76,0.6)",
                }}
              >
                Scroll
              </p>
              <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
                <path
                  d="M7 2 L7 18 M2 13 L7 18 L12 13"
                  stroke="rgba(201,168,76,0.5)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div> */}
          </div>
        </motion.div>

        {/* ── Story Section — video background ───────────────────── */}
        <motion.div
          {...stagger(2)}
          className="relative overflow-hidden"
          style={{ minHeight: "100vh" }}
        >
          {/* Video background */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            src={chalVideo}
          />

          {/* Dark overlay so text is always readable */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "rgba(4,12,6,0.68)" }}
          />
          {/* Gradient bands top and bottom */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, rgba(4,12,6,0.82) 0%, transparent 25%, transparent 75%, rgba(4,12,6,0.82) 100%)",
            }}
          />

          {/* Gold border frame */}
          <div
            className="absolute inset-5 border pointer-events-none"
            style={{ borderColor: "rgba(201,168,76,0.18)" }}
          />

          {/* Corner ornaments */}
          <div className="absolute top-6 left-6 opacity-50">
            <CornerOrnament />
          </div>
          <div className="absolute top-6 right-6 opacity-50">
            <CornerOrnament flip />
          </div>
          <div
            className="absolute bottom-6 left-6 opacity-50"
            style={{ transform: "scaleY(-1)" }}
          >
            <CornerOrnament />
          </div>
          <div
            className="absolute bottom-6 right-6 opacity-50"
            style={{ transform: "scale(-1,-1)" }}
          >
            <CornerOrnament flip />
          </div>

          {/* Text content */}
          <div className="relative z-10 max-w-2xl mx-auto text-center flex flex-col items-center justify-center min-h-screen px-8 py-24">
            <DiamondOrnament size={12} color="#C9A84C" opacity={0.8} />
            <div className="flex justify-center mt-4 mb-8">
              <OrnamentalRule wide />
            </div>

            {/* A NEW CHAPTER */}
            <p
              className="text-sm tracking-[0.55em] uppercase mb-10 font-bold"
              style={{ fontFamily: "Lato,sans-serif", color: "#D4AF37" }}
            >
              A New Chapter
            </p>

            {/* Body text */}
            <p
              className="text-base md:text-lg leading-9 mb-10"
              style={{
                fontFamily: "Lato,sans-serif",
                fontWeight: 400,
                color: "rgba(255,255,255,0.92)",
              }}
            >
              {" "}
              <strong
                style={{
                  fontFamily: "Playfair Display,serif",
                  color: "#D4AF37",
                  fontWeight: 700,
                }}
              >
                Koito
              </strong>{" "}
              means "to give to." It is the traditional Kalenjin pre-marriage
              negotiation ceremony between the families of the bride and groom,
              where both families formally meet to discuss and agree on the
              union before marriage.{" "}
              <strong
                style={{
                  fontFamily: "Playfair Display,serif",
                  color: "#D4AF37",
                  fontWeight: 700,
                }}
              >
                Chaik
              </strong>{" "}
              is a fond farewell, a gentle releasing of a daughter into her new
              home.
            </p>

            <div className="flex justify-center mb-8">
              <OrnamentalRule wide />
            </div>

            {/* Charlene Chelagat Ruto */}
            <p
              className="text-4xl md:text-5xl leading-none mb-4 font-bold"
              style={{
                fontFamily: "Playfair Display,serif",
                color: "#FFFFFF",
                textShadow: "0 2px 20px rgba(0,0,0,0.7)",
              }}
            >
              Charlene Chelagat Ruto
            </p>

            <p
              className="text-xs tracking-[0.45em] uppercase font-bold"
              style={{ fontFamily: "Lato,sans-serif", color: "#D4AF37" }}
            >
              Daughter of the Ruto Family
            </p>

            <div className="flex justify-center mt-8">
              <OrnamentalRule wide />
            </div>
            <DiamondOrnament size={10} color="#C9A84C" opacity={0.6} />
          </div>
        </motion.div>

        {/* ── Event Details ───────────────────────────────────────── */}
        <motion.div
          id="event-details"
          {...stagger(3)}
          className="relative py-20 px-8 md:px-12 bg-background overflow-hidden scroll-mt-20"
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.02]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg,#8B6914 1px,transparent 1px,transparent 24px)",
            }}
          />

          <div className="max-w-3xl mx-auto relative z-10">
            <div className="text-center mb-14">
              <p
                className="text-sm tracking-[0.4em] text-accent uppercase"
                style={{ fontFamily: "Lato,sans-serif" }}
              >
                Event Details
              </p>
              <OrnamentalRule className="mx-auto mt-4" wide />
            </div>

            {/* Date, Time & Venue Container */}
            <div className="border border-border bg-border flex flex-col gap-px mb-px overflow-hidden">
              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
                {[
                  {
                    icon: Calendar,
                    label: "Date",
                    value: "Saturday, 8th August 2026",
                    sub: "Save the date",
                  },
                  {
                    icon: Clock,
                    label: "Time",
                    value: "10:00 A.M.",
                    sub: "Doors open at 9:30 A.M.",
                  },
                ].map(({ icon: Icon, label, value, sub }) => (
                  <div
                    key={label}
                    className="flex gap-5 items-start p-8 bg-background group hover:bg-card transition-colors duration-500"
                  >
                    <div className="w-10 h-10 border border-border flex items-center justify-center flex-shrink-0 group-hover:border-accent/40 transition-colors duration-500">
                      <Icon
                        size={18}
                        style={{ color: "#C9A84C" }}
                        strokeWidth={1.5}
                      />
                    </div>
                    <div>
                      <p
                        className="text-[18px] tracking-[0.3em] text-muted-foreground uppercase mb-2"
                        style={{
                          fontFamily: "Lato,sans-serif",
                          fontWeight: 800,
                        }}
                      >
                        {label}
                      </p>
                      <p
                        className="text-lg text-foreground"
                        style={{
                          fontFamily: "Playfair Display,serif",
                          fontWeight: 600,
                        }}
                      >
                        {value}
                      </p>
                      {label === "Date" ? (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={handleSaveTheDate}
                            className="py-2 px-4 text-xs tracking-[0.2em] uppercase font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-sm focus:outline-none"
                            style={{
                              fontFamily: "Lato,sans-serif",
                              color: "#8B6914",
                              border: "1px solid rgba(139, 105, 20, 0.45)",
                              background: "rgba(201, 168, 76, 0.14)",
                            }}
                          >
                            <Calendar size={13} style={{ color: "#8B6914" }} />{" "}
                            Save the Date
                          </button>
                        </div>
                      ) : (
                        <p
                          className="text-[18px] text-black mt-1"
                          style={{
                            fontFamily: "Lato,sans-serif",
                            fontWeight: 400,
                          }}
                        >
                          {sub}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Venue */}
              <div className="flex gap-5 items-start p-8 bg-background group hover:bg-card transition-colors duration-500">
                <div className="w-10 h-10 border border-border flex items-center justify-center flex-shrink-0 group-hover:border-accent/40 transition-colors duration-500">
                  <MapPin
                    size={18}
                    style={{ color: "#C9A84C" }}
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <p
                    className="text-[18px] tracking-[0.3em] text-muted-foreground uppercase mb-2"
                    style={{ fontFamily: "Lato,sans-serif", fontWeight: 800 }}
                  >
                    Venue
                  </p>
                  <p
                    className="text-lg text-foreground"
                    style={{
                      fontFamily: "Playfair Display,serif",
                      fontWeight: 600,
                    }}
                  >
                    Intonna Heritage Farm{" "}
                    <span className="block text-base font-normal text-muted-foreground mt-0.5"></span>
                  </p>
                  <p
                    className="text-[16px] text-black mt-1 leading-6"
                    style={{ fontFamily: "Lato,sans-serif", fontWeight: 300 }}
                  >
                    Naserian Village, Kilgoris Town, Narok County, Kenya
                  </p>
                  <a
                    href="https://maps.google.com/?q=Intonna+Heritage+Farm+Kilgoris+Kenya"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-[9px] tracking-[0.2em] text-accent uppercase border-b border-accent/30 hover:border-accent transition-colors"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    <MapPin size={10} /> View on Google Maps
                  </a>
                </div>
              </div>
            </div>

            {/* Getting There */}
            <div
              id="getting-there"
              className="bg-background border border-border mb-px scroll-mt-20"
            >
              <div className="p-4 sm:p-5 border-b border-border text-center">
                <p
                  className="text-xs sm:text-sm tracking-[0.4em] text-accent uppercase font-bold text-center"
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  Getting There
                </p>
              </div>

              {/* By Road */}
              <div className="p-4 sm:p-6 border-b border-border space-y-6">
                <p
                  className="text-xs tracking-[0.25em] text-accent/90 uppercase mb-4 font-bold text-center"
                  style={{ fontFamily: "Lato,sans-serif", fontWeight: 700 }}
                >
                  By Road — Directions
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      title: "From Nairobi",
                      distTime: "340 km · 6 hr 30 min",
                      mapsUrl:
                        "https://www.google.com/maps/dir/Nairobi/Intonna+Heritage+Farm",
                      route:
                        "Take the B3 Road: Mai-Mahiu → Narok → Bomet → Sotik → Keroka.",
                      turn: "At Keroka turn left → Nyacheki → Nyangusu (T-junction, turn left) → Kilgoris Town → proceed straight to the farm.",
                      farmTime: "Kilgoris Town to the farm: 20–25 minutes",
                    },
                    {
                      title: "From Nakuru",
                      distTime: "220 km ·  4 hr 30 min",
                      mapsUrl:
                        "https://www.google.com/maps/dir/Nakuru/Intonna+Heritage+Farm",
                      route: "Mau Summit → Kericho → Litein → Sotik → Keroka.",
                      turn: "At Keroka turn left → Nyacheki → Nyangusu (T-junction, turn left) → Kilgoris Town → proceed straight to the farm.",
                      farmTime: "Kilgoris Town to the farm: 20–25 minutes",
                    },
                    {
                      title: "From Eldoret",
                      distTime: "210 km · 4 hr 15 min",
                      mapsUrl:
                        "https://www.google.com/maps/dir/Eldoret/Intonna+Heritage+Farm",
                      route: "Kapsabet → Nandi Hills → Ahero → Sondu → Keroka.",
                      turn: "At Keroka turn left → Nyacheki → Nyangusu (T-junction, turn left) → Kilgoris Town → proceed straight to the farm.",
                      farmTime: "Kilgoris Town to the farm: 20–25 minutes",
                    },
                    {
                      title: "From Kisumu",
                      distTime: "140 km · 2 hr 45 min",
                      mapsUrl:
                        "https://www.google.com/maps/dir/Kisumu/Intonna+Heritage+Farm",
                      route: "Kisumu → Ahero → Sondu → Kisii → Keroka.",
                      turn: "At Keroka turn left → Nyacheki → Nyangusu (T-junction, turn left) → Kilgoris Town → proceed straight to the farm.",
                      farmTime: "Kilgoris Town to the farm: 20–25 minutes",
                    },
                    {
                      title: "From Mwanza, Tanzania",
                      distTime: "310 km · 6 hr 15 min",
                      mapsUrl:
                        "https://www.google.com/maps/dir/Mwanza,+Tanzania/Intonna+Heritage+Farm",
                      route:
                        "Mwanza → Musoma → Sirari Border → Migori → Nyangusu → Kilgoris Town.",
                      turn: "At Nyangusu T-junction turn left → Kilgoris Town → proceed straight to the farm.",
                      farmTime: "Kilgoris Town to the farm: 20–25 minutes",
                    },
                  ].map(
                    ({ title, distTime, mapsUrl, route, turn, farmTime }) => (
                      <div
                        key={title}
                        className="p-4 bg-card border border-border rounded-sm hover:border-accent/40 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs tracking-wider uppercase font-bold text-accent hover:underline inline-flex items-center gap-1.5"
                            style={{ fontFamily: "Lato,sans-serif" }}
                          >
                            <MapPin
                              size={12}
                              className="text-accent flex-shrink-0"
                            />
                            <span>{title}</span>
                          </a>
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9.5px] text-accent/90 hover:underline font-semibold"
                            style={{ fontFamily: "Lato,sans-serif" }}
                          >
                            {distTime}
                          </a>
                        </div>
                        <p
                          className="text-xs text-foreground leading-5"
                          style={{
                            fontFamily: "Lato,sans-serif",
                            fontWeight: 300,
                          }}
                        >
                          {route}
                        </p>
                        <p
                          className="text-xs text-muted-foreground leading-5 mt-1.5"
                          style={{
                            fontFamily: "Lato,sans-serif",
                            fontWeight: 300,
                          }}
                        >
                          {turn}
                        </p>
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-accent mt-2 font-semibold hover:underline inline-block"
                          style={{ fontFamily: "Lato,sans-serif" }}
                        >
                          {farmTime} (20–25 mins)
                        </a>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* By Air */}
              <div className="p-4 sm:p-6">
                <p
                  className="text-xs tracking-[0.25em] text-accent/90 uppercase mb-4 font-bold text-center"
                  style={{ fontFamily: "Lato,sans-serif", fontWeight: 700 }}
                >
                  By Air
                </p>

                {/* Kichwa Tembo */}
                <div className="mb-5">
                  <div className="flex items-baseline justify-between mb-2">
                    <a
                      href="https://www.google.com/maps/dir/Kichwa+Tembo+Airstrip/Intonna+Heritage+Farm"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm text-foreground font-semibold hover:text-accent hover:underline inline-flex items-center gap-1.5"
                      style={{ fontFamily: "Playfair Display,serif" }}
                    >
                      <MapPin size={12} className="text-accent flex-shrink-0" />
                      <span>Kichwa Tembo Airstrip</span>
                    </a>
                    <a
                      href="https://www.google.com/maps/dir/Kichwa+Tembo+Airstrip/Intonna+Heritage+Farm"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] text-accent/90 hover:underline font-semibold"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      40 km · 1 hr 8 min to venue
                    </a>
                  </div>
                  <div className="space-y-px">
                    {[
                      {
                        airline: "Air Kenya",
                        airport: "Nairobi Wilson",
                        contact: "+254 111 643 379",
                        url: "https://airkenya.com",
                      },
                      {
                        airline: "Tropic Air",
                        airport: "Nairobi Wilson",
                        contact: "+254 715 018 740",
                        url: "https://www.tropicairkenya.com",
                      },
                      {
                        airline: "Safarilink",
                        airport: "Nairobi Wilson / JKIA",
                        contact: "+254 730 888 000",
                        url: "https://www.flysafarilink.com",
                      },
                      {
                        airline: "Boskies",
                        airport: "Nairobi Wilson",
                        contact: "+254 724 255 359",
                        url: "https://www.flyboskies.com",
                      },
                    ].map(({ airline, airport, contact, url }) => (
                      <a
                        key={airline}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-3.5 py-2 bg-card border border-border hover:border-accent/40 transition-all duration-300 group/row"
                      >
                        <p
                          className="text-xs text-foreground group-hover/row:text-accent transition-colors"
                          style={{ fontFamily: "Playfair Display,serif" }}
                        >
                          {airline}
                        </p>
                        <p
                          className="text-[9px] text-muted-foreground hidden md:block"
                          style={{ fontFamily: "Lato,sans-serif" }}
                        >
                          {airport}
                        </p>
                        <p
                          className="text-[9px] text-muted-foreground"
                          style={{ fontFamily: "Lato,sans-serif" }}
                        >
                          {contact}
                        </p>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Migori */}
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <a
                      href="https://www.google.com/maps/dir/Migori+Airstrip/Intonna+Heritage+Farm"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm text-foreground font-semibold hover:text-accent hover:underline inline-flex items-center gap-1.5"
                      style={{ fontFamily: "Playfair Display,serif" }}
                    >
                      <MapPin size={12} className="text-accent flex-shrink-0" />
                      <span>Migori Airstrip</span>
                    </a>
                    <a
                      href="https://www.google.com/maps/dir/Migori+Airstrip/Intonna+Heritage+Farm"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] text-accent/90 hover:underline font-semibold"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      54 km · 1 hr 30 min to venue
                    </a>
                  </div>
                  <div className="space-y-px">
                    {[
                      {
                        airline: "Safarilink",
                        airport: "Nairobi Wilson",
                        contact: "+254 730 888 000",
                        url: "https://www.flysafarilink.com",
                      },
                      {
                        airline: "Skyward Airlines",
                        airport: "Nairobi Wilson",
                        contact: "+254 709 786 000",
                        url: "https://skywardairlines.com",
                      },
                    ].map(({ airline, airport, contact, url }) => (
                      <a
                        key={airline}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-3.5 py-2 bg-card border border-border hover:border-accent/40 transition-all duration-300 group/row"
                      >
                        <p
                          className="text-xs text-foreground group-hover/row:text-accent transition-colors"
                          style={{ fontFamily: "Playfair Display,serif" }}
                        >
                          {airline}
                        </p>
                        <p
                          className="text-[9px] text-muted-foreground hidden md:block"
                          style={{ fontFamily: "Lato,sans-serif" }}
                        >
                          {airport}
                        </p>
                        <p
                          className="text-[9px] text-muted-foreground"
                          style={{ fontFamily: "Lato,sans-serif" }}
                        >
                          {contact}
                        </p>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Accommodation */}
            <AccommodationTabsSection />

            {/* Gifts */}
            <div
              id="gifts"
              className="bg-card border border-border mb-px p-6 sm:p-8 text-center scroll-mt-20"
            >
              <p
                className="text-xs sm:text-sm tracking-[0.4em] text-accent uppercase mb-3 font-bold text-center"
                style={{ fontFamily: "Lato,sans-serif" }}
              >
                Gifts
              </p>
              <p
                className="text-xl text-foreground"
                style={{
                  fontFamily: "Playfair Display,serif",
                  fontStyle: "italic",
                }}
              >
                Your presence is the greatest gift
              </p>
              <div className="flex justify-center my-4">
                <OrnamentalRule />
              </div>
              <p
                className="text-sm text-muted-foreground mb-8"
                style={{ fontFamily: "Lato,sans-serif", fontWeight: 300 }}
              >
                Should you wish to bless Charlene further, we prefer enveloped
                gifts.
                <br />
                For any inquiries, kindly reach out to our contacts below:
              </p>

              {/* RSVP / Gift Contacts */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
                {[
                  {
                    name: "Deborah",
                    phone: "+254 714 591 747",
                    rawPhone: "+254714591747",
                    waPhone: "254714591747",
                  },
                  {
                    name: "Maureen",
                    phone: "+254 719 701 335",
                    rawPhone: "+254719701335",
                    waPhone: "254719701335",
                  },
                ].map(({ name, phone, rawPhone, waPhone }) => (
                  <div
                    key={name}
                    className="flex-1 border p-6 text-center"
                    style={{
                      borderColor: "rgba(201,168,76,0.30)",
                      background: "rgba(201,168,76,0.04)",
                    }}
                  >
                    <p
                      className="text-xs tracking-[0.3em] uppercase mb-2 font-bold"
                      style={{
                        fontFamily: "Lato,sans-serif",
                        color: "rgba(201,168,76,0.95)",
                        fontWeight: 800,
                      }}
                    >
                      {name}
                    </p>
                    <a
                      href={`tel:${rawPhone}`}
                      className="text-base font-bold text-foreground hover:text-accent transition-colors block my-2"
                      style={{
                        fontFamily: "Playfair Display,serif",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {phone}
                    </a>

                    <div className="mt-3 flex items-center justify-center gap-2">
                      <a
                        href={`tel:${rawPhone}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-bold text-accent border border-accent bg-accent/0 hover:bg-accent/15 transition-all duration-300 rounded-sm cursor-pointer"
                        style={{ fontFamily: "Lato,sans-serif" }}
                      >
                        <Phone size={11} /> Call
                      </a>
                      <a
                        href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`Hello ${name}, I am reaching out regarding Charlene's Koito event.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] transition-all duration-300 rounded-sm cursor-pointer shadow-sm border border-[#25D366]"
                        style={{ fontFamily: "Lato,sans-serif" }}
                      >
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="#ffffff"
                        >
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                        </svg>{" "}
                        WhatsApp
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Guest Dress Code & Color Palette */}
            <div
              className="border border-border mb-px p-6 sm:p-10 text-center"
              style={{ background: "#F5EFE4" }}
            >
              {/* Title */}
              <h3
                className="text-sm sm:text-xl font-bold tracking-[0.15em] uppercase text-foreground mb-2"
                style={{
                  fontFamily: "Playfair Display,serif",
                  color: "#2B1A0E",
                }}
              >
                DRESS CODE
              </h3>

              {/* Subtitle */}
              <p
                className="text-sm sm:text-base italic mb-2"
                style={{
                  fontFamily: "Playfair Display,serif",
                  color: "#3D2B1A",
                }}
              >
                Smart, Cultural, Elegance
              </p>

              {/* Color Palette Heading */}
              <p
                className="text-[10px] sm:text-xs tracking-[0.3em]  font-bold mb-7"
                style={{ fontFamily: "Lato,sans-serif", color: "#B47A4A" }}
              >
                All Guests Color Palette
              </p>

              {/* Color Swatches Grid */}
              <div className="grid grid-cols-4 gap-3 sm:gap-6 max-w-md mx-auto mb-4">
                {[
                  { hex: "#6B4E3A", name: "MOCHA", tag: "WARM" },
                  { hex: "#8A5E3C", name: "CHOCOLATE", tag: "NATURAL" },
                  { hex: "#B47A4A", name: "CARAMEL", tag: "SOPHISTICATED" },
                  { hex: "#D4AF37", name: "GOLD", tag: "TIMELESS" },
                ].map(({ hex, name, tag }) => (
                  <div
                    key={name}
                    className="flex flex-col items-center text-center"
                  >
                    <div
                      className="w-full aspect-square border border-black/10 shadow-sm rounded-none"
                      style={{ backgroundColor: hex }}
                    />
                    <p
                      className="text-[9px] sm:text-[11px] tracking-[0.15em] uppercase font-bold mt-2.5"
                      style={{
                        fontFamily: "Lato,sans-serif",
                        color: "#3D2B1A",
                      }}
                    >
                      {name}
                    </p>
                    <p
                      className="text-[7.5px] sm:text-[9.5px] tracking-[0.15em] uppercase font-semibold mt-1"
                      style={{
                        fontFamily: "Lato,sans-serif",
                        color: "#B47A4A",
                      }}
                    >
                      {tag}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reserved table */}
            <div className="mt-px bg-card border-x border-b border-border p-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p
                  className="text-[9px] tracking-[0.35em] text-accent uppercase mb-1"
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  Your Reserved Table
                </p>
                <p
                  className="text-xl text-foreground"
                  style={{
                    fontFamily: "Playfair Display,serif",
                    fontStyle: "italic",
                  }}
                >
                  {guest.table && guest.table !== "Unassigned"
                    ? guest.table.toLowerCase().includes("table")
                      ? guest.table
                      : `Table ${guest.table}`
                    : "Will be available 24 hours to the event"}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="text-[9px] tracking-[0.35em] text-muted-foreground uppercase mb-1"
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  Guest
                </p>
                <p
                  className="text-lg text-foreground"
                  style={{ fontFamily: "Playfair Display,serif" }}
                >
                  {guest.title &&
                  !guest.name
                    .toLowerCase()
                    .startsWith(guest.title.toLowerCase())
                    ? `${guest.title} ${guest.name}`
                    : guest.name}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── RSVP Modal Overlay ── */}
        <AnimatePresence>
          {showRsvpModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-[#07130A] border border-[#C9A84C]/40 p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
              >
                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setShowRsvpModal(false)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>

                <div className="text-center mb-6">
                  <DiamondOrnament size={10} color="#C9A84C" opacity={0.8} />
                  <p
                    className="text-[10px] tracking-[0.4em] uppercase text-accent font-bold mt-2 mb-1"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    Confirm Attendance
                  </p>
                  <h3
                    className="text-2xl text-white font-serif italic"
                    style={{ fontFamily: "Playfair Display,serif" }}
                  >
                    {guest.title &&
                    !guest.name
                      .toLowerCase()
                      .startsWith(guest.title.toLowerCase())
                      ? `${guest.title} ${guest.name}`
                      : guest.name}
                  </h3>
                </div>

                <div className="space-y-4">
                  <p
                    className="text-[10px] text-center text-muted-foreground tracking-[0.2em] uppercase mb-2"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    Select response to confirm:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={inlineSubmitting}
                      onClick={() => handleQuickRsvpChoice("yes")}
                      className="py-3.5 px-4 text-xs tracking-wider uppercase border border-accent/70 bg-accent/25 text-accent hover:bg-accent/40 transition-all duration-300 font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      {inlineSubmitting && modalAttending === "yes"
                        ? "Saving…"
                        : "✓ Joyfully Accepts"}
                    </button>
                    <button
                      type="button"
                      disabled={inlineSubmitting}
                      onClick={() => handleQuickRsvpChoice("no")}
                      className="py-3.5 px-4 text-xs tracking-wider uppercase border border-rose-500/50 bg-rose-950/30 text-rose-300 hover:bg-rose-950/60 transition-all duration-300 font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      {inlineSubmitting && modalAttending === "no"
                        ? "Saving…"
                        : "✕ Regretfully Declines"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Send Gift Modal Overlay ── */}
        <AnimatePresence>
          {showGiftModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-[#07130A] border border-[#C9A84C]/40 p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
              >
                {/* Close button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowGiftModal(false);
                    setGiftSuccessMsg(null);
                  }}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>

                <div className="text-center mb-6">
                  <DiamondOrnament size={10} color="#C9A84C" opacity={0.8} />
                  <p
                    className="text-[10px] tracking-[0.4em] uppercase text-accent font-bold mt-2 mb-1"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    Send Gift {giftBank ? `(${giftBank})` : ""}
                  </p>
                  <h3
                    className="text-2xl text-white font-serif italic"
                    style={{ fontFamily: "Playfair Display,serif" }}
                  >
                    Monetary Blessing
                  </h3>
                </div>

                {giftSuccessMsg ? (
                  <div className="text-center space-y-4 py-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400">
                      <Check size={24} />
                    </div>
                    <p
                      className="text-sm text-emerald-300 font-medium leading-relaxed"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      {giftSuccessMsg}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowGiftModal(false);
                        setGiftSuccessMsg(null);
                      }}
                      className="mt-2 py-2.5 px-6 text-xs tracking-wider uppercase border border-accent/70 bg-accent/25 text-accent hover:bg-accent/40 transition-all duration-300 font-bold cursor-pointer rounded-sm"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!giftPhone || !giftAmount) return;
                      setGiftSubmitting(true);
                      setTimeout(() => {
                        setGiftSubmitting(false);
                        setGiftSuccessMsg(
                          `Thank you! STK Push request of KSh ${Number(giftAmount).toLocaleString()} sent to ${giftPhone}.`,
                        );
                      }, 700);
                    }}
                    className="space-y-5"
                  >
                    <div>
                      <label
                        htmlFor="gift-phone"
                        className="block text-[10px] tracking-[0.2em] uppercase text-accent/90 font-bold mb-1.5"
                        style={{ fontFamily: "Lato,sans-serif" }}
                      >
                        Phone Number
                      </label>
                      <input
                        id="gift-phone"
                        type="tel"
                        required
                        placeholder="e.g. 0712345678"
                        value={giftPhone}
                        onChange={(e) => setGiftPhone(e.target.value)}
                        className="w-full px-4 py-3 text-sm text-white bg-[#040C06] border border-[#C9A84C]/30 focus:border-[#C9A84C] focus:outline-none transition-colors placeholder:text-muted-foreground/40 rounded-sm"
                        style={{ fontFamily: "Lato,sans-serif" }}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="gift-amount"
                        className="block text-[10px] tracking-[0.2em] uppercase text-accent/90 font-bold mb-1.5"
                        style={{ fontFamily: "Lato,sans-serif" }}
                      >
                        Amount (KSh)
                      </label>
                      <input
                        id="gift-amount"
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 5000"
                        value={giftAmount}
                        onChange={(e) => setGiftAmount(e.target.value)}
                        className="w-full px-4 py-3 text-sm text-white bg-[#040C06] border border-[#C9A84C]/30 focus:border-[#C9A84C] focus:outline-none transition-colors placeholder:text-muted-foreground/40 rounded-sm"
                        style={{ fontFamily: "Lato,sans-serif" }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={giftSubmitting}
                      className="w-full py-3.5 px-4 text-xs tracking-[0.25em] uppercase border border-accent/70 bg-accent/25 text-accent hover:bg-accent/40 transition-all duration-300 font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 mt-2 rounded-sm"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      {giftSubmitting ? "Processing…" : "Send"}
                    </button>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Charlene Portrait Gallery ────────────────────────────── */}
        <motion.div
          id="gallery"
          {...stagger(4)}
          className="relative bg-[#0A130B] overflow-hidden scroll-mt-20"
        >
          {/* Section header */}
          <div className="relative z-10 text-center pt-10 pb-12 px-8">
            {/* <DiamondOrnament size={10} color="#C9A84C" opacity={0.45} /> */}
            <div className="flex justify-center mt-0 mb-5">
              <OrnamentalRule wide />
            </div>
            <h2
              className="text-5xl md:text-6xl text-white leading-none"
              style={{ fontFamily: "Great Vibes, cursive" }}
            >
              Miss Charlene Chelagat Ruto
            </h2>
            <p
              className="text-[9px] tracking-[0.42em] uppercase mt-5"
              style={{
                fontFamily: "Lato, sans-serif",
                color: "#D4AF37",
                fontWeight: 700,
              }}
            >
              We are delighted to celebrate our daughter
            </p>
            <div className="flex justify-center mt-6">
              <OrnamentalRule wide />
            </div>
          </div>

          {/* ── Gallery: CSS Mosaic Grid ── */}
          <div
            className="relative z-10"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gridAutoRows: "clamp(52px, 7.5vw, 88px)",
              gap: "3px",
            }}
          >
            {/* ── B&W cinematic banner — full width, rows 1-4 ── */}
            <div
              className="relative overflow-hidden group"
              style={{ gridColumn: "1 / -1", gridRow: "1 / 5" }}
            >
              <img
                src={g5078}
                alt="Charlene running — black and white"
                className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105"
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to right,rgba(10,19,11,0.4) 0%,transparent 20%,transparent 80%,rgba(10,19,11,0.4) 100%)",
                }}
              />
            </div>

            {/* ── Laughing bouquet — tall left hero, rows 5-10 ── */}
            <div
              className="relative overflow-hidden group"
              style={{ gridColumn: "1 / 8", gridRow: "5 / 10" }}
            >
              <img
                src={g4355}
                alt="Charlene laughing with bouquet"
                className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              <div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background:
                    "linear-gradient(to top,rgba(10,19,11,0.55) 0%,transparent 50%)",
                }}
              />
              <div className="absolute inset-[10px] border border-[#C9A84C]/0 group-hover:border-[#C9A84C]/22 transition-all duration-700 pointer-events-none" />
            </div>

            {/* ── Floral panel A — narrow vertical sprig, rows 5-10 ── */}
            <div
              className="relative flex items-center justify-center overflow-hidden bg-[#0A130B]"
              style={{ gridColumn: "8 / 10", gridRow: "5 / 10" }}
            >
              <svg
                viewBox="0 0 80 220"
                fill="none"
                style={{ width: "72px", height: "auto", opacity: 0.9 }}
              >
                <path
                  d="M40 215 C39 180 37 145 38 110 C39 78 41 45 40 18"
                  stroke="rgba(201,168,76,0.4)"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                />
                <path
                  d="M39 175 C28 163 16 157 9 150"
                  stroke="rgba(201,168,76,0.3)"
                  strokeWidth="0.9"
                  strokeLinecap="round"
                />
                <path
                  d="M9 150 C4 144 2 137 5 132 C8 127 14 128 19 133 C26 140 35 155 39 168"
                  fill="rgba(201,168,76,0.08)"
                  stroke="rgba(201,168,76,0.28)"
                  strokeWidth="0.7"
                />
                <path
                  d="M39 148 C50 135 62 128 69 120"
                  stroke="rgba(201,168,76,0.28)"
                  strokeWidth="0.9"
                  strokeLinecap="round"
                />
                <path
                  d="M69 120 C74 114 75 107 72 102 C69 97 63 98 58 104 C51 112 43 130 40 145"
                  fill="rgba(201,168,76,0.08)"
                  stroke="rgba(201,168,76,0.26)"
                  strokeWidth="0.7"
                />
                <path
                  d="M39 115 C28 102 16 95 8 87"
                  stroke="rgba(201,168,76,0.26)"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                />
                <path
                  d="M8 87 C3 81 2 73 5 68 C8 63 15 64 20 70 C28 78 36 97 39 112"
                  fill="rgba(201,168,76,0.07)"
                  stroke="rgba(201,168,76,0.23)"
                  strokeWidth="0.7"
                />
                <path
                  d="M40 88 C51 75 62 67 70 58"
                  stroke="rgba(201,168,76,0.25)"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                />
                <path
                  d="M70 58 C75 52 76 44 73 39 C70 34 63 35 58 41 C51 49 43 68 40 85"
                  fill="rgba(201,168,76,0.07)"
                  stroke="rgba(201,168,76,0.22)"
                  strokeWidth="0.7"
                />
                <circle
                  cx="40"
                  cy="15"
                  r="4.5"
                  fill="rgba(201,168,76,0.07)"
                  stroke="rgba(201,168,76,0.38)"
                  strokeWidth="0.9"
                />
                <circle cx="40" cy="15" r="2.2" fill="rgba(201,168,76,0.28)" />
                <circle
                  cx="40"
                  cy="9"
                  r="2.5"
                  fill="rgba(201,168,76,0.1)"
                  stroke="rgba(201,168,76,0.3)"
                  strokeWidth="0.7"
                />
                <circle
                  cx="40"
                  cy="21"
                  r="2.5"
                  fill="rgba(201,168,76,0.1)"
                  stroke="rgba(201,168,76,0.3)"
                  strokeWidth="0.7"
                />
                <circle
                  cx="34"
                  cy="15"
                  r="2.5"
                  fill="rgba(201,168,76,0.1)"
                  stroke="rgba(201,168,76,0.3)"
                  strokeWidth="0.7"
                />
                <circle
                  cx="46"
                  cy="15"
                  r="2.5"
                  fill="rgba(201,168,76,0.1)"
                  stroke="rgba(201,168,76,0.3)"
                  strokeWidth="0.7"
                />
                <circle cx="8" cy="148" r="2" fill="rgba(201,168,76,0.22)" />
                <circle cx="70" cy="118" r="2" fill="rgba(201,168,76,0.22)" />
                <circle cx="7" cy="85" r="1.8" fill="rgba(201,168,76,0.18)" />
                <circle cx="71" cy="56" r="1.8" fill="rgba(201,168,76,0.18)" />
              </svg>
            </div>

            {/* ── Arch doorway — narrow right portrait, rows 5-10 ── */}
            <div
              className="relative overflow-hidden group"
              style={{ gridColumn: "10 / 13", gridRow: "5 / 10" }}
            >
              <img
                src={g4250}
                alt="Charlene in stone arch doorway"
                className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background:
                    "linear-gradient(to top,rgba(10,19,11,0.55) 0%,transparent 50%)",
                }}
              />
              <div className="absolute inset-[8px] border border-[#C9A84C]/0 group-hover:border-[#C9A84C]/22 transition-all duration-700 pointer-events-none" />
            </div>

            {/* ── Colonnade — wide landscape left, rows 10-14 ── */}
            <div
              className="relative overflow-hidden group"
              style={{ gridColumn: "1 / 9", gridRow: "10 / 14" }}
            >
              <img
                src={g4233}
                alt="Charlene walking through garden colonnade"
                className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background:
                    "linear-gradient(to top,rgba(10,19,11,0.5) 0%,transparent 45%)",
                }}
              />
            </div>

            {/* ── Iron gate — right landscape, rows 10-14 ── */}
            <div
              className="relative overflow-hidden group"
              style={{ gridColumn: "9 / 13", gridRow: "10 / 14" }}
            >
              <img
                src={g4378}
                alt="Charlene at the iron gate"
                className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-[8px] border border-[#C9A84C]/0 group-hover:border-[#C9A84C]/22 transition-all duration-700 pointer-events-none" />
            </div>

            {/* ── Floral panel B — landscape bouquet motif left, rows 14-18 ── */}
            <div
              className="relative flex items-center justify-center overflow-hidden bg-[#0A130B]"
              style={{ gridColumn: "1 / 4", gridRow: "14 / 18" }}
            >
              <svg
                viewBox="0 0 160 160"
                fill="none"
                style={{ width: "88%", height: "88%", opacity: 0.9 }}
              >
                <path
                  d="M80 80 C65 68 48 60 33 55 C24 52 15 53 10 58 C5 63 6 71 12 76 C18 81 28 81 40 79 C56 76 72 80 80 82"
                  fill="rgba(201,168,76,0.07)"
                  stroke="rgba(201,168,76,0.3)"
                  strokeWidth="1"
                />
                <path
                  d="M80 80 C95 68 112 60 127 55 C136 52 145 53 150 58 C155 63 154 71 148 76 C142 81 132 81 120 79 C104 76 88 80 80 82"
                  fill="rgba(201,168,76,0.07)"
                  stroke="rgba(201,168,76,0.3)"
                  strokeWidth="1"
                />
                <path
                  d="M80 80 C78 64 72 48 68 34 C65 25 66 15 71 10 C76 5 84 6 88 12 C92 18 91 28 88 40 C84 56 80 72 80 82"
                  fill="rgba(201,168,76,0.07)"
                  stroke="rgba(201,168,76,0.3)"
                  strokeWidth="1"
                />
                <path
                  d="M80 80 C78 96 72 112 68 126 C65 135 66 145 71 150 C76 155 84 154 88 148 C92 142 91 132 88 120 C84 104 80 88 80 82"
                  fill="rgba(201,168,76,0.07)"
                  stroke="rgba(201,168,76,0.3)"
                  strokeWidth="1"
                />
                <rect
                  x="73"
                  y="73"
                  width="14"
                  height="14"
                  transform="rotate(45 80 80)"
                  fill="rgba(201,168,76,0.07)"
                  stroke="rgba(201,168,76,0.45)"
                  strokeWidth="1.1"
                />
                <rect
                  x="76.5"
                  y="76.5"
                  width="7"
                  height="7"
                  transform="rotate(45 80 80)"
                  fill="rgba(201,168,76,0.3)"
                />
                <ellipse
                  cx="12"
                  cy="75"
                  rx="5"
                  ry="2.5"
                  transform="rotate(-15 12 75)"
                  fill="rgba(201,168,76,0.13)"
                  stroke="rgba(201,168,76,0.27)"
                  strokeWidth="0.6"
                />
                <ellipse
                  cx="148"
                  cy="75"
                  rx="5"
                  ry="2.5"
                  transform="rotate(15 148 75)"
                  fill="rgba(201,168,76,0.13)"
                  stroke="rgba(201,168,76,0.27)"
                  strokeWidth="0.6"
                />
                <ellipse
                  cx="71"
                  cy="11"
                  rx="2.5"
                  ry="5"
                  transform="rotate(-10 71 11)"
                  fill="rgba(201,168,76,0.13)"
                  stroke="rgba(201,168,76,0.27)"
                  strokeWidth="0.6"
                />
                <ellipse
                  cx="71"
                  cy="149"
                  rx="2.5"
                  ry="5"
                  transform="rotate(10 71 149)"
                  fill="rgba(201,168,76,0.13)"
                  stroke="rgba(201,168,76,0.27)"
                  strokeWidth="0.6"
                />
                <circle cx="10" cy="58" r="2.2" fill="rgba(201,168,76,0.25)" />
                <circle cx="150" cy="58" r="2.2" fill="rgba(201,168,76,0.25)" />
                <circle cx="71" cy="10" r="2.2" fill="rgba(201,168,76,0.25)" />
                <circle cx="71" cy="150" r="2.2" fill="rgba(201,168,76,0.25)" />
              </svg>
            </div>

            {/* ── Smiling bouquet, rows 14-18 ── */}
            <div
              className="relative overflow-hidden group"
              style={{ gridColumn: "4 / 8", gridRow: "14 / 18" }}
            >
              <img
                src={g4568}
                alt="Charlene smiling holding a bouquet"
                className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-[8px] border border-[#C9A84C]/0 group-hover:border-[#C9A84C]/22 transition-all duration-700 pointer-events-none" />
            </div>

            {/* ── Spinning dancer, rows 14-18 ── */}
            <div
              className="relative overflow-hidden group"
              style={{ gridColumn: "8 / 13", gridRow: "14 / 18" }}
            >
              <img
                src={g5209}
                alt="Charlene spinning joyfully"
                className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background:
                    "linear-gradient(to top,rgba(10,19,11,0.5) 0%,transparent 45%)",
                }}
              />
              <div className="absolute inset-[8px] border border-[#C9A84C]/0 group-hover:border-[#C9A84C]/22 transition-all duration-700 pointer-events-none" />
            </div>

            {/* ── Turning with bouquet — left, rows 18-22 ── */}
            <div
              className="relative overflow-hidden group"
              style={{ gridColumn: "1 / 6", gridRow: "18 / 22" }}
            >
              <img
                src={g4300}
                alt="Charlene turning with bouquet in garden"
                className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background:
                    "linear-gradient(to top,rgba(10,19,11,0.5) 0%,transparent 45%)",
                }}
              />
            </div>

            {/* ── Floral panel C — double branching sprig, rows 18-22 ── */}
            <div
              className="relative flex items-center justify-center overflow-hidden bg-[#0A130B]"
              style={{ gridColumn: "6 / 8", gridRow: "18 / 22" }}
            >
              <svg
                viewBox="0 0 80 180"
                fill="none"
                style={{ width: "70px", height: "auto", opacity: 0.9 }}
              >
                <path
                  d="M40 175 C40 148 40 122 40 96 C40 70 40 44 40 18"
                  stroke="rgba(201,168,76,0.38)"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                />
                <path
                  d="M40 145 C30 135 18 130 10 124"
                  stroke="rgba(201,168,76,0.28)"
                  strokeWidth="0.85"
                  strokeLinecap="round"
                />
                <path
                  d="M10 124 C5 119 3 112 6 107 C9 102 16 103 21 109 C28 116 37 133 40 144"
                  fill="rgba(201,168,76,0.08)"
                  stroke="rgba(201,168,76,0.25)"
                  strokeWidth="0.7"
                />
                <path
                  d="M40 145 C50 135 62 130 70 124"
                  stroke="rgba(201,168,76,0.28)"
                  strokeWidth="0.85"
                  strokeLinecap="round"
                />
                <path
                  d="M70 124 C75 119 77 112 74 107 C71 102 64 103 59 109 C52 116 43 133 40 144"
                  fill="rgba(201,168,76,0.08)"
                  stroke="rgba(201,168,76,0.25)"
                  strokeWidth="0.7"
                />
                <path
                  d="M40 108 C30 97 18 91 10 84"
                  stroke="rgba(201,168,76,0.24)"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                />
                <path
                  d="M10 84 C5 78 3 71 6 66 C9 61 16 62 21 68 C28 76 37 94 40 107"
                  fill="rgba(201,168,76,0.07)"
                  stroke="rgba(201,168,76,0.22)"
                  strokeWidth="0.7"
                />
                <path
                  d="M40 108 C50 97 62 91 70 84"
                  stroke="rgba(201,168,76,0.24)"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                />
                <path
                  d="M70 84 C75 78 77 71 74 66 C71 61 64 62 59 68 C52 76 43 94 40 107"
                  fill="rgba(201,168,76,0.07)"
                  stroke="rgba(201,168,76,0.22)"
                  strokeWidth="0.7"
                />
                <circle
                  cx="40"
                  cy="14"
                  r="5"
                  fill="rgba(201,168,76,0.07)"
                  stroke="rgba(201,168,76,0.38)"
                  strokeWidth="0.9"
                />
                <circle cx="40" cy="14" r="2.3" fill="rgba(201,168,76,0.3)" />
                <circle
                  cx="40"
                  cy="8"
                  r="2.5"
                  fill="rgba(201,168,76,0.1)"
                  stroke="rgba(201,168,76,0.3)"
                  strokeWidth="0.7"
                />
                <circle
                  cx="40"
                  cy="20"
                  r="2.5"
                  fill="rgba(201,168,76,0.1)"
                  stroke="rgba(201,168,76,0.3)"
                  strokeWidth="0.7"
                />
                <circle
                  cx="34"
                  cy="14"
                  r="2.5"
                  fill="rgba(201,168,76,0.1)"
                  stroke="rgba(201,168,76,0.3)"
                  strokeWidth="0.7"
                />
                <circle
                  cx="46"
                  cy="14"
                  r="2.5"
                  fill="rgba(201,168,76,0.1)"
                  stroke="rgba(201,168,76,0.3)"
                  strokeWidth="0.7"
                />
                <circle cx="9" cy="122" r="2" fill="rgba(201,168,76,0.22)" />
                <circle cx="71" cy="122" r="2" fill="rgba(201,168,76,0.22)" />
                <circle cx="9" cy="82" r="1.8" fill="rgba(201,168,76,0.18)" />
                <circle cx="71" cy="82" r="1.8" fill="rgba(201,168,76,0.18)" />
              </svg>
            </div>

            {/* ── Reading in armchair — right, rows 18-22 ── */}
            <div
              className="relative overflow-hidden group"
              style={{ gridColumn: "8 / 13", gridRow: "18 / 22" }}
            >
              <img
                src={g4708}
                alt="Charlene reading in an armchair on the lawn"
                className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-[8px] border border-[#C9A84C]/0 group-hover:border-[#C9A84C]/22 transition-all duration-700 pointer-events-none" />
            </div>
          </div>

          {/* Bottom caption bar */}
          <div className="relative z-10 border-t border-white/[0.06] px-8 py-7 flex items-center justify-between mt-[3px]">
            <OrnamentalRule />
            <p
              className="text-[8px] tracking-[0.4em] text-white/20 uppercase text-center mx-6 flex-shrink-0"
              style={{ fontFamily: "Lato,sans-serif" }}
            >
              Charlene Chelagat Ruto · August 2026
            </p>
            <OrnamentalRule />
          </div>
        </motion.div>

        {/* ── Bible Verse & RSVP ──────────────────────────────────── */}
        <motion.div
          {...stagger(5)}
          className="relative py-24 px-8 overflow-hidden"
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.025]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg,#8B6914 1px,transparent 1px,transparent 22px)",
            }}
          />
          <div className="absolute top-8 left-8 opacity-30">
            <CornerOrnament />
          </div>
          <div className="absolute top-8 right-8 opacity-30">
            <CornerOrnament flip />
          </div>

          <div className="max-w-xl mx-auto text-center relative z-10 py-4">
            <OrnamentalRule className="mx-auto mb-8" wide />

            <blockquote
              className="text-lg sm:text-xl md:text-2xl text-foreground font-semibold leading-relaxed mb-4 px-4"
              style={{
                fontFamily: "Playfair Display,serif",
                fontStyle: "italic",
              }}
            >
              "For he will command his angels concerning you to guard you in all
              your ways"
            </blockquote>
            <p
              className="text-[11px] sm:text-xs tracking-[0.35em] text-accent uppercase font-bold"
              style={{ fontFamily: "Lato,sans-serif" }}
            >
              Psalms 91:11 (NIV)
            </p>

            <div className="mt-10 flex justify-center">
              <DiamondOrnament size={10} opacity={0.35} />
            </div>
          </div>
        </motion.div>

        {/* ── Footer ── */}
        <Footer />
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer
      className="py-8 bg-[#040C06] border-t border-[#C9A84C]/20 text-center text-xs text-muted-foreground/70 flex flex-col items-center justify-center gap-1.5 w-full relative z-20"
      style={{ fontFamily: "Lato, sans-serif" }}
    >
      <p className="tracking-widest uppercase text-muted-foreground">
        Copyright @KittyEvents
      </p>
      <p className="text-[10px] tracking-wider text-[#C9A84C] font-medium">
        Powered by GOODSAM Technologies
      </p>
    </footer>
  );
}

// ─── RSVP Form ─────────────────────────────────────────────────────────────────

function RSVPForm({
  guest,
  pin,
  onConfirmed,
  onBack,
}: {
  guest: GuestRecord;
  pin: string;
  onConfirmed: () => void;
  onBack: () => void;
}) {
  const [form, setForm] = useState({
    attending: "yes" as "yes" | "no",
    guestName: "",
    dietary: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  // Fetch existing guest RSVP directly from PostgreSQL database to pre-fill form
  useEffect(() => {
    let isMounted = true;
    const guestPin = (pin || guest.pin || (guest as any).code || "")
      .toString()
      .trim();
    const guestName = (guest.name || (guest as any).fullName || "")
      .toString()
      .trim()
      .toLowerCase();
    const guestId = (guest as any).id || "";

    fetch("/api/rsvp")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted || !data?.rsvps) return;
        const found = data.rsvps.find((r: any) => {
          if (guestId && r.guestId && r.guestId === guestId) return true;
          if (guestPin && r.pin && r.pin.toString().trim() === guestPin)
            return true;
          if (
            guestName &&
            r.name &&
            r.name.toString().trim().toLowerCase() === guestName
          )
            return true;
          if (
            guestName &&
            r.guestName &&
            r.guestName.toString().trim().toLowerCase() === guestName
          )
            return true;
          return false;
        });

        if (found) {
          setForm({
            attending: found.attending === "yes" ? "yes" : "no",
            guestName: found.guestName || "",
            dietary: found.dietary || "",
            message: found.message || "",
          });
        }
      })
      .catch(() => {
        // Silently default to empty form if fetch fails or no RSVP exists
      });

    return () => {
      isMounted = false;
    };
  }, [guest, pin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const record: RSVPRecord = {
      id: Date.now().toString(),
      pin,
      name: guest.name,
      attending: form.attending,
      guestName: form.guestName,
      dietary: form.dietary,
      message: form.message,
      timestamp: new Date().toISOString(),
    };
    try {
      await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: pin || guest.name,
          attending: form.attending,
          dietary: form.dietary,
          message: form.message,
        }),
      });
    } catch (err) {
      console.error(
        "🔴 [RSVP FORM ERROR] Failed to submit RSVP to database:",
        err,
      );
    }

    setTimeout(onConfirmed, 800);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,#8B6914 1px,transparent 1px,transparent 22px)",
        }}
      />
      <div
        className="absolute top-0 left-0 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle,rgba(26,61,40,0.1) 0%,transparent 70%)",
          transform: "translate(-30%,-30%)",
        }}
      />

      <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 bg-background/85 backdrop-blur-md border-b border-border">
        <button
          onClick={onBack}
          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors tracking-wider uppercase"
          style={{ fontFamily: "Lato,sans-serif" }}
        >
          ← Back
        </button>
        <p
          className="text-[9px] tracking-[0.35em] text-accent uppercase"
          style={{ fontFamily: "Lato,sans-serif" }}
        >
          RSVP
        </p>
        <div className="w-12" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="flex flex-col items-center justify-center px-6 py-28 max-w-md mx-auto"
      >
        <div className="text-center mb-14">
          <DiamondOrnament size={12} opacity={0.6} />
          <p
            className="text-[9px] tracking-[0.4em] text-accent uppercase mt-5 mb-3"
            style={{ fontFamily: "Lato,sans-serif" }}
          >
            Dear{" "}
            {guest.title &&
            !guest.name.toLowerCase().startsWith(guest.title.toLowerCase())
              ? `${guest.title} ${guest.name}`
              : guest.name}
          </p>
          <h2
            className="text-4xl text-foreground"
            style={{ fontFamily: "Great Vibes,cursive" }}
          >
            Will you join us?
          </h2>
          <OrnamentalRule className="mx-auto mt-4" />
          <p
            className="text-xs text-muted-foreground mt-4"
            style={{ fontFamily: "Lato,sans-serif", fontWeight: 300 }}
          >
            8th August 2026 · Intonna Heritage Farm
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-8">
          <div>
            <p
              className="text-[9px] tracking-[0.35em] text-muted-foreground uppercase mb-4"
              style={{ fontFamily: "Lato,sans-serif" }}
            >
              Attendance
            </p>
            <div className="flex gap-2">
              {[
                { v: "yes", l: "Joyfully Accepts" },
                { v: "no", l: "Regretfully Declines" },
              ].map(({ v, l }) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => set("attending", v)}
                  className={`flex-1 py-4 text-[10px] tracking-widest uppercase border transition-all duration-400 ${form.attending === v ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-accent/40"}`}
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p
              className="text-[9px] tracking-[0.35em] text-muted-foreground uppercase mb-4"
              style={{ fontFamily: "Lato,sans-serif" }}
            >
              Dietary Requirements{" "}
              <span className="opacity-40">— optional</span>
            </p>
            <input
              type="text"
              value={form.dietary}
              onChange={(e) => set("dietary", e.target.value)}
              placeholder="e.g. Vegetarian, Halal, Nut allergy"
              className="w-full bg-card border border-border px-5 py-4 text-sm text-foreground focus:outline-none focus:border-accent transition-colors placeholder:text-muted-foreground/40"
              style={{ fontFamily: "Lato,sans-serif" }}
            />
          </div>

          <div>
            <p
              className="text-[9px] tracking-[0.35em] text-muted-foreground uppercase mb-4"
              style={{ fontFamily: "Lato,sans-serif" }}
            >
              Message for Charlene{" "}
              <span className="opacity-40">— optional</span>
            </p>
            <textarea
              rows={4}
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              placeholder="Share your warmest wishes…"
              className="w-full bg-card border border-border px-5 py-4 text-sm text-foreground focus:outline-none focus:border-accent transition-colors placeholder:text-muted-foreground/40 resize-none"
              style={{ fontFamily: "Lato,sans-serif" }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-5 bg-primary text-primary-foreground text-[10px] tracking-[0.4em] uppercase hover:bg-secondary transition-all duration-500 disabled:opacity-60"
            style={{ fontFamily: "Lato,sans-serif" }}
          >
            {submitting ? "Sending…" : "Send Response"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Confirmed Screen ──────────────────────────────────────────────────────────

function ConfirmedScreen({
  guest,
  onBack,
}: {
  guest: GuestRecord;
  onBack: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-8 py-16 text-center relative overflow-hidden">
      <div
        className="absolute inset-4 border pointer-events-none"
        style={{ borderColor: "rgba(201,168,76,0.15)" }}
      />
      <div className="absolute top-8 left-8 opacity-35">
        <CornerOrnament />
      </div>
      <div className="absolute top-8 right-8 opacity-35">
        <CornerOrnament flip />
      </div>
      <div
        className="absolute bottom-8 left-8 opacity-35"
        style={{ transform: "scaleY(-1)" }}
      >
        <CornerOrnament />
      </div>
      <div
        className="absolute bottom-8 right-8 opacity-35"
        style={{ transform: "scale(-1,-1)" }}
      >
        <CornerOrnament flip />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-8 max-w-sm relative z-10"
      >
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            type: "spring",
            stiffness: 180,
          }}
        >
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <circle
              cx="30"
              cy="30"
              r="28"
              fill="none"
              stroke="#C9A84C"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            <circle
              cx="30"
              cy="30"
              r="22"
              fill="none"
              stroke="#C9A84C"
              strokeWidth="0.5"
              strokeOpacity="0.25"
            />
            <polyline
              points="18,30 26,38 42,22"
              stroke="#C9A84C"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </motion.div>

        <div>
          <p
            className="text-[9px] tracking-[0.45em] text-accent uppercase mb-4"
            style={{ fontFamily: "Lato,sans-serif" }}
          >
            Response Received
          </p>
          <h2
            className="text-4xl text-foreground mb-3"
            style={{ fontFamily: "Great Vibes,cursive" }}
          >
            Thank you,{" "}
            {guest.title &&
            !guest.name.toLowerCase().startsWith(guest.title.toLowerCase())
              ? `${guest.title} ${guest.name}`
              : guest.name}
          </h2>
          <OrnamentalRule className="mx-auto mb-6" />
          <p
            className="text-sm text-muted-foreground leading-8"
            style={{ fontFamily: "Lato,sans-serif", fontWeight: 300 }}
          >
            We look forward to celebrating with you on the 8th of August. The
            family of the Rutos send their warmest gratitude.
          </p>
        </div>

        <div className="w-full border border-border bg-card p-6 text-left">
          <p
            className="text-[9px] tracking-[0.35em] text-accent uppercase mb-4"
            style={{ fontFamily: "Lato,sans-serif" }}
          >
            Your Details
          </p>
          {[
            ["Date", "Saturday, 8th August 2026"],
            ["Time", "11:00 A.M."],
            ["Venue", "Intonna Heritage Farm, Kilgoris"],
            ["Reserved", guest.table],
          ].map(([l, v]) => (
            <div
              key={l}
              className="flex justify-between py-2.5 border-b border-border last:border-0"
            >
              <span
                className="text-xs text-muted-foreground"
                style={{ fontFamily: "Lato,sans-serif" }}
              >
                {l}
              </span>
              <span
                className="text-sm text-foreground"
                style={{ fontFamily: "Playfair Display,serif" }}
              >
                {v}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onBack}
          className="text-[10px] text-muted-foreground hover:text-accent transition-colors tracking-widest uppercase"
          style={{ fontFamily: "Lato,sans-serif" }}
        >
          View Full Invitation
        </button>
      </motion.div>
    </div>
  );
}

// ─── Admin Dashboard ───────────────────────────────────────────────────────────

// Re-use StoredGuest as AdminGuest (same shape)
function AdminDashboard({
  onExit,
  adminPermissions = [],
}: {
  onExit: () => void;
  adminPermissions?: string[];
}) {
  const hasPermission = (perm: string) => {
    if (!adminPermissions || adminPermissions.length === 0) return true;
    const normalize = (str: string) =>
      str.toLowerCase().replace(/[^a-z0-9]/g, "");
    const target = normalize(perm);
    return adminPermissions.some((p) => normalize(p) === target);
  };

  const isAssistance = adminPermissions.includes("assistance");

  const [guests, setGuests] = useState<StoredGuest[]>([]);
  const [dbGuests, setDbGuests] = useState<any[]>([]);
  const displayGuests = useMemo(() => {
    return dbGuests.length > 0
      ? dbGuests.map((d) => ({
          pin: d.code,
          name: d.name,
          title: d.title || null,
          country: d.country || null,
          cluster: d.cluster || "Guests",
          role: d.role || "Delegate",
          relation: d.cluster || "Guests",
          table:
            d.table && typeof d.table === "object"
              ? d.table.name
              : d.table || "Unassigned",
          revoked: d.status === "CANCELLED",
          status: d.status,
          id: d.id,
        }))
      : guests;
  }, [dbGuests, guests]);
  const [dbStats, setDbStats] = useState({
    total: 0,
    checkedIn: 0,
    invited: 0,
    cancelled: 0,
  });
  const [rsvps, setRsvps] = useState<RSVPRecord[]>([]);
  const [tab, setTab] = useState<
    | "verify"
    | "guests"
    | "tables"
    | "clusters"
    | "rsvps"
    | "checked_in"
    | "activities"
  >("verify");
  const [activitiesSubTab, setActivitiesSubTab] = useState<
    "roles" | "permissions" | "cluster_permissions"
  >("roles");
  const [adminRoles, setAdminRoles] = useState<any[]>([]);
  const [permissionsList, setPermissionsList] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  // Cluster permissions panel state
  const [clusterPermsData, setClusterPermsData] = useState<{
    clusters: {
      id: string;
      name: string;
      description: string | null;
      permissions: { id: string; name: string; description: string | null }[];
    }[];
    permissions: { id: string; name: string; description: string | null }[];
  } | null>(null);
  const [clusterPermsLoading, setClusterPermsLoading] = useState(false);
  const [selectedClusterForPerms, setSelectedClusterForPerms] = useState<
    string | null
  >(null);
  const [togglingPerm, setTogglingPerm] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newPermName, setNewPermName] = useState("");
  const [newPermDesc, setNewPermDesc] = useState("");
  const [savingRole, setSavingRole] = useState(false);
  const [savingPerm, setSavingPerm] = useState(false);
  const [newGuest, setNewGuest] = useState({
    pin: "",
    name: "",
    relation: "",
    table: "",
  });
  const [showAdd, setShowAdd] = useState(false);

  // Titles State
  const [titles, setTitles] = useState<any[]>([]);

  // Create Guest Modal State
  const [showCreateGuestModal, setShowCreateGuestModal] = useState(false);
  const [createGuestForm, setCreateGuestForm] = useState({
    titleId: "",
    title: "",
    name: "",
    clusterId: "",
    cluster: "Guests",
    phone: "",
  });
  const [savingCreateGuest, setSavingCreateGuest] = useState(false);

  const handleCreateGuestSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nameTrimmed = createGuestForm.name.trim();
    if (!nameTrimmed) {
      alert("Guest name is required.");
      return;
    }

    setSavingCreateGuest(true);
    try {
      const res = await fetch("/api/delegates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameTrimmed,
          titleId: createGuestForm.titleId || null,
          title: createGuestForm.title || null,
          clusterId: createGuestForm.clusterId || null,
          cluster: createGuestForm.cluster || "Guests",
          phone: createGuestForm.phone.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create guest");

      setShowCreateGuestModal(false);
      setCreateGuestForm({
        titleId: "",
        title: "",
        name: "",
        clusterId: "",
        cluster: "Guests",
        phone: "",
      });
      await refreshAllData();
    } catch (err: any) {
      alert(err?.message || "Failed to create guest");
    } finally {
      setSavingCreateGuest(false);
    }
  };

  // Edit Guest Modal State
  const [editingGuest, setEditingGuest] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    pin: "",
    name: "",
    title: "",
    phone: "",
    cluster: "",
    clusterId: "",
    country: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const handleSaveEdit = async () => {
    if (!editingGuest?.id) {
      alert("Guest record missing ID for edit.");
      return;
    }
    const nameTrimmed = editForm.name.trim();
    if (!nameTrimmed) {
      alert("Name cannot be blank.");
      return;
    }

    setSavingEdit(true);
    try {
      const res = await fetch(
        `/api/delegates/${encodeURIComponent(String(editingGuest.id))}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pin: editForm.pin.trim() || null,
            name: nameTrimmed,
            title: editForm.title.trim() || null,
            phone: editForm.phone.trim() || null,
            cluster: editForm.cluster.trim() || null,
            clusterId: editForm.clusterId || null,
            country: editForm.country.trim() || null,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Update failed");
      const updated = data.delegate;

      const newPin = editForm.pin.trim() || null;
      const newPhone = editForm.phone.trim() || null;
      const newName = nameTrimmed;
      const newTitle = editForm.title.trim() || null;
      const newCluster = editForm.cluster.trim() || null;
      const newClusterId = editForm.clusterId || null;
      const newCountry = editForm.country.trim() || null;

      setRegistryDelegates((prev) =>
        prev.map((d) =>
          d.id === editingGuest.id
            ? {
                ...d,
                pin: updated.pin || updated.code || newPin || d.pin,
                code: updated.code || updated.pin || newPin || d.code,
                name: updated.name || newName,
                title: updated.title !== undefined ? updated.title : newTitle,
                phone: updated.phone !== undefined ? updated.phone : newPhone,
                cluster:
                  updated.cluster !== undefined ? updated.cluster : newCluster,
                clusterId:
                  updated.clusterId !== undefined
                    ? updated.clusterId
                    : newClusterId,
                country:
                  updated.country !== undefined ? updated.country : newCountry,
              }
            : d,
        ),
      );

      setDbGuests((prev) =>
        prev.map((d) =>
          d.id === editingGuest.id
            ? {
                ...d,
                pin: updated.pin || updated.code || newPin || d.pin,
                code: updated.code || updated.pin || newPin || d.code,
                name: updated.name || newName,
                title: updated.title !== undefined ? updated.title : newTitle,
                phone: updated.phone !== undefined ? updated.phone : newPhone,
                cluster:
                  updated.cluster !== undefined ? updated.cluster : newCluster,
                clusterId:
                  updated.clusterId !== undefined
                    ? updated.clusterId
                    : newClusterId,
                country:
                  updated.country !== undefined ? updated.country : newCountry,
              }
            : d,
        ),
      );

      setEditingGuest(null);
    } catch (err: any) {
      alert(err?.message || "Failed to update guest details");
    } finally {
      setSavingEdit(false);
    }
  };

  // Clusters State
  const [clusters, setClusters] = useState<any[]>([]);
  const [newCluster, setNewCluster] = useState({ name: "", description: "" });
  const [showAddCluster, setShowAddCluster] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<any>(null);
  const [clusterLoading, setClusterLoading] = useState(false);

  // Attendance Verification State
  const [verifySearch, setVerifySearch] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResults, setVerifyResults] = useState<any[]>([]);
  const [selectedDelegate, setSelectedDelegate] = useState<any>(null);
  const [verifyMessage, setVerifyMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Tables & Import State
  const [tables, setTables] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [reconcilingPendingRsvp, setReconcilingPendingRsvp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tableFileInputRef = useRef<HTMLInputElement>(null);
  const pendingRsvpUploadRef = useRef<HTMLInputElement>(null);

  // Seating & Table Assignment State
  const [selectedAssignmentTable, setSelectedAssignmentTable] = useState<
    any | null
  >(null);
  const [assignmentClusterId, setAssignmentClusterId] = useState<string>("ALL");
  const [assignmentSearch, setAssignmentSearch] = useState<string>("");
  const [tableSearch, setTableSearch] = useState<string>("");
  const [assigningGuestId, setAssigningGuestId] = useState<string | null>(null);
  const assignmentPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedAssignmentTable && assignmentPanelRef.current) {
      assignmentPanelRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedAssignmentTable]);

  const handleAssignGuestToTable = async (
    guestId: string,
    targetTableId: string | null,
    seatNumber?: number | null,
  ) => {
    setAssigningGuestId(guestId);
    try {
      const res = await fetch("/api/seating/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId,
          tableId: targetTableId,
          seatNumber: seatNumber ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to update guest seating assignment.");
        return;
      }

      // Refresh tables, guests & clusters synchronously
      const [tRes, gRes, cRes] = await Promise.all([
        fetch("/api/tables"),
        fetch("/api/delegates?limit=ALL"),
        fetch("/api/clusters"),
      ]);

      const tData = await tRes.json();
      const gData = await gRes.json();
      const cData = await cRes.json();

      if (tData.tables) {
        setTables(tData.tables);
        if (selectedAssignmentTable) {
          const updatedTable = tData.tables.find(
            (tbl: any) => tbl.id === selectedAssignmentTable.id,
          );
          if (updatedTable) setSelectedAssignmentTable(updatedTable);
        }
      }
      if (gData.delegates) setDbGuests(gData.delegates);
      if (cData.clusters) {
        setClusters(cData.clusters);
        if (selectedCluster) {
          const updatedCls = cData.clusters.find(
            (c: any) => c.id === selectedCluster.id,
          );
          if (updatedCls) setSelectedCluster(updatedCls);
        }
      }
    } catch (err) {
      console.error("🔴 [ASSIGN SEATING ERROR]:", err);
      alert("Error assigning guest to table.");
    } finally {
      setAssigningGuestId(null);
    }
  };

  const tableStats = useMemo(() => {
    const totalTables = tables.length;
    let fullySeated = 0;
    let withVacancy = 0;
    let totalSeats = 0;
    let seatedGuests = 0;

    tables.forEach((tbl) => {
      const cap = tbl.capacity || 0;
      const assigned =
        tbl.delegates && Array.isArray(tbl.delegates)
          ? tbl.delegates.length
          : dbGuests.filter(
              (d: any) => d.tableId === tbl.id || d.table?.id === tbl.id,
            ).length;

      totalSeats += cap;
      seatedGuests += assigned;

      if (cap > 0 && assigned >= cap) {
        fullySeated++;
      } else {
        withVacancy++;
      }
    });

    const vacantSeats = Math.max(0, totalSeats - seatedGuests);

    return {
      totalTables,
      fullySeated,
      withVacancy,
      totalSeats,
      seatedGuests,
      vacantSeats,
    };
  }, [tables, dbGuests]);

  const [rsvpSearch, setRsvpSearch] = useState("");
  const [rsvpClusterFilter, setRsvpClusterFilter] = useState("ALL");
  const [rsvpDelegates, setRsvpDelegates] = useState<any[]>([]);

  // Pagination State for Guest Registry
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [registrySearch, setRegistrySearch] = useState("");
  const [registryClusterFilter, setRegistryClusterFilter] = useState("ALL");
  const [rsvpStatusTab, setRsvpStatusTab] = useState<
    "PENDING" | "CARD_SENT" | "ATTENDING" | "NOT_ATTENDING"
  >("PENDING");

  const checkedInGuests = useMemo(() => {
    const source = dbGuests.length > 0 ? dbGuests : displayGuests;
    return source.filter(
      (g: any) => g.status === "CHECKED_IN" || g.checkedIn === true,
    );
  }, [dbGuests, displayGuests]);

  useEffect(() => {
    if (tab !== "rsvps") return;
    const controller = new AbortController();
    const trimmedSearch = rsvpSearch.trim();
    const clusterFilterValue = (rsvpClusterFilter || "ALL").trim();
    const url = `/api/delegates?search=${encodeURIComponent(trimmedSearch)}&cluster=${encodeURIComponent(clusterFilterValue)}&limit=ALL`;

    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (controller.signal.aborted) return;
        if (data?.delegates) {
          setRsvpDelegates(data.delegates);
        }
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        console.error("API error loading RSVP delegates:", err);
      });

    return () => controller.abort();
  }, [tab, rsvpSearch, rsvpClusterFilter]);

  const attendingRsvps = useMemo(
    () => rsvps.filter((r) => r.attending === "yes"),
    [rsvps],
  );
  const notAttendingRsvps = useMemo(
    () => rsvps.filter((r) => r.attending === "no"),
    [rsvps],
  );
  const cardSentRsvps = useMemo(
    () => rsvps.filter((r) => r.cardSent || r.cardSentAt),
    [rsvps],
  );
  const pendingRsvpGuests = useMemo(() => {
    const respondedSet = new Set<string>();
    rsvps.forEach((r) => {
      if (
        r.attending === "yes" ||
        r.attending === "no" ||
        (r as any).attending === "ATTENDING" ||
        (r as any).attending === "NOT_ATTENDING"
      ) {
        if (r.guestId) respondedSet.add(String(r.guestId));
        if (r.pin) respondedSet.add(r.pin.toLowerCase().trim());
        if (r.name) respondedSet.add(r.name.toLowerCase().trim());
      }
    });

    const pool =
      (rsvpClusterFilter !== "ALL" || rsvpSearch.trim() !== "") &&
      rsvpDelegates.length > 0
        ? rsvpDelegates
        : dbGuests.length > 0
          ? dbGuests
          : displayGuests;

    return pool.filter((g) => {
      const gId = g.id ? String(g.id) : "";
      const gPin = (g.pin || g.code || "").toLowerCase().trim();
      const gName = (g.name || g.fullName || "").toLowerCase().trim();
      const rsvpStatus = (g as any).rsvpStatus || (g as any).rsvp?.status;
      if (rsvpStatus === "ATTENDING" || rsvpStatus === "NOT_ATTENDING") {
        return false;
      }
      const hasResponded =
        (gId && respondedSet.has(gId)) ||
        (gPin && respondedSet.has(gPin)) ||
        (gName && respondedSet.has(gName));

      return !hasResponded;
    });
  }, [
    rsvps,
    rsvpDelegates,
    dbGuests,
    displayGuests,
    rsvpClusterFilter,
    rsvpSearch,
  ]);

  const [markingCardSent, setMarkingCardSent] = useState<string | null>(null);

  // Fetch live PostgreSQL database delegates, tables, clusters & RSVPs
  const refreshAllData = async () => {
    try {
      const limitStr = pageSize >= 99999 ? "ALL" : pageSize.toString();
      const clusterFilterValue = (registryClusterFilter || "ALL").trim();
      const [dRes, tRes, cRes, rRes, regRes, titlesRes] = await Promise.all([
        fetch("/api/delegates?limit=ALL"),
        fetch("/api/tables"),
        fetch("/api/clusters"),
        fetch("/api/rsvp"),
        fetch(
          `/api/delegates?search=${encodeURIComponent(registrySearch.trim())}&cluster=${encodeURIComponent(clusterFilterValue)}&page=${currentPage}&limit=${limitStr}`,
        ),
        fetch("/api/titles"),
      ]);

      const [dData, tData, cData, rData, regData, titlesData] =
        await Promise.all([
          dRes.json(),
          tRes.json(),
          cRes.json(),
          rRes.json(),
          regRes.json(),
          titlesRes.json(),
        ]);

      if (dData.delegates) {
        setDbGuests(dData.delegates);
        if (dData.stats) setDbStats(dData.stats);
      }
      if (tData) {
        const list = Array.isArray(tData) ? tData : tData.tables || [];
        setTables(list);
      }
      if (cData.clusters) setClusters(cData.clusters);
      if (rData.rsvps && Array.isArray(rData.rsvps)) setRsvps(rData.rsvps);
      if (titlesData?.titles) setTitles(titlesData.titles);

      if (regData.delegates) {
        setRegistryDelegates(
          regData.delegates.map((d: any) => ({
            pin: d.code,
            name: d.name,
            title: d.title || null,
            country: d.country || null,
            phone: d.phone || null,
            cluster: d.cluster || "Guests",
            role: d.role || "Delegate",
            relation: d.cluster || "Guests",
            table:
              typeof d.table === "object"
                ? d.table?.name
                : d.table || "Unassigned",
            revoked: d.status === "CANCELLED",
            status: d.status,
            id: d.id,
          })),
        );
        setRegistryTotalPages(regData.totalPages || 1);
        setRegistryTotalCount(regData.total || regData.delegates.length);
      }
    } catch (err) {
      console.error("🔴 [DATABASE REFRESH ERROR] Error refreshing data:", err);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const handleMarkCardSent = async (g: any) => {
    const targetId = g.id || g.guestId;
    const targetPin = g.pin || g.code;
    const targetName = g.name || g.fullName;
    const key = targetId || targetPin || targetName;

    setMarkingCardSent(key);
    try {
      const res = await fetch("/api/rsvp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId: targetId,
          pin: targetPin,
          guestName: targetName,
          sentBy: "Admin",
        }),
      });
      if (res.ok) {
        await refreshAllData();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to mark card sent");
      }
    } catch {
      alert("Network error marking card sent");
    } finally {
      setMarkingCardSent(null);
    }
  };

  const handleAddCluster = async () => {
    if (!newCluster.name.trim()) return;
    setClusterLoading(true);
    try {
      const res = await fetch("/api/clusters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCluster),
      });
      const data = await res.json();
      if (res.ok) {
        setClusters((prev) => [
          ...prev,
          { ...data, guestCount: 0, guests: [] },
        ]);
        setNewCluster({ name: "", description: "" });
        setShowAddCluster(false);
      } else {
        alert(data.error || "Failed to create cluster");
      }
    } catch (err) {
      alert("Error creating cluster");
    } finally {
      setClusterLoading(false);
    }
  };

  const handleDeleteCluster = async (id: string) => {
    if (!confirm("Are you sure you want to delete this cluster?")) return;
    try {
      const res = await fetch(`/api/clusters?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setClusters((prev) => prev.filter((c) => c.id !== id));
        if (selectedCluster?.id === id) setSelectedCluster(null);
      }
    } catch (err) {
      alert("Failed to delete cluster");
    }
  };

  const handleExportGuestsToExcel = async () => {
    const clusterFilterValue = (registryClusterFilter || "ALL").trim();
    const filterByCluster = (guests: any[]) => {
      if (clusterFilterValue === "ALL") return guests;
      return guests.filter((g: any) => {
        const guestCluster =
          typeof g.cluster === "string"
            ? g.cluster
            : g.cluster?.name || g.cluster || "";
        return (
          guestCluster.toLowerCase().trim() === clusterFilterValue.toLowerCase()
        );
      });
    };

    try {
      let exportData = filterByCluster(
        dbGuests.length > 0 ? dbGuests : displayGuests,
      );
      if (!exportData || exportData.length === 0) {
        const fetchUrl =
          clusterFilterValue !== "ALL"
            ? `/api/delegates?limit=ALL&cluster=${encodeURIComponent(clusterFilterValue)}`
            : "/api/delegates?limit=ALL";
        const res = await fetch(fetchUrl);
        const data = await res.json();
        if (data.delegates) exportData = filterByCluster(data.delegates);
      }

      if (!exportData || exportData.length === 0) {
        alert("No guest records available to export.");
        return;
      }

      const rows = exportData.map((g: any, idx: number) => {
        const isObj = Boolean(g.table && typeof g.table === "object");
        const tableName = isObj
          ? g.table.name
          : typeof g.table === "string"
            ? g.table
            : g.tableName || "Unassigned";

        const isChecked = g.status === "CHECKED_IN";
        const rsvpStatus =
          g.rsvpStatus || (g.status === "CANCELLED" ? "DECLINED" : "PENDING");
        const displayName = getGuestDisplayName(g);

        return {
          "No.": idx + 1,
          "PIN / Code": g.code || g.pin || "",
          Name: displayName,
          Phone: g.phone || "",
          "County / Country": g.country || "",
          "Cluster / Category": g.cluster || "Guests",
          Role: g.role || "Delegate",
          Table: tableName,
          "Seat Number": g.seatNumber || "N/A",
          "Attendance Status": isChecked ? "CHECKED IN" : g.status || "INVITED",
          "RSVP Status": rsvpStatus,
          "Dietary Requirements": g.dietary || "",
        };
      });

      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.json_to_sheet(rows);

      worksheet["!cols"] = [
        { wch: 6 }, // No.
        { wch: 12 }, // PIN / Code
        { wch: 28 }, // Name
        { wch: 16 }, // Phone
        { wch: 18 }, // County / Country
        { wch: 20 }, // Cluster / Category
        { wch: 16 }, // Role
        { wch: 22 }, // Table
        { wch: 12 }, // Seat Number
        { wch: 20 }, // Attendance Status
        { wch: 15 }, // RSVP Status
        { wch: 25 }, // Dietary Requirements
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Guests List");

      const dateStr = new Date().toISOString().split("T")[0];
      const sanitizedCluster =
        clusterFilterValue === "ALL"
          ? ""
          : `_${clusterFilterValue.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
      XLSX.writeFile(
        workbook,
        `Guests_List${sanitizedCluster}_${dateStr}.xlsx`,
      );
    } catch (err) {
      console.error("🔴 [EXPORT EXCEL ERROR]:", err);
      const clusterFilterValue = (registryClusterFilter || "ALL").trim();
      const exportData = filterByCluster(
        dbGuests.length > 0 ? dbGuests : displayGuests,
      );
      if (!exportData || exportData.length === 0) return;
      const headers = [
        "No.",
        "PIN Code",
        "Name",
        "Phone",
        "County/Country",
        "Cluster",
        "Role",
        "Table",
        "Seat Number",
        "Attendance Status",
        "RSVP Status",
        "Dietary",
      ];
      const csvRows = [headers.join(",")];
      exportData.forEach((g: any, idx: number) => {
        const isObj = Boolean(g.table && typeof g.table === "object");
        const tableName = isObj
          ? g.table.name
          : typeof g.table === "string"
            ? g.table
            : g.tableName || "Unassigned";
        const isChecked = g.status === "CHECKED_IN";
        const displayName = getGuestDisplayName(g);
        const row = [
          idx + 1,
          `"${g.code || g.pin || ""}"`,
          `"${displayName.replace(/"/g, '""')}"`,
          `"${(g.phone || "").replace(/"/g, '""')}"`,
          `"${(g.country || "").replace(/"/g, '""')}"`,
          `"${(g.cluster || "Guests").replace(/"/g, '""')}"`,
          `"${(g.role || "Delegate").replace(/"/g, '""')}"`,
          `"${tableName.replace(/"/g, '""')}"`,
          `"${g.seatNumber || "N/A"}"`,
          `"${isChecked ? "CHECKED IN" : g.status || "INVITED"}"`,
          `"${(g.rsvpStatus || "PENDING").replace(/"/g, '""')}"`,
          `"${(g.dietary || "").replace(/"/g, '""')}"`,
        ];
        csvRows.push(row.join(","));
      });
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `Guests_List_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
    }
  };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/delegates/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        await refreshAllData();
        alert(
          data.message ||
            `Successfully imported ${data.addedCount || data.count || "delegates"}!`,
        );
      } else {
        alert(data.error || "Failed to import file.");
      }
    } catch (err) {
      console.error("🔴 [EXCEL IMPORT ERROR]:", err);
      alert("Error uploading file.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePendingRsvpUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReconcilingPendingRsvp(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/rsvp/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        await refreshAllData();
        console.log(
          `[Pending RSVP Upload] totalRows=${data.totalRows}, totalYesRows=${data.totalYesRows}, processed=${data.processed}, updated=${data.updated}, skippedAlreadyRsvp=${data.skippedAlreadyRsvp}, notFound=${data.notFound}`,
        );
        alert(data.message || "Pending RSVP reconciliation completed.");
      } else {
        alert(data.error || "Failed to reconcile pending RSVP upload.");
      }
    } catch (err) {
      console.error("🔴 [PENDING RSVP RECONCILIATION ERROR]:", err);
      alert("Error processing pending RSVP upload.");
    } finally {
      setReconcilingPendingRsvp(false);
      if (pendingRsvpUploadRef.current) pendingRsvpUploadRef.current.value = "";
    }
  };

  const handleTableFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/tables/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        await refreshAllData();
        alert(data.message || "Successfully imported venue tables!");
      } else {
        alert(data.error || "Failed to import tables file.");
      }
    } catch (err) {
      console.error("🔴 [TABLES EXCEL IMPORT ERROR]:", err);
      alert("Error uploading tables file.");
    } finally {
      setImporting(false);
      if (tableFileInputRef.current) tableFileInputRef.current.value = "";
    }
  };

  const [selectedTableId, setSelectedTableId] = useState<string>("");

  const selectDelegateForCheckin = (del: any) => {
    setSelectedDelegate(del);
    setSelectedTableId(
      del.tableId
        ? del.tableId.toString()
        : del.table?.id
          ? del.table.id.toString()
          : "",
    );
  };

  // Camera Scanner State
  const [cameraActive, setCameraActive] = useState(false);
  const html5QrCodeInstance = useRef<any>(null);

  useEffect(() => {
    let isCancelled = false;

    if (cameraActive) {
      const getMedia = (constraints: any) =>
        navigator.mediaDevices?.getUserMedia
          ? navigator.mediaDevices.getUserMedia(constraints)
          : Promise.reject(new Error("NO_MEDIA_DEVICES"));

      getMedia({ video: { facingMode: { ideal: "environment" } } })
        .catch(() => getMedia({ video: true }))
        .then((stream) => {
          stream.getTracks().forEach((track) => track.stop());
          if (!isCancelled) {
            startQrScanner();
          }
        })
        .catch((err) => {
          console.warn("getUserMedia camera permission error:", err);
          if (isCancelled) return;
          let msg =
            "Could not access camera. Please grant camera permission in your browser.";
          if (
            err.name === "NotAllowedError" ||
            err.name === "PermissionDeniedError"
          ) {
            msg =
              "Camera permission denied. Tap the lock icon in your browser address bar to Allow Camera access.";
          } else if (
            err.name === "NotFoundError" ||
            err.name === "DevicesNotFoundError"
          ) {
            msg = "No camera hardware detected on this device.";
          } else if (
            window.location.protocol !== "https:" &&
            window.location.hostname !== "localhost"
          ) {
            msg =
              "Mobile browsers require HTTPS or Chrome Site Settings permission to enable camera over Wi-Fi IP.";
          }
          setVerifyMessage({ type: "error", text: msg });
          setCameraActive(false);
        });
    }

    function startQrScanner() {
      import("html5-qrcode").then(
        ({ Html5Qrcode, Html5QrcodeScannerState }) => {
          if (isCancelled) return;
          const readerElem = document.getElementById("reader");
          if (!readerElem) return;

          try {
            if (html5QrCodeInstance.current) {
              try {
                const state = html5QrCodeInstance.current.getState();
                if (
                  state === Html5QrcodeScannerState.SCANNING ||
                  state === Html5QrcodeScannerState.PAUSED
                ) {
                  html5QrCodeInstance.current.stop().catch(() => {});
                }
              } catch (_) {}
              html5QrCodeInstance.current = null;
            }

            const qrScanner = new Html5Qrcode("reader");
            html5QrCodeInstance.current = qrScanner;

            qrScanner
              .start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                async (decodedText) => {
                  setVerifySearch(decodedText);
                  try {
                    const state = qrScanner.getState();
                    if (
                      state === Html5QrcodeScannerState.SCANNING ||
                      state === Html5QrcodeScannerState.PAUSED
                    ) {
                      await qrScanner.stop();
                    }
                  } catch (_) {}
                  html5QrCodeInstance.current = null;
                  setCameraActive(false);
                },
                () => {},
              )
              .catch(() => {
                if (!isCancelled) {
                  setVerifyMessage({
                    type: "error",
                    text: "Could not access camera scanner. Please grant camera permission in your browser.",
                  });
                  setCameraActive(false);
                }
              });
          } catch (e) {
            console.warn("Failed to initialize QR scanner:", e);
          }
        },
      );
    }

    return () => {
      isCancelled = true;
      if (html5QrCodeInstance.current) {
        const inst = html5QrCodeInstance.current;
        html5QrCodeInstance.current = null;
        try {
          const state = inst.getState ? inst.getState() : 0;
          if (state === 2 || state === 3) {
            inst.stop().catch(() => {});
          }
        } catch (_) {}
      }
    };
  }, [cameraActive]);

  // Pure API-driven Verification Desk search as user types
  const [verifyCandidates, setVerifyCandidates] = useState<any[]>([]);
  const [verifySearchLoading, setVerifySearchLoading] = useState(false);
  const [verifyHasSearched, setVerifyHasSearched] = useState(false);

  useEffect(() => {
    const q = verifySearch.trim();
    if (!q) {
      setVerifyCandidates([]);
      setSelectedDelegate(null);
      setVerifyHasSearched(false);
      setVerifyMessage(null);
      return;
    }

    const isExactLookup = /^[A-Za-z0-9]{4}$/.test(q);
    if (!isExactLookup) {
      setVerifyCandidates([]);
      setSelectedDelegate(null);
      setVerifyHasSearched(false);
      setVerifyMessage(null);
      return;
    }

    setVerifySearchLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/delegates/scan/${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data) => {
          const list = data.matches || (data.delegate ? [data.delegate] : []);
          setVerifyCandidates(list);
          setVerifyHasSearched(true);
          if (list.length > 0) {
            setSelectedDelegate(list[0]);
            setSelectedTableId(
              list[0].tableId
                ? list[0].tableId.toString()
                : list[0].table?.id
                  ? list[0].table.id.toString()
                  : "",
            );
            setVerifyMessage(null);
          } else {
            setSelectedDelegate(null);
            setVerifyMessage({
              type: "error",
              text: `⚠️ Unrecognized QR Code / Code: "${q}" was not found in the guest registry.`,
            });
          }
        })
        .catch(() => {
          setVerifyHasSearched(true);
          setSelectedDelegate(null);
          setVerifyMessage({
            type: "error",
            text: `⚠️ Network error verifying code "${q}". Please try again.`,
          });
        })
        .finally(() => {
          setVerifySearchLoading(false);
        });
    }, 150);

    return () => clearTimeout(timer);
  }, [verifySearch]);

  // Pure API-driven Guest Registry list & pagination
  const [registryDelegates, setRegistryDelegates] = useState<any[]>([]);
  const [registryTotalPages, setRegistryTotalPages] = useState(1);
  const [registryTotalCount, setRegistryTotalCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const trimmedSearch = registrySearch.trim();
    const clusterFilterValue = (registryClusterFilter || "ALL").trim();
    const limitStr = pageSize >= 99999 ? "ALL" : pageSize.toString();
    const url = `/api/delegates?search=${encodeURIComponent(trimmedSearch)}&cluster=${encodeURIComponent(clusterFilterValue)}&page=${currentPage}&limit=${limitStr}`;

    const loadRegistry = async () => {
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Registry request failed with status ${res.status}`);
        }

        const data = await res.json();
        if (controller.signal.aborted) return;

        if (data?.delegates) {
          setRegistryDelegates(
            data.delegates.map((d: any) => ({
              pin: d.code,
              name: d.name,
              title: d.title || null,
              country: d.country || null,
              phone: d.phone || null,
              cluster: d.cluster || "Guests",
              clusterId: d.clusterId || null,
              role: d.role || "Delegate",
              relation: d.cluster || "Guests",
              table:
                typeof d.table === "object"
                  ? d.table?.name
                  : d.table || "Unassigned",
              revoked: d.status === "CANCELLED",
              status: d.status,
              id: d.id,
            })),
          );
          setRegistryTotalPages(data.totalPages || 1);
          setRegistryTotalCount(data.total || data.delegates.length);
        } else {
          setRegistryDelegates([]);
          setRegistryTotalPages(1);
          setRegistryTotalCount(0);
        }
      } catch (err: any) {
        if (err?.name === "AbortError" || controller.signal.aborted) return;
        console.error("API error loading registry:", err);
      }
    };

    loadRegistry();

    return () => controller.abort();
  }, [registrySearch, registryClusterFilter, currentPage, pageSize]);

  // Auto-select candidate from API results when typing (prioritize exact 4-character match)
  useEffect(() => {
    const trimmed = verifySearch.trim();
    if (verifyCandidates.length > 0) {
      const exactMatch = verifyCandidates.find(
        (c: any) =>
          String(c.code || c.pin || "").toLowerCase() === trimmed.toLowerCase(),
      );
      const target = exactMatch || verifyCandidates[0];
      setSelectedDelegate(target);
      setSelectedTableId(
        target.tableId
          ? target.tableId.toString()
          : target.table?.id
            ? target.table.id.toString()
            : "",
      );
    } else if (trimmed) {
      setSelectedDelegate(null);
    }
  }, [verifySearch, verifyCandidates]);

  const handleCheckin = async (delegate: any) => {
    if (!delegate) return;
    setVerifyLoading(true);
    setVerifyMessage(null);
    try {
      const payload: any = {
        delegateId: delegate.id,
        code: delegate.code,
      };
      if (selectedTableId) {
        payload.tableId = parseInt(selectedTableId);
      }
      const res = await fetch("/api/delegates/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && (data.checkedIn || data.delegate)) {
        const updated = data.delegate || {
          ...delegate,
          status: "CHECKED_IN",
          checkedIn: true,
        };
        setSelectedDelegate(updated);
        setVerifyMessage({
          type: "success",
          text: `✓ Attendance confirmed for ${updated.name} (#${updated.code})!`,
        });
        setVerifyResults((prev) =>
          prev.map((d) =>
            d.id === delegate.id ? { ...d, status: "CHECKED_IN" } : d,
          ),
        );
        setVerifyCandidates((prev) =>
          prev.map((d) =>
            d.id === delegate.id ||
            (d.code && d.code === (delegate.code || delegate.pin))
              ? { ...d, status: "CHECKED_IN", checkedIn: true }
              : d,
          ),
        );
        setRegistryDelegates((prev) =>
          prev.map((d) =>
            d.id === delegate.id || d.pin === (delegate.code || delegate.pin)
              ? { ...d, status: "CHECKED_IN" }
              : d,
          ),
        );
        // Refresh db list & tables
        fetch("/api/delegates?limit=ALL")
          .then((r) => r.json())
          .then((d) => {
            if (d.delegates) setDbGuests(d.delegates);
            if (d.stats) setDbStats(d.stats);
          });
        fetch("/api/tables")
          .then((r) => r.json())
          .then((d) => {
            if (d.tables) setTables(d.tables);
          });
      } else {
        setVerifyMessage({
          type: "error",
          text: data.error || "Failed to confirm attendance.",
        });
      }
    } catch (err) {
      setVerifyMessage({
        type: "error",
        text: "Network error confirming attendance.",
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleRevokeCheckin = async (delegate: any) => {
    if (!delegate) return;
    setVerifyLoading(true);
    setVerifyMessage(null);
    try {
      const res = await fetch("/api/delegates/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delegateId: delegate.id,
          code: delegate.code || delegate.pin,
          action: "revoke",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setVerifyMessage({
          type: "success",
          text: `✓ Check-in revoked for ${delegate.name || delegate.fullName || "guest"}.`,
        });
        setVerifyCandidates((prev) =>
          prev.map((d) =>
            d.id === delegate.id ||
            (d.code && d.code === (delegate.code || delegate.pin))
              ? { ...d, status: "INVITED", checkedIn: false }
              : d,
          ),
        );
        setRegistryDelegates((prev) =>
          prev.map((d) =>
            d.id === delegate.id || d.pin === (delegate.code || delegate.pin)
              ? { ...d, status: "INVITED", checkedIn: false }
              : d,
          ),
        );
        // Refresh db list & tables
        fetch("/api/delegates?limit=ALL")
          .then((r) => r.json())
          .then((d) => {
            if (d.delegates) setDbGuests(d.delegates);
            if (d.stats) setDbStats(d.stats);
          });
        fetch("/api/tables")
          .then((r) => r.json())
          .then((d) => {
            if (d.tables) setTables(d.tables);
          });
      } else {
        setVerifyMessage({
          type: "error",
          text: data.error || "Failed to revoke check-in.",
        });
      }
    } catch (err) {
      setVerifyMessage({
        type: "error",
        text: "Network error revoking check-in.",
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleAddGuestDirect = async () => {
    if (!newGuest.name) return;
    try {
      const res = await fetch("/api/delegates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGuest.name,
          code: newGuest.pin || undefined,
          role: (newGuest as any).role || "Delegate",
          cluster: (newGuest as any).cluster || "Guests",
          tableId: newGuest.table || undefined,
        }),
      });
      if (res.ok) {
        fetch("/api/delegates?limit=ALL")
          .then((r) => r.json())
          .then((d) => {
            if (d.delegates) setDbGuests(d.delegates);
            if (d.stats) setDbStats(d.stats);
          });
        setNewGuest({ pin: "", name: "", relation: "", table: "" });
        setShowAdd(false);
      }
    } catch (err) {
      console.error("🔴 Error adding guest directly to PostgreSQL:", err);
    }
  };

  const handleClearRegistry = async () => {
    if (
      !confirm(
        "Are you sure you want to clear all imported delegates? (System Admin account will be preserved).",
      )
    )
      return;
    try {
      const res = await fetch("/api/delegates?resetAll=true", {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshAllData();
        alert("Registry cleared. You can now re-import your clean Excel file!");
      }
    } catch (err) {
      alert("Failed to clear registry");
    }
  };

  const handleClearTables = async () => {
    if (!confirm("Are you sure you want to clear all registered venue tables?"))
      return;
    try {
      const res = await fetch("/api/tables?resetAll=true", {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshAllData();
        alert(
          "All venue tables cleared! You can now re-import your Table_Chair_Capacity file.",
        );
      }
    } catch (err) {
      alert("Failed to clear tables.");
    }
  };

  const getGuestClusterName = (g: any) => {
    if (!g) return "";
    if (typeof g.cluster === "string" && g.cluster.trim())
      return g.cluster.trim();
    if (g.cluster && typeof g.cluster === "object" && g.cluster.name)
      return String(g.cluster.name).trim();
    if (g.clusterName && typeof g.clusterName === "string")
      return g.clusterName.trim();
    if (g.relation && typeof g.relation === "string") return g.relation.trim();
    return "";
  };

  const matchesGuestCluster = (g: any, selectedClusterFilter: string) => {
    if (!selectedClusterFilter || selectedClusterFilter === "ALL") return true;
    const target = selectedClusterFilter.trim().toLowerCase();
    if (!target) return true;

    const cName = getGuestClusterName(g).toLowerCase();
    const cId = (typeof g.cluster === "object" ? g.cluster?.id : "")
      ?.trim()
      .toLowerCase();
    const clusterIdDirect = (g.clusterId || "")?.trim().toLowerCase();

    if (!cName && !cId && !clusterIdDirect) return false;

    return (
      (cName.length > 0 && cName === target) ||
      (cId && cId === target) ||
      (clusterIdDirect && clusterIdDirect === target)
    );
  };

  const getClusterForRsvp = (r: any) => {
    if (r.cluster) return r.cluster;
    const foundGuest = dbGuests.find(
      (g: any) =>
        (r.guestId && String(g.id) === String(r.guestId)) ||
        (r.pin &&
          String(g.pin || g.code)
            .toLowerCase()
            .trim() === String(r.pin).toLowerCase().trim()) ||
        (r.name &&
          String(g.name).toLowerCase().trim() ===
            String(r.name).toLowerCase().trim()),
    );
    return foundGuest ? foundGuest.cluster : "Guests";
  };

  const filteredPendingRsvpGuests = useMemo(() => {
    return pendingRsvpGuests.filter((g: any) => {
      const q = rsvpSearch.trim().toLowerCase();
      const gName = (g.name || g.fullName || "").toLowerCase();
      const gPin = (g.pin || g.code || "").toLowerCase();
      const gPhone = (g.phone || "").toLowerCase();
      const matchesSearch =
        !q || gName.includes(q) || gPin.includes(q) || gPhone.includes(q);

      const matchesCluster = matchesGuestCluster(g, rsvpClusterFilter);

      return matchesSearch && matchesCluster;
    });
  }, [pendingRsvpGuests, rsvpSearch, rsvpClusterFilter]);

  const filteredAttendingRsvps = useMemo(() => {
    return attendingRsvps.filter((r: any) => {
      const q = rsvpSearch.trim().toLowerCase();
      const rName = (r.name || "").toLowerCase();
      const rPin = (r.pin || "").toLowerCase();
      const rPhone = (r.phone || "").toLowerCase();
      const matchesSearch =
        !q || rName.includes(q) || rPin.includes(q) || rPhone.includes(q);

      const clusterObjOrStr = getClusterForRsvp(r);
      const matchesCluster = matchesGuestCluster(
        { cluster: clusterObjOrStr },
        rsvpClusterFilter,
      );

      return matchesSearch && matchesCluster;
    });
  }, [attendingRsvps, dbGuests, rsvpSearch, rsvpClusterFilter]);

  const filteredNotAttendingRsvps = useMemo(() => {
    return notAttendingRsvps.filter((r: any) => {
      const q = rsvpSearch.trim().toLowerCase();
      const rName = (r.name || "").toLowerCase();
      const rPin = (r.pin || "").toLowerCase();
      const rPhone = (r.phone || "").toLowerCase();
      const matchesSearch =
        !q || rName.includes(q) || rPin.includes(q) || rPhone.includes(q);

      const clusterObjOrStr = getClusterForRsvp(r);
      const matchesCluster = matchesGuestCluster(
        { cluster: clusterObjOrStr },
        rsvpClusterFilter,
      );

      return matchesSearch && matchesCluster;
    });
  }, [notAttendingRsvps, dbGuests, rsvpSearch, rsvpClusterFilter]);

  const [rsvpModalGuest, setRsvpModalGuest] = useState<any | null>(null);
  const [submittingRsvp, setSubmittingRsvp] = useState<string | null>(null);

  const handleAdminRsvpForGuest = (g: any) => {
    setRsvpModalGuest(g);
  };

  const handleConfirmAdminRsvp = async (
    guest: any,
    attendingChoice: "yes" | "no",
  ) => {
    const gName = guest.name || guest.fullName || "Guest";
    const gPin = guest.pin || guest.code || gName;
    const gId = guest.id || undefined;

    setSubmittingRsvp(attendingChoice);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId: gId,
          code: gPin,
          guestName: gName,
          attending: attendingChoice,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to record RSVP");
      setRsvpModalGuest(null);
      await refreshAllData();
    } catch (err: any) {
      alert(err?.message || "Failed to record RSVP");
    } finally {
      setSubmittingRsvp(null);
    }
  };

  const exportCSV = () => {
    const csv = [
      "Name,PIN,Attending,Guests,Dietary,Message,Timestamp",
      ...rsvps.map(
        (r) =>
          `"${r.name}","${r.pin}","${r.attending}","${r.guestName}","${r.dietary}","${r.message}","${r.timestamp}"`,
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "koito-rsvps.csv";
    a.click();
  };

  const exportPendingRsvpExcel = () => {
    const rowsXml = filteredPendingRsvpGuests
      .map((g) => {
        const name = String(g.name || g.fullName || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        const rawCluster =
          g.cluster && typeof g.cluster === "object"
            ? g.cluster.name
            : typeof g.cluster === "string"
              ? g.cluster
              : "Guests";
        const clusterName = String(rawCluster || "Guests")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        const phone = String(g.phone || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        const pin = String(g.pin || g.code || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        const rawTable =
          g.table && typeof g.table === "object"
            ? g.table.name
            : typeof g.table === "string"
              ? g.table
              : "Unassigned";
        const tableName = String(rawTable || "Unassigned")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        return `<tr><td>${name}</td><td>${clusterName}</td><td>${phone}</td><td>${pin}</td><td>${tableName}</td></tr>`;
      })
      .join("");

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/vnd.ms-excel; charset=UTF-8">
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Pending RSVPs</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      </head>
      <body>
        <table border="1">
          <thead>
            <tr style="background-color: #07130A; color: #C9A84C; font-weight: bold;">
              <th>Name</th>
              <th>Cluster</th>
              <th>Phone Number</th>
              <th>PIN Code</th>
              <th>Table</th>
            </tr>
          </thead>
          <tbody>
            ${rowsXml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([template], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "koito-pending-rsvps.xls";
    a.click();
  };

  return (
    <div className="min-h-screen bg-primary text-primary-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-8 md:px-12 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-4">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            {[0, 60, 120, 180, 240, 300].map((a, i) => (
              <line
                key={i}
                x1={14 + 11 * Math.cos((a * Math.PI) / 180)}
                y1={14 + 11 * Math.sin((a * Math.PI) / 180)}
                x2={14 + 5 * Math.cos((a * Math.PI) / 180)}
                y2={14 + 5 * Math.sin((a * Math.PI) / 180)}
                stroke="#C9A84C"
                strokeWidth="1"
                strokeOpacity="0.7"
              />
            ))}
            <circle cx="14" cy="14" r="4" fill="#C9A84C" fillOpacity="0.8" />
            <circle
              cx="14"
              cy="14"
              r="11"
              fill="none"
              stroke="#C9A84C"
              strokeWidth="0.7"
              strokeOpacity="0.4"
            />
          </svg>
          <div>
            <p
              className="text-[9px] tracking-[0.35em] text-accent uppercase"
              style={{ fontFamily: "Lato,sans-serif" }}
            >
              Administration
            </p>
            <h1
              className="text-lg text-primary-foreground"
              style={{ fontFamily: "Great Vibes,cursive" }}
            >
              Koito ak Chaik
            </h1>
          </div>
        </div>
        <button
          onClick={onExit}
          className="flex items-center gap-2 text-[10px] text-primary-foreground/50 hover:text-primary-foreground transition-colors tracking-widest uppercase cursor-pointer"
          style={{ fontFamily: "Lato,sans-serif" }}
        >
          <LogOut size={13} /> Exit
        </button>
      </div>

      {/* Stats - Compact for phone screens */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-px bg-sidebar-border border-b border-sidebar-border">
        {(isAssistance
          ? [
              {
                label: "Total Guests",
                value: dbGuests.length > 0 ? dbStats.total : guests.length,
              },
              {
                label: "Checked In",
                value: dbGuests.length > 0 ? dbStats.checkedIn : 0,
              },
            ]
          : [
              {
                label: "Total Guests",
                value: dbGuests.length > 0 ? dbStats.total : guests.length,
              },
              {
                label: "Checked In",
                value: dbGuests.length > 0 ? dbStats.checkedIn : 0,
              },
              {
                label: "Pending Checkin",
                value:
                  dbGuests.length > 0
                    ? dbStats.invited
                    : guests.filter((g) => !g.revoked).length,
              },
              {
                label: "RSVPs Received",
                value: attendingRsvps.length + notAttendingRsvps.length,
              },
              { label: "Total Tables", value: tableStats.totalTables },
              {
                label: "Table Status",
                value: `${tableStats.fullySeated} Full / ${tableStats.withVacancy} Open`,
              },
              { label: "Total Seats", value: tableStats.totalSeats },
              {
                label: "Vacant Seats",
                value: `${tableStats.vacantSeats} Available`,
              },
            ]
        ).map(({ label, value }) => (
          <div key={label} className="bg-primary px-3 py-3 md:px-5 md:py-4">
            <p
              className="text-[8px] tracking-[0.2em] text-accent uppercase mb-1"
              style={{ fontFamily: "Lato,sans-serif" }}
            >
              {label}
            </p>
            <p className="text-lg md:text-xl text-primary-foreground font-serif truncate">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-sidebar-border px-4 md:px-12 overflow-x-auto scrollbar-none">
        {(
          [
            ["verify", "Attendance Verification", "check_in"],
            ["guests", "Guest Registry & PINs", "view_guests"],
            ["tables", "Venue Tables", "assign_tables"],
            ["clusters", "Clusters", null],
            ["rsvps", "RSVPs", null],
            ["checked_in", "Checked In", null],
            ["activities", "Admin Activities", "access_admin_activities"],
          ] as const
        )
          .filter(([t, , perm]) => {
            if (isAssistance) return t === "verify";
            if (!perm) return true; // no permission guard
            if (t === "activities") {
              return (
                adminPermissions.length === 0 ||
                hasPermission("access_admin_activities") ||
                hasPermission("view_admin")
              );
            }
            return adminPermissions.length === 0 || hasPermission(perm);
          })
          .map(([t, l]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 md:px-6 py-3 md:py-4 text-[10px] tracking-widest uppercase border-b-2 whitespace-nowrap transition-colors cursor-pointer ${tab === t ? "border-accent text-accent font-semibold" : "border-transparent text-primary-foreground/40 hover:text-primary-foreground/70"}`}
              style={{ fontFamily: "Lato,sans-serif" }}
            >
              {l}
            </button>
          ))}
      </div>

      <div className="px-4 md:px-12 py-6">
        {tab === "verify" && (
          <div className="space-y-2">
            <div className="p-3 bg-primary/20 border border-sidebar-border space-y-2">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Type the full 4-character guest code or pin..."
                  value={verifySearch}
                  onChange={(e) => {
                    const v = e.target.value;
                    setVerifySearch(v);
                    setVerifyCandidates([]);
                    setSelectedDelegate(null);
                    setVerifyHasSearched(false);
                    setVerifyMessage(null);
                  }}
                  className="flex-1 bg-primary border border-sidebar-border px-3.5 py-2.5 text-xs text-primary-foreground placeholder:text-primary-foreground/30 focus:outline-none focus:border-accent"
                  style={{ fontFamily: "Lato,sans-serif" }}
                />
                <button
                  onClick={() => setCameraActive(!cameraActive)}
                  className="py-2.5 px-3.5 border border-accent/40 text-accent text-[10px] font-bold uppercase tracking-wider hover:bg-accent/10 transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  <Camera size={13} />
                  {cameraActive ? "Close" : "QR Camera"}
                </button>
              </div>

              {cameraActive && (
                <div className="p-2 border border-amber-500/50 bg-amber-950/30 rounded flex flex-col gap-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] tracking-widest text-amber-300 font-bold uppercase flex items-center gap-1.5">
                      <Camera
                        size={12}
                        className="animate-pulse text-amber-400"
                      />
                      NO MATCH — SCANNING FOR QR CODE...
                    </span>
                  </div>
                  <div id="reader" className="w-full min-h-[180px]" />
                </div>
              )}

              {verifySearch.trim().length > 0 &&
                /^[A-Za-z0-9]{1,3}$/.test(verifySearch.trim()) &&
                !verifySearchLoading && (
                  <div
                    className="p-2 px-3 text-[11px] border border-sidebar-border bg-primary/10 text-primary-foreground/70"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    Enter the full 4-character guest code or pin to lookup the
                    guest.
                  </div>
                )}

              {verifyMessage && (
                <div
                  className={`p-2 px-3 text-[11px] border font-medium ${verifyMessage.type === "success" ? "border-accent/40 text-accent bg-accent/10" : "border-red-900/40 text-red-400 bg-red-950/20"}`}
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  {verifyMessage.text}
                </div>
              )}
            </div>

            {/* Red Alert Box when NO MATCH FOUND */}
            {verifySearch.trim() !== "" &&
              (!/^\d+$/.test(verifySearch.trim()) ||
                verifySearch.trim().length >= 4) &&
              !verifySearchLoading &&
              verifyHasSearched &&
              verifyCandidates.length === 0 && (
                <div className="p-2.5 px-3.5 border border-red-500/80 bg-red-950/50 rounded flex items-center gap-2.5 text-red-400 text-xs shadow-md">
                  <AlertTriangle
                    size={16}
                    className="text-red-400 flex-shrink-0"
                  />
                  <span
                    className="font-bold uppercase tracking-wider text-red-300"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    NO MATCH FOUND FOR "{verifySearch.trim()}"
                  </span>
                </div>
              )}

            {/* Sleek Minimal Match Display */}
            {verifyCandidates.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {verifyCandidates.map((d: any) => {
                  const isChecked = d.status === "CHECKED_IN";
                  return isChecked ? (
                    <div
                      key={d.id || d.pin || d.code}
                      className="p-2.5 px-3.5 border border-emerald-500/60 bg-emerald-950/40 rounded flex items-center justify-between text-emerald-300 text-xs shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle
                          size={15}
                          className="text-emerald-400 flex-shrink-0"
                        />
                        <span
                          className="font-bold uppercase tracking-wider text-emerald-200"
                          style={{ fontFamily: "Lato,sans-serif" }}
                        >
                          CONFIRMED — {d.name} (#{d.code || d.pin})
                        </span>
                        <span
                          className="text-[10px] text-emerald-400/80 hidden sm:inline"
                          style={{ fontFamily: "Lato,sans-serif" }}
                        >
                          · Cluster: {d.cluster || "General"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className="text-[9px] tracking-widest uppercase px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold"
                          style={{ fontFamily: "Lato,sans-serif" }}
                        >
                          ✓ CONFIRMED
                        </span>
                        <button
                          onClick={() => handleRevokeCheckin(d)}
                          disabled={verifyLoading}
                          className="px-2 py-1 text-[9px] text-amber-300/80 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 uppercase tracking-wider transition-colors cursor-pointer"
                          style={{ fontFamily: "Lato,sans-serif" }}
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={d.id || d.pin || d.code}
                      className="p-2.5 px-3.5 border border-accent/60 bg-accent/10 rounded flex items-center justify-between text-xs gap-3 shadow-sm"
                    >
                      <div>
                        <span
                          className="text-sm text-primary-foreground font-bold"
                          style={{ fontFamily: "Playfair Display,serif" }}
                        >
                          {d.name}
                        </span>
                        <span
                          className="text-[10px] text-accent font-mono ml-2.5"
                          style={{ fontFamily: "DM Mono,monospace" }}
                        >
                          #{d.code || d.pin} · {d.cluster || "General"}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCheckin(d)}
                        disabled={
                          verifyLoading ||
                          (adminPermissions.length > 0 &&
                            !hasPermission("check_in") &&
                            !adminPermissions.includes("assistance"))
                        }
                        className={`px-4 py-1.5 bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-accent/80 transition-colors border border-accent flex items-center gap-1 flex-shrink-0 ${adminPermissions.length > 0 && !hasPermission("check_in") && !adminPermissions.includes("assistance") ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                        style={{ fontFamily: "Lato,sans-serif" }}
                        title={
                          adminPermissions.length > 0 &&
                          !hasPermission("check_in") &&
                          !adminPermissions.includes("assistance")
                            ? "Check-in permission required"
                            : undefined
                        }
                      >
                        <CheckCircle size={13} />
                        {verifyLoading ? "Confirming..." : "Confirm"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "guests" && (
          <>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                <input
                  type="text"
                  placeholder="Filter registry via API (Name, Code, Role)..."
                  value={registrySearch}
                  onChange={(e) => {
                    setRegistrySearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex-1 bg-primary border border-sidebar-border px-4 py-2 text-xs text-primary-foreground placeholder:text-primary-foreground/25 focus:outline-none focus:border-accent"
                  style={{ fontFamily: "Lato,sans-serif" }}
                />
                <select
                  value={registryClusterFilter}
                  onChange={(e) => {
                    setRegistryClusterFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-primary border border-sidebar-border px-3 py-2 text-xs text-primary-foreground focus:outline-none focus:border-accent"
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  <option value="ALL">All Clusters</option>
                  {clusters.map((cls: any) => (
                    <option key={cls.id} value={cls.name}>
                      {cls.name}
                    </option>
                  ))}
                </select>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-primary border border-sidebar-border px-3 py-2 text-xs text-primary-foreground focus:outline-none focus:border-accent"
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  <option value={10}>10 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                  <option value={1000}>1000 / page</option>
                  <option value={99999}>
                    All Guests ({registryTotalCount})
                  </option>
                </select>
              </div>

              <div className="flex gap-3 items-center flex-wrap">
                {(adminPermissions.length === 0 ||
                  hasPermission("export_sheets")) &&
                  !isAssistance && (
                    <button
                      onClick={handleExportGuestsToExcel}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-800/90 hover:bg-emerald-700 text-white text-[10px] tracking-wider uppercase border border-emerald-500/50 transition-colors cursor-pointer font-bold shadow-sm"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      <FileSpreadsheet size={13} /> Export Guests (Excel)
                    </button>
                  )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.xlsx,.xls,.pdf"
                  className="hidden"
                />
                {(adminPermissions.length === 0 ||
                  hasPermission("import_sheets")) &&
                  !isAssistance && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={importing}
                      className="flex items-center gap-2 px-5 py-2.5 border border-sidebar-border text-accent text-[10px] tracking-wider uppercase hover:bg-accent/10 transition-colors cursor-pointer font-medium disabled:opacity-50"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      <Download size={12} className="rotate-180" />{" "}
                      {importing
                        ? "Uploading Sheet..."
                        : "Import Guest Sheet (CSV / Excel)"}
                    </button>
                  )}
                {/* 
                {(adminPermissions.length === 0 || hasPermission("clear_registry")) && !isAssistance && (
                  <button
                    onClick={handleClearRegistry}
                    className="flex items-center gap-2 px-4 py-2.5 border border-rose-500/40 text-rose-400 text-[10px] tracking-wider uppercase hover:bg-rose-500/10 transition-colors cursor-pointer font-medium"
                    style={{ fontFamily: "Lato,sans-serif" }}
                    title="Clear all imported delegates to re-import fresh"
                  >
                    <Trash2 size={12} /> Clear Registry
                  </button>
                )}
                */}

                {(adminPermissions.length === 0 ||
                  hasPermission("edit_guests")) &&
                  !isAssistance && (
                    <button
                      onClick={() => {
                        const defaultTitleObj = titles.find(
                          (t: any) =>
                            t.name?.toLowerCase() === "mr." ||
                            t.name?.toLowerCase() === "mr",
                        );
                        const defaultClusterObj = clusters.find(
                          (c: any) =>
                            c.name?.toLowerCase() === "guest" ||
                            c.name?.toLowerCase() === "guests",
                        );
                        setCreateGuestForm({
                          titleId: defaultTitleObj ? defaultTitleObj.id : "",
                          title: defaultTitleObj ? defaultTitleObj.name : "Mr.",
                          name: "",
                          clusterId: defaultClusterObj
                            ? defaultClusterObj.id
                            : clusters[0]?.id || "",
                          cluster: defaultClusterObj
                            ? defaultClusterObj.name
                            : "Guests",
                          phone: "",
                        });
                        setShowCreateGuestModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-accent text-accent-foreground text-[10px] tracking-wider uppercase hover:bg-accent/80 transition-colors cursor-pointer font-bold"
                      style={{ fontFamily: "Lato,sans-serif" }}
                      title="Create a new guest record"
                    >
                      <UserPlus size={12} /> Create Guest
                    </button>
                  )}
                {(adminPermissions.length === 0 ||
                  hasPermission("download_pdf")) &&
                  !isAssistance && (
                    <button
                      onClick={() =>
                        window.open("/api/delegates/pdf/zip", "_blank")
                      }
                      className="flex items-center gap-2 px-5 py-2.5 border border-sidebar-border text-accent text-[10px] tracking-wider uppercase hover:bg-accent/10 transition-colors cursor-pointer"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      <Download size={12} /> Download PDF Badges (ZIP)
                    </button>
                  )}
              </div>
            </div>

            <AnimatePresence>
              {showAdd &&
                !isAssistance &&
                (adminPermissions.length === 0 ||
                  hasPermission("edit_guests")) && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-4 p-6 border border-sidebar-border bg-secondary/20 grid grid-cols-2 gap-3"
                  >
                    {[
                      ["pin", "PIN (4 digits)"],
                      ["name", "Guest Name"],
                      ["relation", "Relation"],
                      ["table", "Table"],
                    ].map(([k, pl]) => (
                      <input
                        key={k}
                        placeholder={pl}
                        value={(newGuest as Record<string, string>)[k]}
                        onChange={(e) =>
                          setNewGuest((g) => ({ ...g, [k]: e.target.value }))
                        }
                        maxLength={k === "pin" ? 4 : undefined}
                        className="bg-primary border border-sidebar-border px-4 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/25 focus:outline-none focus:border-accent"
                        style={{ fontFamily: "Lato,sans-serif" }}
                      />
                    ))}
                    <button
                      onClick={handleAddGuestDirect}
                      className="py-3 bg-accent text-accent-foreground text-[10px] uppercase tracking-wider hover:bg-accent/80 transition-colors cursor-pointer font-bold"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowAdd(false)}
                      className="py-3 border border-sidebar-border text-primary-foreground/50 text-[10px] uppercase tracking-wider hover:text-primary-foreground transition-colors cursor-pointer"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      Cancel
                    </button>
                  </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-px">
              {registryDelegates.length === 0 && displayGuests.length === 0 && (
                <div
                  className="p-8 text-center text-primary-foreground/40 border border-sidebar-border text-xs tracking-wide"
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  No delegates found in registry. Click "Import Guest Sheet" or
                  "Add Guest" to add delegates.
                </div>
              )}
              {(registryDelegates.length > 0
                ? registryDelegates
                : displayGuests
              ).map((g) => {
                const isChecked = g.status === "CHECKED_IN";
                return (
                  <div
                    key={guestKey(g.pin, g.name)}
                    className={`flex items-center gap-4 px-5 py-4 border transition-all ${isChecked ? "bg-emerald-950/15 border-emerald-500/30" : "bg-primary/20 border-sidebar-border"}`}
                  >
                    <span
                      className="text-accent text-sm w-14 flex-shrink-0 font-medium"
                      style={{ fontFamily: "DM Mono,monospace" }}
                    >
                      {g.pin}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm text-primary-foreground truncate"
                        style={{ fontFamily: "Playfair Display,serif" }}
                      >
                        {g.title &&
                        !g.name
                          .toLowerCase()
                          .startsWith(g.title.toLowerCase()) ? (
                          <span className="text-accent font-semibold mr-1.5">
                            {g.title}
                          </span>
                        ) : null}
                        {g.name}
                      </p>
                      <p
                        className="text-[9px] text-primary-foreground/40 mt-0.5"
                        style={{ fontFamily: "Lato,sans-serif" }}
                      >
                        Cluster:{" "}
                        <span className="text-accent font-semibold">
                          {g.cluster || "Guests"}
                        </span>
                        {g.phone && (
                          <span>
                            {" "}
                            · Phone:{" "}
                            <span className="text-primary-foreground/80 font-medium">
                              {g.phone}
                            </span>
                          </span>
                        )}
                        {(g as any).country && (
                          <span>
                            {" "}
                            · County/Country:{" "}
                            <span className="text-primary-foreground/80 font-medium">
                              {(g as any).country}
                            </span>
                          </span>
                        )}
                        <span> · {g.table}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-[9px] tracking-widest uppercase px-2.5 py-1 border font-black ${
                          isChecked
                            ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm"
                            : "bg-amber-950/20 text-amber-400/80 border-amber-500/30"
                        }`}
                        style={{ fontFamily: "Lato,sans-serif" }}
                      >
                        {isChecked ? "✓ CHECKED IN" : "INVITED"}
                      </span>

                      {!isChecked && !g.revoked && (
                        <button
                          onClick={() =>
                            handleCheckin({
                              id: g.id,
                              code: g.pin,
                              name: g.name,
                            })
                          }
                          disabled={verifyLoading}
                          className="px-3 py-1 bg-accent text-accent-foreground text-[9px] font-bold uppercase tracking-wider hover:bg-accent/80 transition-colors cursor-pointer border border-accent"
                          style={{ fontFamily: "Lato,sans-serif" }}
                        >
                          Confirm
                        </button>
                      )}
                      {!isChecked && (
                        <button
                          onClick={() => handleAdminRsvpForGuest(g)}
                          className="px-3 py-1 bg-accent/20 text-accent hover:bg-accent/40 border border-accent/40 text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          style={{ fontFamily: "Lato,sans-serif" }}
                          title="RSVP for this guest"
                        >
                          RSVP
                        </button>
                      )}
                      {/* Edit button placed next to Confirm for quick edits */}
                      {!isChecked && g.id && (
                        <button
                          onClick={() => {
                            setEditingGuest(g);
                            const matchedCls = clusters.find(
                              (c: any) =>
                                (g.clusterId && c.id === g.clusterId) ||
                                c.name?.toLowerCase() ===
                                  (g.cluster || "").toLowerCase(),
                            );
                            setEditForm({
                              pin: g.pin || g.code || "",
                              name: g.name || g.fullName || "",
                              title: g.title || "",
                              phone: g.phone || "",
                              cluster: matchedCls
                                ? matchedCls.name
                                : g.cluster || "",
                              clusterId: matchedCls
                                ? matchedCls.id
                                : g.clusterId || "",
                              country: (g as any).country || "",
                            });
                          }}
                          className="px-3 py-1 ml-2 border border-sidebar-border text-[9px] uppercase tracking-wider hover:text-accent hover:border-accent transition-colors cursor-pointer"
                          style={{ fontFamily: "Lato,sans-serif" }}
                          title="Edit guest details (Name, Title, Phone, Cluster, Country)"
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {((g as any).rsvpStatus === "ATTENDING" ||
                      rsvps.some(
                        (r) => r.name === g.name && r.attending === "yes",
                      )) && (
                      <span
                        className="text-[8px] tracking-widest text-emerald-400 uppercase px-2 py-1 border border-emerald-500/30 flex-shrink-0"
                        style={{ fontFamily: "Lato,sans-serif" }}
                      >
                        RSVP Accepted
                      </span>
                    )}
                    {((g as any).rsvpStatus === "NOT_ATTENDING" ||
                      rsvps.some(
                        (r) => r.name === g.name && r.attending === "no",
                      )) && (
                      <span
                        className="text-[8px] tracking-widest text-rose-400 uppercase px-2 py-1 border border-rose-500/30 flex-shrink-0"
                        style={{ fontFamily: "Lato,sans-serif" }}
                      >
                        RSVP Declined
                      </span>
                    )}
                    {g.revoked && (
                      <span
                        className="text-[8px] text-destructive-foreground/50 uppercase tracking-wider flex-shrink-0"
                        style={{ fontFamily: "Lato,sans-serif" }}
                      >
                        Revoked
                      </span>
                    )}
                    <div className="flex gap-4 items-center flex-shrink-0">
                      {g.id && (
                        <button
                          onClick={() =>
                            window.open(`/api/delegates/${g.id}/pdf`, "_blank")
                          }
                          className="flex items-center gap-1 text-[9px] text-accent hover:underline uppercase tracking-wider cursor-pointer"
                          style={{ fontFamily: "Lato,sans-serif" }}
                          title="Print PDF Badge"
                        >
                          <Download size={11} /> PDF
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (isChecked) {
                            handleRevokeCheckin({
                              id: g.id,
                              code: g.pin,
                              name: g.name,
                            });
                          } else {
                            setGuests(
                              guests.map((x) =>
                                guestKey(x.pin, x.name) ===
                                guestKey(g.pin, g.name)
                                  ? { ...x, revoked: !x.revoked }
                                  : x,
                              ),
                            );
                          }
                        }}
                        className="text-[9px] text-primary-foreground/35 hover:text-accent transition-colors uppercase tracking-wider cursor-pointer"
                        style={{ fontFamily: "Lato,sans-serif" }}
                      >
                        {isChecked
                          ? "Revoke Check-in"
                          : g.revoked
                            ? "Restore"
                            : "Revoke"}
                      </button>
                      {(adminPermissions.length === 0 ||
                        hasPermission("general_delete")) &&
                        !isAssistance && (
                          <button
                            onClick={() =>
                              setGuests(
                                guests.filter(
                                  (x) =>
                                    guestKey(x.pin, x.name) !==
                                    guestKey(g.pin, g.name),
                                ),
                              )
                            }
                            className="text-primary-foreground/25 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-6 border-t border-sidebar-border mt-6">
              <p
                className="text-[10px] text-primary-foreground/40"
                style={{ fontFamily: "Lato,sans-serif" }}
              >
                Showing{" "}
                {Math.min(registryTotalCount, (currentPage - 1) * pageSize + 1)}{" "}
                - {Math.min(registryTotalCount, currentPage * pageSize)} of{" "}
                {registryTotalCount} guests
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-sidebar-border text-[10px] uppercase text-primary-foreground/60 disabled:opacity-30 hover:border-accent hover:text-accent transition-colors"
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  Previous
                </button>
                <span
                  className="text-xs text-accent font-mono px-2"
                  style={{ fontFamily: "DM Mono,monospace" }}
                >
                  Page {currentPage} of {registryTotalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(registryTotalPages, p + 1))
                  }
                  disabled={currentPage === registryTotalPages}
                  className="px-4 py-2 border border-sidebar-border text-[10px] uppercase text-primary-foreground/60 disabled:opacity-30 hover:border-accent hover:text-accent transition-colors"
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

        {tab === "tables" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-primary/30 p-6 border border-sidebar-border flex-wrap gap-4">
              <div>
                <p
                  className="text-[9px] tracking-[0.35em] text-accent uppercase font-extrabold"
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  Venue Seating Management
                </p>
                <p
                  className="text-sm text-primary-foreground/60 mt-1"
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  {tables.length} Tables Registered · {tableStats.seatedGuests}{" "}
                  / {tableStats.totalSeats} Guests Seated (
                  {tableStats.vacantSeats} Vacant Seats)
                </p>
              </div>

              <div className="flex gap-3 items-center flex-wrap">
                {/* Table Search Input */}
                <input
                  type="text"
                  placeholder="🔍 Search tables by number or zone (e.g. 10, Table 100)..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="bg-primary/80 border border-sidebar-border px-4 py-2.5 text-xs text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:border-accent rounded w-full md:w-80"
                  style={{ fontFamily: "Lato,sans-serif" }}
                />

                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  ref={tableFileInputRef}
                  onChange={handleTableFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => tableFileInputRef.current?.click()}
                  disabled={importing}
                  className="flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground text-[10px] tracking-wider uppercase hover:bg-accent/80 transition-colors cursor-pointer font-semibold"
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  <Download size={12} />{" "}
                  {importing
                    ? "Importing..."
                    : "Import Venue Tables (CSV / Excel)"}
                </button>
                {(adminPermissions.length === 0 ||
                  hasPermission("general_delete")) && (
                  <button
                    onClick={handleClearTables}
                    className="flex items-center gap-2 px-5 py-3 border border-rose-500/40 text-rose-400 text-[10px] tracking-wider uppercase hover:bg-rose-500/10 transition-colors cursor-pointer font-medium"
                    style={{ fontFamily: "Lato,sans-serif" }}
                    title="Clear all registered venue tables"
                  >
                    <Trash2 size={12} /> Clear All Tables
                  </button>
                )}
              </div>
            </div>

            {/* Dedicated Table Seating & Cluster Assignment Panel */}
            {selectedAssignmentTable && (
              <div
                ref={assignmentPanelRef}
                className="p-6 border-2 border-accent/60 bg-primary/40 space-y-6 rounded-xl shadow-2xl transition-all"
              >
                {/* Panel Header */}
                <div className="flex justify-between items-start border-b border-sidebar-border pb-4 flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 bg-accent text-accent-foreground text-[9px] font-extrabold uppercase tracking-widest rounded">
                        Active Assignment Mode
                      </span>
                      <span className="text-xs text-primary-foreground/60 font-mono">
                        Zone: {selectedAssignmentTable.zone || "Main Zone"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <h3
                        className="text-2xl text-primary-foreground font-bold"
                        style={{ fontFamily: "Playfair Display,serif" }}
                      >
                        {selectedAssignmentTable.name} Seating Assignment
                      </h3>

                      {/* Quick Table Switcher */}
                      <select
                        value={selectedAssignmentTable.id}
                        onChange={(e) => {
                          const target = tables.find(
                            (t: any) => t.id === e.target.value,
                          );
                          if (target) {
                            setSelectedAssignmentTable(target);
                            setAssignmentClusterId("ALL");
                            setAssignmentSearch("");
                          }
                        }}
                        className="bg-primary/90 border border-accent/60 text-xs text-accent font-bold px-3 py-1.5 rounded focus:outline-none focus:border-accent cursor-pointer"
                        style={{ fontFamily: "Lato,sans-serif" }}
                      >
                        {tables.map((t: any) => {
                          const seated = dbGuests.filter(
                            (d: any) =>
                              d.tableId === t.id || d.table?.id === t.id,
                          ).length;
                          return (
                            <option key={t.id} value={t.id}>
                              Switch Table: {t.name} ({seated}/
                              {t.capacity || 10} Seats)
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <p className="text-xs text-primary-foreground/60 mt-1 font-mono">
                      Current Occupancy:{" "}
                      {
                        dbGuests.filter(
                          (d: any) =>
                            d.tableId === selectedAssignmentTable.id ||
                            d.table?.id === selectedAssignmentTable.id,
                        ).length
                      }{" "}
                      / {selectedAssignmentTable.capacity || 10} Seats
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedAssignmentTable(null)}
                    className="px-5 py-2.5 bg-rose-500/20 text-rose-300 border-2 border-rose-500/60 hover:bg-rose-500 hover:text-white text-xs font-extrabold uppercase tracking-widest cursor-pointer rounded-lg transition-all shadow-lg flex items-center gap-2"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    Close Seating Panel ✕
                  </button>
                </div>

                {/* CURRENTLY SEATED GUESTS AT THIS TABLE SECTION */}
                {(() => {
                  const currentSeated = dbGuests.filter(
                    (d: any) =>
                      d.tableId === selectedAssignmentTable.id ||
                      d.table?.id === selectedAssignmentTable.id,
                  );
                  const capacity = selectedAssignmentTable.capacity || 10;
                  const isFull = currentSeated.length >= capacity;

                  return (
                    <div className="space-y-3 bg-emerald-950/20 p-5 border border-emerald-500/30 rounded-lg">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <p
                            className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest flex items-center gap-2"
                            style={{ fontFamily: "Lato,sans-serif" }}
                          >
                            <span>
                              Guests Seated at {selectedAssignmentTable.name}
                            </span>
                            {isFull && (
                              <span className="bg-rose-500/30 text-rose-300 border border-rose-500/50 text-[9px] px-2 py-0.5 rounded font-black">
                                TABLE FULL ({currentSeated.length}/{capacity})
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-primary-foreground/60 mt-0.5">
                            {currentSeated.length > 0
                              ? `Showing all ${currentSeated.length} seated guest(s). Click "Remove from Table" to free up seats.`
                              : "No guests are currently seated at this table."}
                          </p>
                        </div>
                        <span className="text-xs font-mono text-emerald-300 font-bold bg-emerald-500/10 px-3 py-1 border border-emerald-500/30 rounded">
                          {currentSeated.length} / {capacity} Occupied
                        </span>
                      </div>

                      {currentSeated.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1 pt-1">
                          {currentSeated.map((g: any) => (
                            <div
                              key={g.id || g.code || g.pin}
                              className="flex items-center justify-between p-3 bg-primary/40 border border-emerald-500/40 rounded-lg flex-wrap gap-3"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-accent font-mono text-xs font-bold bg-accent/10 px-2 py-1 border border-accent/20 rounded">
                                  #{g.code || g.pin || "----"}
                                </span>
                                <div>
                                  <p
                                    className="text-sm text-primary-foreground font-bold"
                                    style={{
                                      fontFamily: "Playfair Display,serif",
                                    }}
                                  >
                                    {g.name || g.fullName}
                                  </p>
                                  <p
                                    className="text-[9px] text-primary-foreground/50 mt-0.5"
                                    style={{ fontFamily: "Lato,sans-serif" }}
                                  >
                                    Cluster:{" "}
                                    <span className="text-accent font-semibold">
                                      {g.cluster || "Guests"}
                                    </span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-[9px] font-extrabold uppercase px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded">
                                  ✓ Seated Here
                                </span>
                                <button
                                  onClick={() =>
                                    handleAssignGuestToTable(g.id, null)
                                  }
                                  disabled={assigningGuestId === g.id}
                                  className="px-3.5 py-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/50 text-[10px] font-extrabold uppercase rounded hover:bg-rose-500 hover:text-white cursor-pointer transition-all shadow-sm"
                                  style={{ fontFamily: "Lato,sans-serif" }}
                                >
                                  {assigningGuestId === g.id
                                    ? "Removing..."
                                    : "Remove from Table ✕"}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })()}

                {/* PICK A CLUSTER & ASSIGNMENT SECTION (HIDDEN WHEN TABLE IS FULL) */}
                {(() => {
                  const currentSeated = dbGuests.filter(
                    (d: any) =>
                      d.tableId === selectedAssignmentTable.id ||
                      d.table?.id === selectedAssignmentTable.id,
                  );
                  const capacity = selectedAssignmentTable.capacity || 10;
                  const isFull = currentSeated.length >= capacity;

                  if (isFull) {
                    return (
                      <div className="p-5 bg-rose-500/10 border border-rose-500/40 rounded-lg text-rose-300 text-xs font-semibold text-center space-y-1">
                        <p className="text-sm font-bold text-rose-200">
                          🔒 {selectedAssignmentTable.name} is fully occupied (
                          {currentSeated.length} / {capacity} seats).
                        </p>
                        <p className="text-rose-300/80">
                          Showing assigned guests only. Click "Remove from Table
                          ✕" above on any guest to free up a seat.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {/* PICK A CLUSTER SECTION */}
                      <div className="space-y-3 bg-secondary/30 p-5 border border-sidebar-border rounded-lg">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div>
                            <p
                              className="text-[10px] text-accent font-extrabold uppercase tracking-widest"
                              style={{ fontFamily: "Lato,sans-serif" }}
                            >
                              1. Pick a Cluster to Filter Guests
                            </p>
                            <p
                              className="text-xs text-primary-foreground/60 mt-0.5"
                              style={{ fontFamily: "Lato,sans-serif" }}
                            >
                              Select a cluster below or search guests by Name or
                              Code (#)
                            </p>
                          </div>

                          {/* Guest Name or Code (#) Search Bar in Cluster Panel */}
                          <div className="relative w-full md:w-80">
                            <input
                              type="text"
                              placeholder="🔍 Search by Name or Code (#6950)..."
                              value={assignmentSearch}
                              onChange={(e) =>
                                setAssignmentSearch(e.target.value)
                              }
                              className="bg-primary border border-sidebar-border px-3.5 py-2 text-xs text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:border-accent rounded w-full pr-8"
                              style={{ fontFamily: "Lato,sans-serif" }}
                            />
                            {assignmentSearch && (
                              <button
                                onClick={() => setAssignmentSearch("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-primary-foreground/40 hover:text-primary-foreground cursor-pointer"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Cluster Pills */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          <button
                            onClick={() => setAssignmentClusterId("ALL")}
                            className={`px-3.5 py-2 text-[10px] uppercase font-bold tracking-wider rounded border transition-all cursor-pointer flex items-center gap-2 ${
                              assignmentClusterId === "ALL"
                                ? "bg-accent text-accent-foreground border-accent shadow-md"
                                : "bg-primary/40 text-primary-foreground/70 border-sidebar-border hover:border-accent/40"
                            }`}
                            style={{ fontFamily: "Lato,sans-serif" }}
                          >
                            <span>All Clusters</span>
                            <span className="px-1.5 py-0.5 text-[9px] bg-primary/30 rounded font-mono">
                              {dbGuests.length}
                            </span>
                          </button>

                          {clusters.map((cls: any) => {
                            const isActive =
                              assignmentClusterId === cls.id ||
                              assignmentClusterId === cls.name;
                            const clusterGuestsCount = dbGuests.filter(
                              (g: any) =>
                                g.clusterId === cls.id ||
                                (g.cluster || "").toLowerCase() ===
                                  cls.name.toLowerCase(),
                            ).length;

                            return (
                              <button
                                key={cls.id}
                                onClick={() => setAssignmentClusterId(cls.id)}
                                className={`px-3.5 py-2 text-[10px] uppercase font-bold tracking-wider rounded border transition-all cursor-pointer flex items-center gap-2 ${
                                  isActive
                                    ? "bg-accent text-accent-foreground border-accent shadow-md"
                                    : "bg-primary/40 text-primary-foreground/70 border-sidebar-border hover:border-accent/40"
                                }`}
                                style={{ fontFamily: "Lato,sans-serif" }}
                              >
                                <span>{cls.name}</span>
                                <span className="px-1.5 py-0.5 text-[9px] bg-primary/30 rounded font-mono font-bold">
                                  {clusterGuestsCount}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* GUEST ASSIGNMENT LIST */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-sidebar-border/50 pb-2 flex-wrap gap-2">
                          <p
                            className="text-[10px] text-primary-foreground/60 uppercase font-extrabold tracking-wider"
                            style={{ fontFamily: "Lato,sans-serif" }}
                          >
                            2. Guests in Picked Cluster (1 Guest per Table
                            Invariant)
                          </p>

                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              placeholder="Search guests by name, phone or #code"
                              value={assignmentSearch}
                              onChange={(e) =>
                                setAssignmentSearch(e.target.value)
                              }
                              className="px-3 py-2 text-[13px] bg-primary border border-sidebar-border rounded focus:outline-none text-primary-foreground placeholder:text-primary-foreground/40"
                              style={{
                                fontFamily: "Lato,sans-serif",
                                minWidth: 260,
                              }}
                            />

                            <span className="text-[10px] text-accent font-mono font-bold">
                              {assignmentSearch.trim()
                                ? `Filter: "${assignmentSearch.trim()}"`
                                : "Each guest can only be assigned to 1 table"}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                          {(() => {
                            // Filter guests by picked cluster & search term
                            const filteredGuests = dbGuests.filter((g: any) => {
                              // Cluster filter
                              if (assignmentClusterId !== "ALL") {
                                const clsObj = clusters.find(
                                  (c: any) => c.id === assignmentClusterId,
                                );
                                const clsName = clsObj
                                  ? clsObj.name.toLowerCase()
                                  : "";
                                const matchesClusterId =
                                  g.clusterId === assignmentClusterId;
                                const matchesClusterName =
                                  (g.cluster || "").toLowerCase() === clsName;
                                if (!matchesClusterId && !matchesClusterName)
                                  return false;
                              }

                              // Search filter by Name or Code (#)
                              if (assignmentSearch.trim()) {
                                const q = assignmentSearch
                                  .trim()
                                  .toLowerCase()
                                  .replace("#", "");
                                const nameMatch = (g.name || g.fullName || "")
                                  .toLowerCase()
                                  .includes(q);
                                const codeMatch = String(g.code || g.pin || "")
                                  .toLowerCase()
                                  .includes(q);
                                const phoneMatch = String(g.phone || "")
                                  .toLowerCase()
                                  .includes(q);
                                if (!nameMatch && !codeMatch && !phoneMatch)
                                  return false;
                              }

                              return true;
                            });

                            if (filteredGuests.length === 0) {
                              return (
                                <div className="p-8 text-center text-primary-foreground/40 border border-sidebar-border rounded-lg text-xs">
                                  No guests found matching search "
                                  {assignmentSearch}". Try picking another
                                  cluster or clearing search.
                                </div>
                              );
                            }

                            const targetTblId = selectedAssignmentTable.id;
                            const targetTblName = selectedAssignmentTable.name;

                            return filteredGuests.map((g: any) => {
                              const currentTableId = g.tableId || g.table?.id;
                              const currentTableName =
                                g.table?.name ||
                                (typeof g.table === "string" ? g.table : null);
                              const isAssignedHere =
                                currentTableId === targetTblId ||
                                currentTableName === targetTblName;
                              const isAssignedElsewhere =
                                Boolean(
                                  currentTableId ||
                                  (currentTableName &&
                                    currentTableName !== "Unassigned"),
                                ) && !isAssignedHere;
                              const isUnassigned =
                                !isAssignedHere && !isAssignedElsewhere;

                              return (
                                <div
                                  key={g.id || g.code || g.pin}
                                  className={`flex items-center justify-between p-3.5 border rounded-lg transition-all flex-wrap gap-3 ${
                                    isAssignedHere
                                      ? "bg-emerald-950/20 border-emerald-500/40"
                                      : isAssignedElsewhere
                                        ? "bg-amber-950/10 border-amber-500/30 opacity-90"
                                        : "bg-primary/30 border-sidebar-border hover:border-sidebar-border/80"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-accent font-mono text-xs font-bold bg-accent/10 px-2 py-1 border border-accent/20 rounded">
                                      #{g.code || g.pin || "----"}
                                    </span>
                                    <div>
                                      <p
                                        className="text-sm text-primary-foreground font-bold"
                                        style={{
                                          fontFamily: "Playfair Display,serif",
                                        }}
                                      >
                                        {g.title &&
                                        !(g.name || "")
                                          .toLowerCase()
                                          .startsWith(g.title.toLowerCase()) ? (
                                          <span className="text-accent font-semibold mr-1.5">
                                            {g.title}
                                          </span>
                                        ) : null}
                                        {g.name || g.fullName}
                                      </p>
                                      <p
                                        className="text-[9px] text-primary-foreground/50 mt-0.5"
                                        style={{
                                          fontFamily: "Lato,sans-serif",
                                        }}
                                      >
                                        Cluster:{" "}
                                        <span className="text-accent font-semibold">
                                          {g.cluster || "Guests"}
                                        </span>
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    {/* Assignment Status Badge */}
                                    {isAssignedHere && (
                                      <span className="text-[9px] font-extrabold uppercase px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded">
                                        ✓ Seated Here{" "}
                                        {g.seatNumber
                                          ? `(Seat ${g.seatNumber})`
                                          : ""}
                                      </span>
                                    )}

                                    {isAssignedElsewhere && (
                                      <span className="text-[9px] font-semibold uppercase px-2 py-1 bg-slate-800 text-amber-300 border border-amber-500/30 rounded">
                                        Currently at:{" "}
                                        {currentTableName || "Other Table"}
                                      </span>
                                    )}

                                    {isUnassigned && (
                                      <span className="text-[9px] font-semibold uppercase px-2 py-1 bg-primary/40 text-primary-foreground/40 border border-sidebar-border rounded">
                                        Unassigned
                                      </span>
                                    )}

                                    {/* Action Buttons */}
                                    {isAssignedHere ? (
                                      <button
                                        onClick={() =>
                                          handleAssignGuestToTable(g.id, null)
                                        }
                                        disabled={assigningGuestId === g.id}
                                        className="px-3.5 py-1.5 border border-rose-500/40 text-rose-400 text-[10px] font-bold uppercase rounded hover:bg-rose-500/10 cursor-pointer transition-colors"
                                        style={{
                                          fontFamily: "Lato,sans-serif",
                                        }}
                                      >
                                        {assigningGuestId === g.id
                                          ? "Updating..."
                                          : "Unassign"}
                                      </button>
                                    ) : isAssignedElsewhere ? (
                                      <button
                                        onClick={() =>
                                          handleAssignGuestToTable(
                                            g.id,
                                            targetTblId,
                                          )
                                        }
                                        disabled={assigningGuestId === g.id}
                                        className="px-3.5 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase rounded hover:bg-amber-500/30 cursor-pointer transition-colors"
                                        style={{
                                          fontFamily: "Lato,sans-serif",
                                        }}
                                        title={`Move guest from ${currentTableName} to ${targetTblName}`}
                                      >
                                        {assigningGuestId === g.id
                                          ? "Moving..."
                                          : `Move to ${targetTblName}`}
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() =>
                                          handleAssignGuestToTable(
                                            g.id,
                                            targetTblId,
                                          )
                                        }
                                        disabled={assigningGuestId === g.id}
                                        className="px-4 py-1.5 bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider rounded hover:bg-accent/80 cursor-pointer transition-colors shadow-sm"
                                        style={{
                                          fontFamily: "Lato,sans-serif",
                                        }}
                                      >
                                        {assigningGuestId === g.id
                                          ? "Assigning..."
                                          : `Assign to ${targetTblName}`}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Bottom Close Button */}
                <div className="pt-3 border-t border-sidebar-border/50 flex justify-end">
                  <button
                    onClick={() => setSelectedAssignmentTable(null)}
                    className="px-5 py-2 bg-rose-500/20 text-rose-300 border border-rose-500/60 hover:bg-rose-500 hover:text-white text-xs font-extrabold uppercase tracking-widest cursor-pointer rounded-lg transition-all shadow"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    Close Seating Panel ✕
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables
                .filter((tbl: any) => {
                  if (!tableSearch.trim()) return true;
                  const q = tableSearch.trim().toLowerCase();
                  const tblName = (tbl.name || "").toLowerCase();
                  const tblZone = (tbl.zone || "").toLowerCase();
                  const tblNum = tblName.replace(/[^0-9]/g, "");
                  const qNum = q.replace(/[^0-9]/g, "");
                  return (
                    tblName.includes(q) ||
                    tblZone.includes(q) ||
                    (qNum && tblNum === qNum) ||
                    (qNum && tblNum.includes(qNum))
                  );
                })
                .map((tbl) => {
                  const assignedCount =
                    tbl.delegates && Array.isArray(tbl.delegates)
                      ? tbl.delegates.length
                      : dbGuests.filter(
                          (d: any) =>
                            d.tableId === tbl.id || d.table?.id === tbl.id,
                        ).length;
                  const capacity = tbl.capacity || 10;
                  const isCardFull = assignedCount >= capacity;
                  const isSelected = selectedAssignmentTable?.id === tbl.id;

                  return (
                    <div
                      key={tbl.id}
                      className={`p-5 border transition-all space-y-4 ${
                        isSelected
                          ? "bg-accent/15 border-accent shadow-[0_0_15px_rgba(201,168,76,0.2)]"
                          : isCardFull
                            ? "bg-primary/30 border-rose-500/30 hover:border-rose-500/60"
                            : "bg-primary/20 border-sidebar-border hover:border-sidebar-border/80"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4
                            className="text-base text-primary-foreground font-bold"
                            style={{ fontFamily: "Playfair Display,serif" }}
                          >
                            {tbl.name}
                          </h4>
                          <p
                            className="text-[9px] text-accent uppercase tracking-widest mt-0.5"
                            style={{ fontFamily: "Lato,sans-serif" }}
                          >
                            {tbl.zone || "Main Zone"}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-mono px-2.5 py-1 border font-bold ${
                            isCardFull
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                              : "bg-primary/40 text-primary-foreground/70 border-sidebar-border"
                          }`}
                          style={{ fontFamily: "DM Mono,monospace" }}
                        >
                          {assignedCount} / {capacity} Seats{" "}
                          {isCardFull ? "(FULL)" : ""}
                        </span>
                      </div>

                      <div className="w-full bg-sidebar-border h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            isCardFull ? "bg-rose-500" : "bg-accent"
                          }`}
                          style={{
                            width: `${Math.min(100, Math.round((assignedCount / capacity) * 100))}%`,
                          }}
                        />
                      </div>

                      <div className="pt-2 border-t border-sidebar-border/50">
                        <button
                          onClick={() => {
                            if (isSelected) {
                              setSelectedAssignmentTable(null);
                            } else {
                              setSelectedAssignmentTable(tbl);
                              setAssignmentClusterId("ALL");
                              setAssignmentSearch("");
                            }
                          }}
                          className={`w-full py-2.5 px-4 text-[10px] tracking-wider uppercase font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            isSelected
                              ? "bg-accent text-accent-foreground shadow-md"
                              : isCardFull
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500 hover:text-white"
                                : "bg-accent/20 text-accent border border-accent/40 hover:bg-accent hover:text-accent-foreground"
                          }`}
                          style={{ fontFamily: "Lato,sans-serif" }}
                        >
                          {isSelected
                            ? "Close Panel ✕"
                            : isCardFull
                              ? "View Assigned Guests (Full) →"
                              : "Assign Guests to Table →"}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {tab === "clusters" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-primary/30 p-6 border border-sidebar-border flex-wrap gap-4">
              <div>
                <p
                  className="text-[9px] tracking-[0.35em] text-accent uppercase font-bold"
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  Guest Clusters & Delegation Groups
                </p>
                <p
                  className="text-sm text-primary-foreground/60 mt-1"
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  {clusters.length} Active Clusters Registered
                </p>
              </div>

              <button
                onClick={() => setShowAddCluster(!showAddCluster)}
                className="flex items-center gap-2 px-5 py-2.5 bg-accent text-accent-foreground text-[10px] tracking-wider uppercase hover:bg-accent/80 transition-colors cursor-pointer font-bold"
                style={{ fontFamily: "Lato,sans-serif" }}
              >
                <Plus size={12} />{" "}
                {showAddCluster ? "Close Form" : "Create New Cluster"}
              </button>
            </div>

            <AnimatePresence>
              {showAddCluster && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-6 border border-sidebar-border bg-secondary/20 space-y-3"
                >
                  <p
                    className="text-xs text-accent uppercase tracking-widest font-bold"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    Create Guest Cluster
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      placeholder="Cluster Name (e.g. VIP Delegates, Family, Cabinet Secretaries)..."
                      value={newCluster.name}
                      onChange={(e) =>
                        setNewCluster((c) => ({ ...c, name: e.target.value }))
                      }
                      className="bg-primary border border-sidebar-border px-4 py-3 text-xs text-primary-foreground placeholder:text-primary-foreground/30 focus:outline-none focus:border-accent"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    />
                    <input
                      placeholder="Description / Category Notes..."
                      value={newCluster.description}
                      onChange={(e) =>
                        setNewCluster((c) => ({
                          ...c,
                          description: e.target.value,
                        }))
                      }
                      className="bg-primary border border-sidebar-border px-4 py-3 text-xs text-primary-foreground placeholder:text-primary-foreground/30 focus:outline-none focus:border-accent"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      onClick={() => setShowAddCluster(false)}
                      className="px-4 py-2 border border-sidebar-border text-[10px] uppercase text-primary-foreground/50 hover:text-primary-foreground cursor-pointer"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCluster}
                      disabled={clusterLoading}
                      className="px-6 py-2 bg-accent text-accent-foreground text-[10px] uppercase tracking-wider font-bold hover:bg-accent/80 cursor-pointer"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      {clusterLoading ? "Saving..." : "Save Cluster"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clusters.map((cls) => {
                const isSelected = selectedCluster?.id === cls.id;
                return (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedCluster(cls)}
                    className={`p-5 border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-accent/15 border-accent shadow-[0_0_15px_rgba(201,168,76,0.2)]"
                        : "bg-primary/20 hover:bg-primary/40 border-sidebar-border"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4
                          className="text-base text-primary-foreground font-bold"
                          style={{ fontFamily: "Playfair Display,serif" }}
                        >
                          {cls.name}
                        </h4>
                        <p
                          className="text-xs text-primary-foreground/50 mt-1 leading-5"
                          style={{ fontFamily: "Lato,sans-serif" }}
                        >
                          {cls.description || "General Delegation Cluster"}
                        </p>
                      </div>
                      <span
                        className="text-xs text-accent font-mono font-bold bg-accent/10 px-2.5 py-1 border border-accent/30 flex-shrink-0"
                        style={{ fontFamily: "DM Mono,monospace" }}
                      >
                        {cls.guestCount || cls.guests?.length || 0} Guests
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-sidebar-border/50 mt-4">
                      <span
                        className="text-[9px] uppercase tracking-widest text-accent font-semibold"
                        style={{ fontFamily: "Lato,sans-serif" }}
                      >
                        {isSelected
                          ? "● Viewing Assigned Guests"
                          : "Click to view guests →"}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCluster(cls.id);
                        }}
                        className="text-primary-foreground/30 hover:text-red-400 p-1 transition-colors cursor-pointer"
                        title="Delete Cluster"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedCluster && (
              <div className="p-6 border border-sidebar-border bg-primary/40 space-y-4 rounded-lg">
                <div className="flex justify-between items-center border-b border-sidebar-border pb-3">
                  <div>
                    <span
                      className="text-accent text-[9px] uppercase tracking-widest font-bold"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      Assigned Delegates for Cluster
                    </span>
                    <h3
                      className="text-2xl text-primary-foreground font-bold"
                      style={{ fontFamily: "Playfair Display,serif" }}
                    >
                      {selectedCluster.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedCluster(null)}
                    className="text-[10px] text-primary-foreground/40 hover:text-primary-foreground uppercase tracking-widest cursor-pointer"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    Close Filter ✕
                  </button>
                </div>

                <div className="space-y-px max-h-80 overflow-y-auto">
                  {selectedCluster.guests &&
                  selectedCluster.guests.length > 0 ? (
                    selectedCluster.guests.map((g: any) => (
                      <div
                        key={g.id}
                        className="flex items-center justify-between p-3.5 bg-primary/30 border border-sidebar-border"
                      >
                        <div>
                          <p
                            className="text-sm text-primary-foreground font-semibold"
                            style={{ fontFamily: "Playfair Display,serif" }}
                          >
                            {g.name}
                          </p>
                          <p
                            className="text-[9px] text-primary-foreground/50 mt-0.5"
                            style={{ fontFamily: "DM Mono,monospace" }}
                          >
                            Code #{g.code} · {g.role || "Delegate"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <select
                            value={
                              g.tableId ||
                              (typeof g.table === "object"
                                ? g.table?.id
                                : "") ||
                              ""
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              handleAssignGuestToTable(g.id, val ? val : null);
                            }}
                            disabled={assigningGuestId === g.id}
                            className="bg-primary border border-sidebar-border text-[10px] text-primary-foreground px-2.5 py-1 rounded focus:border-accent focus:outline-none cursor-pointer"
                            style={{ fontFamily: "Lato,sans-serif" }}
                          >
                            <option value="">-- No Table Assigned --</option>
                            {tables.map((t: any) => (
                              <option key={t.id} value={t.id}>
                                {t.name} ({t.zone || "Main"})
                              </option>
                            ))}
                          </select>

                          <span
                            className={`text-[8px] tracking-widest uppercase px-2.5 py-1 border font-bold ${
                              g.status === "CHECKED_IN"
                                ? "bg-emerald-500 text-slate-950 border-emerald-400"
                                : "border-sidebar-border text-primary-foreground/40"
                            }`}
                            style={{ fontFamily: "Lato,sans-serif" }}
                          >
                            {g.status === "CHECKED_IN"
                              ? "✓ CHECKED IN"
                              : "INVITED"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      className="p-6 text-center text-primary-foreground/40 text-xs tracking-wider"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      No guests assigned to this cluster yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "checked_in" && (
          <div className="space-y-6">
            <div className="border-b border-sidebar-border pb-4">
              <p
                className="text-[10px] tracking-[0.3em] uppercase text-accent mb-1"
                style={{ fontFamily: "Lato,sans-serif" }}
              >
                Attendance
              </p>
              <h2
                className="text-lg text-primary-foreground font-serif"
                style={{ fontFamily: "Playfair Display,serif" }}
              >
                Checked In Guests
              </h2>
              <p
                className="text-[11px] text-primary-foreground/60 mt-2"
                style={{ fontFamily: "Lato,sans-serif" }}
              >
                Showing all guests who have been checked in.
              </p>
            </div>
            {checkedInGuests.length === 0 ? (
              <div className="text-center py-20 border border-sidebar-border bg-primary/10 p-8">
                <CheckCircle
                  size={20}
                  className="text-emerald-400 mx-auto mb-2"
                />
                <p
                  className="text-primary-foreground/40 text-sm mt-4"
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  No guests have been checked in yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {checkedInGuests.map((g: any) => (
                  <div
                    key={g.id || g.pin || g.code}
                    className="p-5 border border-emerald-500/30 bg-emerald-950/10 rounded-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p
                          className="text-base text-primary-foreground font-bold"
                          style={{ fontFamily: "Playfair Display,serif" }}
                        >
                          {g.name}
                        </p>
                        <p
                          className="text-[10px] text-primary-foreground/50 mt-1"
                          style={{ fontFamily: "DM Mono,monospace" }}
                        >
                          Code #{g.code || g.pin || "N/A"}
                        </p>
                      </div>
                      <span
                        className="text-[9px] tracking-widest uppercase px-3 py-1 border font-bold bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        style={{ fontFamily: "Lato,sans-serif" }}
                      >
                        CHECKED IN
                      </span>
                    </div>
                    <div className="mt-3 text-[10px] text-primary-foreground/60 space-y-1">
                      <p style={{ fontFamily: "Lato,sans-serif" }}>
                        Cluster:{" "}
                        <span className="text-primary-foreground">
                          {g.cluster || "Guests"}
                        </span>
                      </p>
                      <p style={{ fontFamily: "Lato,sans-serif" }}>
                        Table:{" "}
                        <span className="text-primary-foreground">
                          {typeof g.table === "object"
                            ? g.table?.name
                            : g.table || "Unassigned"}
                        </span>
                      </p>
                      {g.checkedInAt && (
                        <p style={{ fontFamily: "Lato,sans-serif" }}>
                          Checked In At:{" "}
                          <span className="text-primary-foreground">
                            {new Date(g.checkedInAt).toLocaleString()}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "rsvps" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-sidebar-border pb-4 flex-wrap gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                {(
                  [
                    ["PENDING", "Pending RSVP", pendingRsvpGuests.length],
                    ["ATTENDING", "Attending", attendingRsvps.length],
                    [
                      "NOT_ATTENDING",
                      "Not Attending",
                      notAttendingRsvps.length,
                    ],
                  ] as const
                ).map(([key, label, count]) => {
                  const active = rsvpStatusTab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setRsvpStatusTab(key)}
                      className={`px-4 py-2.5 text-xs tracking-wider uppercase font-semibold border transition-all cursor-pointer flex items-center gap-2.5 ${
                        active
                          ? key === "ATTENDING"
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                            : key === "NOT_ATTENDING"
                              ? "bg-rose-950/40 text-rose-400 border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.25)]"
                              : "bg-amber-950/40 text-amber-400 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                          : "bg-primary/20 text-primary-foreground/50 border-sidebar-border hover:text-primary-foreground hover:border-sidebar-border/80"
                      }`}
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      <span>{label}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          active
                            ? "bg-accent/20 text-accent font-bold"
                            : "bg-primary/40 text-primary-foreground/40"
                        }`}
                        style={{ fontFamily: "DM Mono,monospace" }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {(adminPermissions.length === 0 ||
                  hasPermission("export_sheets")) &&
                  !isAssistance && (
                    <button
                      onClick={
                        rsvpStatusTab === "PENDING"
                          ? exportPendingRsvpExcel
                          : exportCSV
                      }
                      className="flex items-center gap-2 px-5 py-2.5 border border-amber-500/60 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 transition-colors tracking-wider uppercase cursor-pointer font-bold text-[10px]"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      <FileSpreadsheet size={12} />
                      {rsvpStatusTab === "PENDING"
                        ? "Export Pending RSVP Excel"
                        : "Export CSV"}
                    </button>
                  )}

                {(adminPermissions.length === 0 ||
                  hasPermission("export_sheets")) &&
                  !isAssistance && (
                    <>
                      <input
                        ref={pendingRsvpUploadRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={handlePendingRsvpUpload}
                      />
                      <button
                        onClick={() => pendingRsvpUploadRef.current?.click()}
                        disabled={reconcilingPendingRsvp}
                        className="flex items-center gap-2 px-5 py-2.5 border border-emerald-500/60 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40 transition-colors tracking-wider uppercase cursor-pointer font-bold text-[10px] disabled:opacity-60"
                        style={{ fontFamily: "Lato,sans-serif" }}
                      >
                        <Upload size={12} />
                        {reconcilingPendingRsvp
                          ? "Reconciling…"
                          : "Upload Phone List"}
                      </button>
                    </>
                  )}
              </div>
            </div>

            {/* Search and Cluster Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-primary/30 border border-sidebar-border p-3">
              <div className="relative flex-1 w-full">
                <Search
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-accent/60"
                />
                <input
                  type="text"
                  value={rsvpSearch}
                  onChange={(e) => setRsvpSearch(e.target.value)}
                  placeholder="Search RSVPs by name, PIN, or phone..."
                  className="w-full bg-primary/40 border border-sidebar-border pl-9 pr-4 py-2 text-xs text-primary-foreground focus:outline-none focus:border-accent font-medium placeholder:text-primary-foreground/30"
                  style={{ fontFamily: "Lato,sans-serif" }}
                />
              </div>

              <select
                value={rsvpClusterFilter}
                onChange={(e) => setRsvpClusterFilter(e.target.value)}
                className="w-full sm:w-auto bg-primary/40 border border-sidebar-border px-3 py-2 text-xs text-primary-foreground focus:outline-none focus:border-accent font-medium cursor-pointer"
                style={{ fontFamily: "Lato,sans-serif" }}
              >
                <option value="ALL">All Clusters</option>
                {clusters.map((c: any) => (
                  <option key={c.id || c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {rsvpStatusTab === "ATTENDING" &&
              (attendingRsvps.length === 0 ? (
                <div className="text-center py-20 border border-sidebar-border bg-primary/10 p-8">
                  <DiamondOrnament size={12} color="#C9A84C" opacity={0.3} />
                  <p
                    className="text-primary-foreground/40 text-sm mt-4"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    No guests have accepted RSVP yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attendingRsvps.map((r) => (
                    <div
                      key={r.id}
                      className="p-5 border border-emerald-500/30 bg-emerald-950/15 flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p
                            className="text-base text-primary-foreground font-bold"
                            style={{ fontFamily: "Playfair Display,serif" }}
                          >
                            {r.name}
                          </p>
                          <p
                            className="text-[10px] text-primary-foreground/50 mt-0.5"
                            style={{ fontFamily: "DM Mono,monospace" }}
                          >
                            Code #{r.pin}
                          </p>
                          <p
                            className="text-[10px] text-primary-foreground/50 mt-1"
                            style={{ fontFamily: "Lato,sans-serif" }}
                          >
                            Cluster:{" "}
                            <span className="text-primary-foreground/80 font-medium">
                              {r.cluster || "Guests"}
                            </span>
                            {r.phone ? (
                              <span>
                                {" "}
                                · Phone:{" "}
                                <span className="text-primary-foreground/80 font-medium">
                                  {r.phone}
                                </span>
                              </span>
                            ) : null}
                          </p>
                        </div>
                        <span
                          className="text-[9px] tracking-widest uppercase px-3 py-1 border font-bold bg-emerald-500/20 text-emerald-400 border-emerald-500/40 flex-shrink-0"
                          style={{ fontFamily: "Lato,sans-serif" }}
                        >
                          ✓ ATTENDING
                        </span>
                      </div>

                      {r.dietary && (
                        <p
                          className="text-xs text-primary-foreground/60"
                          style={{ fontFamily: "Lato,sans-serif" }}
                        >
                          Dietary Requirements:{" "}
                          <span className="text-primary-foreground">
                            {r.dietary}
                          </span>
                        </p>
                      )}
                      {r.message && (
                        <p
                          className="text-xs text-primary-foreground/75 italic mt-1 leading-6 border-l-2 border-emerald-500/40 pl-3"
                          style={{ fontFamily: "Playfair Display,serif" }}
                        >
                          "{r.message}"
                        </p>
                      )}
                      <p
                        className="text-[9px] text-primary-foreground/30 mt-1"
                        style={{ fontFamily: "DM Mono,monospace" }}
                      >
                        Responded: {new Date(r.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ))}

            {rsvpStatusTab === "NOT_ATTENDING" &&
              (filteredNotAttendingRsvps.length === 0 ? (
                <div className="text-center py-20 border border-sidebar-border bg-primary/10 p-8">
                  <DiamondOrnament size={12} color="#C9A84C" opacity={0.3} />
                  <p
                    className="text-primary-foreground/40 text-sm mt-4"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    No declined RSVPs matching the current search/filter.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotAttendingRsvps.map((r) => (
                    <div
                      key={r.id}
                      className="p-5 border border-rose-500/30 bg-rose-950/15 flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p
                            className="text-base text-primary-foreground font-bold"
                            style={{ fontFamily: "Playfair Display,serif" }}
                          >
                            {r.name}
                          </p>
                          <p
                            className="text-[10px] text-primary-foreground/50 mt-0.5"
                            style={{ fontFamily: "DM Mono,monospace" }}
                          >
                            Code #{r.pin}
                          </p>
                          <p
                            className="text-[10px] text-primary-foreground/50 mt-1"
                            style={{ fontFamily: "Lato,sans-serif" }}
                          >
                            Cluster:{" "}
                            <span className="text-primary-foreground/80 font-medium">
                              {r.cluster || "Guests"}
                            </span>
                            {r.phone ? (
                              <span>
                                {" "}
                                · Phone:{" "}
                                <span className="text-primary-foreground/80 font-medium">
                                  {r.phone}
                                </span>
                              </span>
                            ) : null}
                          </p>
                        </div>
                        <span
                          className="text-[9px] tracking-widest uppercase px-3 py-1 border font-bold bg-rose-500/20 text-rose-400 border-rose-500/40 flex-shrink-0"
                          style={{ fontFamily: "Lato,sans-serif" }}
                        >
                          ✕ NOT ATTENDING
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

            {rsvpStatusTab === "PENDING" &&
              (filteredPendingRsvpGuests.length === 0 ? (
                <div className="text-center py-20 border border-sidebar-border bg-primary/10 p-8">
                  <CheckCircle
                    size={20}
                    className="text-emerald-400 mx-auto mb-2"
                  />
                  <p
                    className="text-primary-foreground/60 text-sm"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    No pending RSVP guests match the current search/filter.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPendingRsvpGuests.map((g) => {
                    const gKey = g.id || g.code || g.pin || g.name;
                    return (
                      <div
                        key={gKey}
                        className="flex items-center gap-4 px-5 py-4 border bg-primary/20 border-sidebar-border"
                      >
                        <span
                          className="text-accent text-sm w-14 flex-shrink-0 font-medium"
                          style={{ fontFamily: "DM Mono,monospace" }}
                        >
                          {g.pin || g.code}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm text-primary-foreground truncate font-bold"
                            style={{ fontFamily: "Playfair Display,serif" }}
                          >
                            {g.name || g.fullName}
                          </p>
                          <p
                            className="text-[9px] text-primary-foreground/40 mt-0.5"
                            style={{ fontFamily: "Lato,sans-serif" }}
                          >
                            Cluster:{" "}
                            <span className="text-accent font-semibold">
                              {typeof g.cluster === "object"
                                ? (g.cluster as any)?.name
                                : g.cluster || "Guests"}
                            </span>
                            {g.phone && (
                              <span>
                                {" "}
                                · Phone:{" "}
                                <span className="text-primary-foreground/80 font-medium">
                                  {g.phone}
                                </span>
                              </span>
                            )}
                            {(g as any).country && (
                              <span>
                                {" "}
                                · County/Country:{" "}
                                <span className="text-primary-foreground/80 font-medium">
                                  {(g as any).country}
                                </span>
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleAdminRsvpForGuest(g)}
                            className="px-3 py-1 bg-accent/20 text-accent hover:bg-accent/40 border border-accent/40 text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            style={{ fontFamily: "Lato,sans-serif" }}
                            title="RSVP for this guest"
                          >
                            RSVP
                          </button>
                          <span
                            className="text-[9px] tracking-widest uppercase px-2.5 py-1 border font-bold bg-amber-950/20 text-amber-400/80 border-amber-500/30"
                            style={{ fontFamily: "Lato,sans-serif" }}
                          >
                            PENDING RSVP
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
          </div>
        )}

        {tab === "activities" && (
          <div className="space-y-6">
            {/* Activities Header */}
            <div className="border-b border-sidebar-border pb-4">
              <p
                className="text-[10px] tracking-[0.3em] uppercase text-accent mb-1"
                style={{ fontFamily: "Lato,sans-serif" }}
              >
                Administration
              </p>
              <h2
                className="text-lg text-primary-foreground font-serif"
                style={{ fontFamily: "Playfair Display,serif" }}
              >
                Roles & Permissions
              </h2>
            </div>

            {/* Sub-tab bar */}
            <div className="flex border-b border-sidebar-border overflow-x-auto">
              {(
                [
                  ["roles", "Roles"],
                  ["permissions", "Permissions"],
                  ["cluster_permissions", "Cluster Permissions"],
                ] as const
              ).map(([st, label]) => (
                <button
                  key={st}
                  onClick={() => {
                    setActivitiesSubTab(st);
                    if (st === "cluster_permissions") {
                      setClusterPermsLoading(true);
                      fetch("/api/clusters/permissions")
                        .then((r) => r.json())
                        .then((d) => {
                          setClusterPermsData(d);
                          if (
                            d.clusters?.length > 0 &&
                            !selectedClusterForPerms
                          ) {
                            setSelectedClusterForPerms(d.clusters[0].id);
                          }
                        })
                        .catch(() => {})
                        .finally(() => setClusterPermsLoading(false));
                    } else {
                      setActivitiesLoading(true);
                      const endpoint =
                        st === "roles" ? "/api/roles" : "/api/permissions";
                      fetch(endpoint)
                        .then((r) => r.json())
                        .then((d) => {
                          if (st === "roles") setAdminRoles(d.roles || []);
                          else setPermissionsList(d.permissions || []);
                        })
                        .catch(() => {})
                        .finally(() => setActivitiesLoading(false));
                    }
                  }}
                  className={`px-6 py-3 text-[10px] tracking-widest uppercase border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                    activitiesSubTab === st
                      ? "border-accent text-accent font-semibold"
                      : "border-transparent text-primary-foreground/40 hover:text-primary-foreground/70"
                  }`}
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Load data on first mount of activities tab */}
            {adminRoles.length === 0 &&
              permissionsList.length === 0 &&
              !activitiesLoading && (
                <span
                  style={{ display: "none" }}
                  ref={(el) => {
                    if (!el) return;
                    setActivitiesLoading(true);
                    Promise.all([
                      fetch("/api/roles").then((r) => r.json()),
                      fetch("/api/permissions").then((r) => r.json()),
                    ])
                      .then(([rd, pd]) => {
                        setAdminRoles(rd.roles || []);
                        setPermissionsList(pd.permissions || []);
                      })
                      .catch(() => {})
                      .finally(() => setActivitiesLoading(false));
                  }}
                />
              )}

            {activitiesLoading && (
              <div className="flex items-center justify-center py-16">
                <p
                  className="text-primary-foreground/40 text-xs tracking-widest uppercase animate-pulse"
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  Loading…
                </p>
              </div>
            )}

            {/* ── ROLES sub-tab ── */}
            {!activitiesLoading && activitiesSubTab === "roles" && (
              <div className="space-y-6">
                {/* Add Role form */}
                <div className="border border-sidebar-border bg-primary/10 p-5 space-y-3">
                  <p
                    className="text-[9px] tracking-[0.3em] uppercase text-accent font-bold"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    Add New Role
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    <input
                      type="text"
                      placeholder="Role name (e.g. EDITOR)"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      className="flex-1 min-w-[180px] bg-primary border border-sidebar-border px-3 py-2 text-xs text-primary-foreground placeholder:text-primary-foreground/30 focus:outline-none focus:border-accent"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={newRoleDesc}
                      onChange={(e) => setNewRoleDesc(e.target.value)}
                      className="flex-[2] min-w-[220px] bg-primary border border-sidebar-border px-3 py-2 text-xs text-primary-foreground placeholder:text-primary-foreground/30 focus:outline-none focus:border-accent"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    />
                    <button
                      disabled={savingRole || !newRoleName.trim()}
                      onClick={async () => {
                        setSavingRole(true);
                        try {
                          const res = await fetch("/api/roles", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              name: newRoleName,
                              description: newRoleDesc,
                            }),
                          });
                          const d = await res.json();
                          if (res.ok) {
                            setNewRoleName("");
                            setNewRoleDesc("");
                            const rd = await fetch("/api/roles").then((r) =>
                              r.json(),
                            );
                            setAdminRoles(rd.roles || []);
                          } else {
                            alert(d.error || "Failed to create role");
                          }
                        } catch {
                          alert("Network error");
                        } finally {
                          setSavingRole(false);
                        }
                      }}
                      className="px-5 py-2 bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider hover:bg-accent/80 transition-colors disabled:opacity-40 cursor-pointer border border-accent"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      {savingRole ? "Saving…" : "Add Role"}
                    </button>
                  </div>
                </div>

                {/* Roles list */}
                {adminRoles.length === 0 ? (
                  <div className="text-center py-16 border border-sidebar-border bg-primary/10">
                    <p
                      className="text-primary-foreground/40 text-sm"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      No roles found. Add the first role above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {adminRoles.map((role) => (
                      <div
                        key={role.id}
                        className="p-5 border border-sidebar-border bg-primary/10 flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p
                              className="text-sm text-primary-foreground font-bold tracking-wider"
                              style={{ fontFamily: "Lato,sans-serif" }}
                            >
                              {role.name}
                            </p>
                            {role.description && (
                              <p
                                className="text-[11px] text-primary-foreground/55 mt-0.5"
                                style={{ fontFamily: "Lato,sans-serif" }}
                              >
                                {role.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <span
                              className="text-[9px] tracking-widest uppercase px-3 py-1 border font-bold bg-accent/10 text-accent border-accent/40"
                              style={{ fontFamily: "Lato,sans-serif" }}
                            >
                              {role.guestCount} guest
                              {role.guestCount !== 1 ? "s" : ""}
                            </span>
                            <span
                              className="text-[9px] tracking-widest uppercase px-3 py-1 border font-bold bg-primary/30 text-primary-foreground/60 border-sidebar-border"
                              style={{ fontFamily: "Lato,sans-serif" }}
                            >
                              {role.permissionCount} perm
                              {role.permissionCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                        {role.permissions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {role.permissions.map((p: any) => (
                              <span
                                key={p.id}
                                className="text-[8px] tracking-wider uppercase px-2 py-0.5 border border-sidebar-border/60 text-primary-foreground/50"
                                style={{ fontFamily: "Lato,sans-serif" }}
                              >
                                {p.name}
                              </span>
                            ))}
                          </div>
                        )}
                        <p
                          className="text-[9px] text-primary-foreground/30"
                          style={{ fontFamily: "DM Mono,monospace" }}
                        >
                          Created{" "}
                          {new Date(role.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── PERMISSIONS sub-tab ── */}
            {!activitiesLoading && activitiesSubTab === "permissions" && (
              <div className="space-y-6">
                {/* Add Permission form */}
                <div className="border border-sidebar-border bg-primary/10 p-5 space-y-3">
                  <p
                    className="text-[9px] tracking-[0.3em] uppercase text-accent font-bold"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    Add New Permission
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    <input
                      type="text"
                      placeholder="Permission name (e.g. checkin:write)"
                      value={newPermName}
                      onChange={(e) => setNewPermName(e.target.value)}
                      className="flex-1 min-w-[180px] bg-primary border border-sidebar-border px-3 py-2 text-xs text-primary-foreground placeholder:text-primary-foreground/30 focus:outline-none focus:border-accent"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={newPermDesc}
                      onChange={(e) => setNewPermDesc(e.target.value)}
                      className="flex-[2] min-w-[220px] bg-primary border border-sidebar-border px-3 py-2 text-xs text-primary-foreground placeholder:text-primary-foreground/30 focus:outline-none focus:border-accent"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    />
                    <button
                      disabled={savingPerm || !newPermName.trim()}
                      onClick={async () => {
                        setSavingPerm(true);
                        try {
                          const res = await fetch("/api/permissions", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              name: newPermName,
                              description: newPermDesc,
                            }),
                          });
                          const d = await res.json();
                          if (res.ok) {
                            setNewPermName("");
                            setNewPermDesc("");
                            const pd = await fetch("/api/permissions").then(
                              (r) => r.json(),
                            );
                            setPermissionsList(pd.permissions || []);
                          } else {
                            alert(d.error || "Failed to create permission");
                          }
                        } catch {
                          alert("Network error");
                        } finally {
                          setSavingPerm(false);
                        }
                      }}
                      className="px-5 py-2 bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider hover:bg-accent/80 transition-colors disabled:opacity-40 cursor-pointer border border-accent"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      {savingPerm ? "Saving…" : "Add Permission"}
                    </button>
                  </div>
                </div>

                {/* Permissions list */}
                {permissionsList.length === 0 ? (
                  <div className="text-center py-16 border border-sidebar-border bg-primary/10">
                    <p
                      className="text-primary-foreground/40 text-sm"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      No permissions found. Add the first permission above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {permissionsList.map((perm: any) => (
                      <div
                        key={perm.id}
                        className="p-5 border border-sidebar-border bg-primary/10 flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p
                              className="text-sm text-primary-foreground font-bold font-mono tracking-wider"
                              style={{ fontFamily: "DM Mono,monospace" }}
                            >
                              {perm.name}
                            </p>
                            {perm.description && (
                              <p
                                className="text-[11px] text-primary-foreground/55 mt-0.5"
                                style={{ fontFamily: "Lato,sans-serif" }}
                              >
                                {perm.description}
                              </p>
                            )}
                          </div>
                          <span
                            className="text-[9px] tracking-widest uppercase px-3 py-1 border font-bold bg-primary/30 text-primary-foreground/60 border-sidebar-border flex-shrink-0"
                            style={{ fontFamily: "Lato,sans-serif" }}
                          >
                            {perm.roleCount} role
                            {perm.roleCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                        {perm.roles.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {perm.roles.map((r: any) => (
                              <span
                                key={r.id}
                                className="text-[8px] tracking-wider uppercase px-2 py-0.5 border border-accent/40 text-accent/70"
                                style={{ fontFamily: "Lato,sans-serif" }}
                              >
                                {r.name}
                              </span>
                            ))}
                          </div>
                        )}
                        <p
                          className="text-[9px] text-primary-foreground/30"
                          style={{ fontFamily: "DM Mono,monospace" }}
                        >
                          Created{" "}
                          {new Date(perm.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── CLUSTER PERMISSIONS sub-tab ── */}
            {activitiesSubTab === "cluster_permissions" && (
              <div className="space-y-6">
                {/* Header description */}
                <div className="border border-sidebar-border bg-primary/10 p-5">
                  <p
                    className="text-[9px] tracking-[0.3em] uppercase text-accent font-bold mb-1"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    Cluster Permissions
                  </p>
                  <p
                    className="text-xs text-primary-foreground/55"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    Assign permissions to clusters. All guests in a cluster
                    inherit these permissions. Toggle a permission on or off —
                    changes apply instantly.
                  </p>
                </div>

                {clusterPermsLoading && (
                  <div className="flex items-center justify-center py-16">
                    <p
                      className="text-primary-foreground/40 text-xs tracking-widest uppercase animate-pulse"
                      style={{ fontFamily: "Lato,sans-serif" }}
                    >
                      Loading…
                    </p>
                  </div>
                )}

                {/* Auto-load on first visit to this sub-tab */}
                {!clusterPermsData && !clusterPermsLoading && (
                  <span
                    style={{ display: "none" }}
                    ref={(el) => {
                      if (!el) return;
                      setClusterPermsLoading(true);
                      fetch("/api/clusters/permissions")
                        .then((r) => r.json())
                        .then((d) => {
                          setClusterPermsData(d);
                          if (
                            d.clusters?.length > 0 &&
                            !selectedClusterForPerms
                          ) {
                            setSelectedClusterForPerms(d.clusters[0].id);
                          }
                        })
                        .catch(() => {})
                        .finally(() => setClusterPermsLoading(false));
                    }}
                  />
                )}

                {!clusterPermsLoading && clusterPermsData && (
                  <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
                    {/* Left: Cluster list */}
                    <div className="space-y-2">
                      <p
                        className="text-[9px] tracking-[0.25em] uppercase text-primary-foreground/50 font-bold px-1"
                        style={{ fontFamily: "Lato,sans-serif" }}
                      >
                        Select Cluster
                      </p>
                      {clusterPermsData.clusters.length === 0 ? (
                        <p
                          className="text-xs text-primary-foreground/40 px-1"
                          style={{ fontFamily: "Lato,sans-serif" }}
                        >
                          No clusters found.
                        </p>
                      ) : (
                        clusterPermsData.clusters.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setSelectedClusterForPerms(c.id)}
                            className={`w-full text-left px-4 py-3 border transition-all cursor-pointer ${
                              selectedClusterForPerms === c.id
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-sidebar-border bg-primary/10 text-primary-foreground/70 hover:border-sidebar-border/80 hover:text-primary-foreground"
                            }`}
                          >
                            <p
                              className="text-xs font-bold tracking-wide"
                              style={{ fontFamily: "Lato,sans-serif" }}
                            >
                              {c.name}
                            </p>
                            <p
                              className="text-[9px] text-primary-foreground/40 mt-0.5"
                              style={{ fontFamily: "DM Mono,monospace" }}
                            >
                              {c.permissions.length} permission
                              {c.permissions.length !== 1 ? "s" : ""} assigned
                            </p>
                          </button>
                        ))
                      )}
                    </div>

                    {/* Right: Permission toggles */}
                    <div>
                      {!selectedClusterForPerms ? (
                        <div className="flex items-center justify-center h-40 border border-sidebar-border bg-primary/10">
                          <p
                            className="text-primary-foreground/30 text-xs"
                            style={{ fontFamily: "Lato,sans-serif" }}
                          >
                            ← Select a cluster to manage its permissions
                          </p>
                        </div>
                      ) : (
                        (() => {
                          const activeCluster = clusterPermsData.clusters.find(
                            (c) => c.id === selectedClusterForPerms,
                          );
                          if (!activeCluster) return null;
                          const assignedPermIds = new Set(
                            activeCluster.permissions.map((p) => p.id),
                          );

                          return (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <p
                                  className="text-[9px] tracking-[0.25em] uppercase text-primary-foreground/50 font-bold"
                                  style={{ fontFamily: "Lato,sans-serif" }}
                                >
                                  Permissions for{" "}
                                  <span className="text-accent">
                                    {activeCluster.name}
                                  </span>
                                </p>
                                <span
                                  className="text-[9px] font-mono px-2 py-0.5 bg-accent/10 text-accent border border-accent/30"
                                  style={{ fontFamily: "DM Mono,monospace" }}
                                >
                                  {assignedPermIds.size} /{" "}
                                  {clusterPermsData.permissions.length} enabled
                                </span>
                              </div>

                              {clusterPermsData.permissions.length === 0 ? (
                                <div className="py-12 text-center border border-sidebar-border bg-primary/10">
                                  <p
                                    className="text-primary-foreground/40 text-xs"
                                    style={{ fontFamily: "Lato,sans-serif" }}
                                  >
                                    No permissions exist yet. Add permissions in
                                    the Permissions tab first.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {(() => {
                                    const viewAdminPerm =
                                      clusterPermsData.permissions.find(
                                        (p) =>
                                          p.name
                                            .toLowerCase()
                                            .replace(/\s/g, "_") ===
                                            "view_admin" ||
                                          p.name.toLowerCase() === "view admin",
                                      );
                                    const viewAdminEnabled = viewAdminPerm
                                      ? assignedPermIds.has(viewAdminPerm.id)
                                      : false;

                                    return clusterPermsData.permissions.map(
                                      (perm) => {
                                        const isViewAdmin =
                                          perm.name
                                            .toLowerCase()
                                            .replace(/\s/g, "_") ===
                                            "view_admin" ||
                                          perm.name.toLowerCase() ===
                                            "view admin";
                                        const isEnabled = assignedPermIds.has(
                                          perm.id,
                                        );
                                        const isToggling =
                                          togglingPerm === perm.id;
                                        // Non-view_admin perms are greyed out if view_admin is disabled
                                        const isLockedOut =
                                          !isViewAdmin && !viewAdminEnabled;

                                        const handleToggle = async () => {
                                          if (isToggling || isLockedOut) return;
                                          setTogglingPerm(perm.id);
                                          // Optimistic update
                                          setClusterPermsData((prev) => {
                                            if (!prev) return prev;
                                            return {
                                              ...prev,
                                              clusters: prev.clusters.map(
                                                (c) => {
                                                  if (
                                                    c.id !==
                                                    selectedClusterForPerms
                                                  )
                                                    return c;
                                                  return {
                                                    ...c,
                                                    permissions: isEnabled
                                                      ? c.permissions.filter(
                                                          (p) =>
                                                            p.id !== perm.id,
                                                        )
                                                      : [
                                                          ...c.permissions,
                                                          perm,
                                                        ],
                                                  };
                                                },
                                              ),
                                            };
                                          });
                                          try {
                                            if (isEnabled) {
                                              await fetch(
                                                `/api/clusters/permissions?clusterId=${selectedClusterForPerms}&permissionId=${perm.id}`,
                                                { method: "DELETE" },
                                              );
                                            } else {
                                              await fetch(
                                                "/api/clusters/permissions",
                                                {
                                                  method: "POST",
                                                  headers: {
                                                    "Content-Type":
                                                      "application/json",
                                                  },
                                                  body: JSON.stringify({
                                                    clusterId:
                                                      selectedClusterForPerms,
                                                    permissionId: perm.id,
                                                  }),
                                                },
                                              );
                                            }
                                          } catch {
                                            // Revert on failure
                                            setClusterPermsData((prev) => {
                                              if (!prev) return prev;
                                              return {
                                                ...prev,
                                                clusters: prev.clusters.map(
                                                  (c) => {
                                                    if (
                                                      c.id !==
                                                      selectedClusterForPerms
                                                    )
                                                      return c;
                                                    return {
                                                      ...c,
                                                      permissions: isEnabled
                                                        ? [
                                                            ...c.permissions,
                                                            perm,
                                                          ]
                                                        : c.permissions.filter(
                                                            (p) =>
                                                              p.id !== perm.id,
                                                          ),
                                                    };
                                                  },
                                                ),
                                              };
                                            });
                                          } finally {
                                            setTogglingPerm(null);
                                          }
                                        };

                                        return (
                                          <div
                                            key={perm.id}
                                            className={`flex items-center justify-between p-4 border transition-all ${
                                              isLockedOut
                                                ? "border-sidebar-border/30 bg-primary/5 opacity-40 pointer-events-none"
                                                : isEnabled
                                                  ? "border-emerald-500/40 bg-emerald-950/15"
                                                  : "border-sidebar-border bg-primary/10 hover:bg-primary/20"
                                            }`}
                                            title={
                                              isLockedOut
                                                ? 'Enable "View Admin" first to configure this permission'
                                                : undefined
                                            }
                                          >
                                            <div className="flex-1 min-w-0 mr-4">
                                              <p
                                                className={`text-sm font-bold ${
                                                  isLockedOut
                                                    ? "text-primary-foreground/30"
                                                    : isEnabled
                                                      ? "text-emerald-300"
                                                      : "text-primary-foreground/70"
                                                }`}
                                                style={{
                                                  fontFamily:
                                                    "DM Mono,monospace",
                                                }}
                                              >
                                                {perm.name}
                                              </p>
                                              {perm.description && (
                                                <p
                                                  className="text-[10px] text-primary-foreground/40 mt-0.5"
                                                  style={{
                                                    fontFamily:
                                                      "Lato,sans-serif",
                                                  }}
                                                >
                                                  {perm.description}
                                                </p>
                                              )}
                                              {isLockedOut && (
                                                <p
                                                  className="text-[9px] text-amber-400/60 mt-1"
                                                  style={{
                                                    fontFamily:
                                                      "Lato,sans-serif",
                                                  }}
                                                >
                                                  Requires View Admin to be
                                                  enabled
                                                </p>
                                              )}
                                            </div>
                                            {/* Toggle switch */}
                                            <button
                                              onClick={handleToggle}
                                              disabled={
                                                isToggling || isLockedOut
                                              }
                                              title={
                                                isLockedOut
                                                  ? "Enable View Admin first"
                                                  : isEnabled
                                                    ? "Click to revoke"
                                                    : "Click to grant"
                                              }
                                              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border-2 transition-colors ${
                                                isLockedOut
                                                  ? "bg-primary/20 border-sidebar-border/30 cursor-not-allowed"
                                                  : isEnabled
                                                    ? "bg-emerald-500 border-emerald-400 cursor-pointer"
                                                    : "bg-primary/40 border-sidebar-border cursor-pointer"
                                              } disabled:opacity-50`}
                                            >
                                              <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isEnabled ? "translate-x-5" : "translate-x-0.5"}`}
                                              />
                                            </button>
                                          </div>
                                        );
                                      },
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          );
                        })()
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Edit Guest Modal Overlay ── */}
      <AnimatePresence>
        {editingGuest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#07130A] border border-accent/40 p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <button
                type="button"
                onClick={() => setEditingGuest(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <DiamondOrnament size={10} color="#C9A84C" opacity={0.8} />
                <p
                  className="text-[10px] tracking-[0.4em] uppercase text-accent font-bold mt-2 mb-1"
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  Edit Guest Record
                </p>
                <h3
                  className="text-xl text-white font-serif italic"
                  style={{ fontFamily: "Playfair Display,serif" }}
                >
                  {editingGuest.name}
                </h3>
                {editingGuest.pin && (
                  <p className="text-[10px] text-accent/80 font-mono mt-1">
                    PIN Code: {editingGuest.pin}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    className="block text-[10px] uppercase tracking-wider text-accent mb-1 font-bold flex items-center justify-between"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    <span>PIN Code / Access Code</span>
                    <span className="text-[9px] text-muted-foreground font-normal">
                      Editable
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3DGA, NFH3, A000"
                    value={editForm.pin}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, pin: e.target.value }))
                    }
                    className="w-full bg-primary/40 border border-accent/60 px-3 py-2 text-xs text-primary-foreground focus:outline-none focus:border-accent font-mono uppercase tracking-wider font-bold"
                    style={{ fontFamily: "DM Mono,monospace" }}
                  />
                </div>

                <div>
                  <label
                    className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mr., Ms., Hon., Dr., H.E."
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, title: e.target.value }))
                    }
                    className="w-full bg-primary/40 border border-sidebar-border px-3 py-2 text-xs text-primary-foreground focus:outline-none focus:border-accent"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  />
                </div>

                <div>
                  <label
                    className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Guest full name"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="w-full bg-primary/40 border border-sidebar-border px-3 py-2 text-xs text-primary-foreground focus:outline-none focus:border-accent font-medium"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  />
                </div>

                <div>
                  <label
                    className="block text-[10px] uppercase tracking-wider text-accent mb-1 font-bold flex items-center justify-between"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    <span>Phone Number</span>
                    <span className="text-[9px] text-muted-foreground font-normal">
                      Editable
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0712345678 or +254..."
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    className="w-full bg-primary/40 border border-accent/60 px-3 py-2 text-xs text-primary-foreground focus:outline-none focus:border-accent font-mono"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  />
                </div>

                <div>
                  <label
                    className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    Cluster
                  </label>
                  <select
                    value={
                      editForm.clusterId ||
                      clusters.find(
                        (c: any) =>
                          c.name?.toLowerCase() ===
                          editForm.cluster?.toLowerCase(),
                      )?.id ||
                      ""
                    }
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedObj = clusters.find(
                        (c: any) => c.id === selectedId,
                      );
                      setEditForm((f) => ({
                        ...f,
                        clusterId: selectedId,
                        cluster: selectedObj ? selectedObj.name : "",
                      }));
                    }}
                    className="w-full bg-[#07130A] border border-sidebar-border px-3 py-2 text-xs text-primary-foreground focus:outline-none focus:border-accent"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    <option
                      value=""
                      disabled
                      className="bg-[#07130A] text-white"
                    >
                      Select a cluster...
                    </option>
                    {clusters.map((c: any) => (
                      <option
                        key={c.id}
                        value={c.id}
                        className="bg-[#07130A] text-white"
                      >
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    County / Country
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kenya, Tanzania"
                    value={editForm.country}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, country: e.target.value }))
                    }
                    className="w-full bg-primary/40 border border-sidebar-border px-3 py-2 text-xs text-primary-foreground focus:outline-none focus:border-accent"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-sidebar-border/40 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingGuest(null)}
                    className="px-4 py-2 text-xs uppercase tracking-wider border border-sidebar-border text-muted-foreground hover:text-white transition-colors cursor-pointer"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingEdit}
                    onClick={handleSaveEdit}
                    className="px-5 py-2 text-xs uppercase tracking-wider bg-accent text-accent-foreground font-bold hover:bg-accent/80 transition-colors cursor-pointer disabled:opacity-50"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    {savingEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Create Guest Modal Overlay ── */}
      <AnimatePresence>
        {showCreateGuestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#07130A] border border-accent/40 p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <button
                type="button"
                onClick={() => setShowCreateGuestModal(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <DiamondOrnament size={10} color="#C9A84C" opacity={0.8} />
                <p
                  className="text-[10px] tracking-[0.4em] uppercase text-accent font-bold mt-2 mb-1"
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  Create New Guest
                </p>
                <h3
                  className="text-xl text-white font-serif italic"
                  style={{ fontFamily: "Playfair Display,serif" }}
                >
                  Guest Registration
                </h3>
              </div>

              <form onSubmit={handleCreateGuestSubmit} className="space-y-4">
                <div>
                  <label
                    className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    Title
                  </label>
                  <select
                    value={
                      createGuestForm.titleId ||
                      titles.find(
                        (t: any) =>
                          t.name?.toLowerCase() ===
                          (createGuestForm.title || "").toLowerCase(),
                      )?.id ||
                      ""
                    }
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedObj = titles.find(
                        (t: any) => t.id === selectedId,
                      );
                      setCreateGuestForm((f) => ({
                        ...f,
                        titleId: selectedId,
                        title: selectedObj ? selectedObj.name : "",
                      }));
                    }}
                    className="w-full bg-[#07130A] border border-sidebar-border px-3 py-2 text-xs text-primary-foreground focus:outline-none focus:border-accent"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    <option value="" className="bg-[#07130A] text-white">
                      Select a Title (Optional)
                    </option>
                    {titles.map((t: any) => (
                      <option
                        key={t.id}
                        value={t.id}
                        className="bg-[#07130A] text-white"
                      >
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Guest full name"
                    value={createGuestForm.name}
                    onChange={(e) =>
                      setCreateGuestForm((f) => ({
                        ...f,
                        name: e.target.value,
                      }))
                    }
                    required
                    className="w-full bg-primary/40 border border-sidebar-border px-3 py-2 text-xs text-primary-foreground focus:outline-none focus:border-accent font-medium"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  />
                </div>

                <div>
                  <label
                    className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    Cluster
                  </label>
                  <select
                    value={
                      createGuestForm.clusterId ||
                      clusters.find(
                        (c: any) =>
                          c.name?.toLowerCase() ===
                          createGuestForm.cluster?.toLowerCase(),
                      )?.id ||
                      ""
                    }
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedObj = clusters.find(
                        (c: any) => c.id === selectedId,
                      );
                      setCreateGuestForm((f) => ({
                        ...f,
                        clusterId: selectedId,
                        cluster: selectedObj ? selectedObj.name : "Guests",
                      }));
                    }}
                    className="w-full bg-[#07130A] border border-sidebar-border px-3 py-2 text-xs text-primary-foreground focus:outline-none focus:border-accent"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    {clusters.map((c: any) => (
                      <option
                        key={c.id}
                        value={c.id}
                        className="bg-[#07130A] text-white"
                      >
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0712345678 or +254..."
                    value={createGuestForm.phone}
                    onChange={(e) =>
                      setCreateGuestForm((f) => ({
                        ...f,
                        phone: e.target.value,
                      }))
                    }
                    className="w-full bg-primary/40 border border-sidebar-border px-3 py-2 text-xs text-primary-foreground focus:outline-none focus:border-accent font-mono"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-sidebar-border/40 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateGuestModal(false)}
                    className="px-4 py-2 border border-sidebar-border text-[10px] uppercase tracking-wider text-muted-foreground hover:text-white transition-colors cursor-pointer"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingCreateGuest}
                    className="px-5 py-2 bg-accent text-accent-foreground text-[10px] uppercase tracking-wider font-bold hover:bg-accent/80 transition-colors cursor-pointer disabled:opacity-50"
                    style={{ fontFamily: "Lato,sans-serif" }}
                  >
                    {savingCreateGuest ? "Saving..." : "Create Guest"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Admin RSVP Modal Overlay ── */}
      <AnimatePresence>
        {rsvpModalGuest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#07130A] border border-[#C9A84C]/40 p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <button
                type="button"
                onClick={() => setRsvpModalGuest(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <DiamondOrnament size={10} color="#C9A84C" opacity={0.8} />
                <p
                  className="text-[10px] tracking-[0.4em] uppercase text-accent font-bold mt-2 mb-1"
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  Record RSVP Response
                </p>
                <h3
                  className="text-xl text-white font-serif italic"
                  style={{ fontFamily: "Playfair Display,serif" }}
                >
                  {rsvpModalGuest.name || rsvpModalGuest.fullName}
                </h3>
                {(rsvpModalGuest.pin || rsvpModalGuest.code) && (
                  <p
                    className="text-xs text-accent/80 font-mono mt-1"
                    style={{ fontFamily: "DM Mono,monospace" }}
                  >
                    PIN: #{rsvpModalGuest.pin || rsvpModalGuest.code}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
                <button
                  type="button"
                  disabled={!!submittingRsvp}
                  onClick={() => handleConfirmAdminRsvp(rsvpModalGuest, "yes")}
                  className="py-3.5 px-4 text-xs tracking-wider uppercase border border-emerald-500/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 transition-all duration-300 font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  {submittingRsvp === "yes" ? "Saving…" : "✓ Joyfully Accepts"}
                </button>
                <button
                  type="button"
                  disabled={!!submittingRsvp}
                  onClick={() => handleConfirmAdminRsvp(rsvpModalGuest, "no")}
                  className="py-3.5 px-4 text-xs tracking-wider uppercase border border-rose-500/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 transition-all duration-300 font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  {submittingRsvp === "no"
                    ? "Saving…"
                    : "✕ Regretfully Declines"}
                </button>
              </div>

              <div className="pt-4 mt-4 border-t border-sidebar-border/40 flex justify-end">
                <button
                  type="button"
                  onClick={() => setRsvpModalGuest(null)}
                  className="px-4 py-2 text-xs uppercase tracking-wider border border-sidebar-border text-muted-foreground hover:text-white transition-colors cursor-pointer"
                  style={{ fontFamily: "Lato,sans-serif" }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── App Root ──────────────────────────────────────────────────────────────────

export default function App() {
  // Always start with defaults — sessionStorage is client-only so must be
  // deferred to avoid SSR/hydration mismatch.
  const [screen, setScreen] = useState<Screen>("pin");
  const [guest, setGuest] = useState<GuestRecord | null>(null);
  const [pin, setPin] = useState("");
  const [pendingGuests, setPendingGuests] = useState<StoredGuest[]>([]);
  const [adminPermissions, setAdminPermissions] = useState<string[]>([]);
  const [sessionRestored, setSessionRestored] = useState(false);

  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore session from sessionStorage after client mount (avoids SSR mismatch)
  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      setScreen(saved.screen);
      setGuest(saved.guest);
      setPin(saved.pin);
      setPendingGuests(saved.pendingGuests);
      if (saved.adminPermissions) setAdminPermissions(saved.adminPermissions);
    }
    setSessionRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist session whenever state changes (only after initial restore)
  useEffect(() => {
    if (!sessionRestored) return;
    if (screen === "pin") {
      clearSession();
    } else {
      saveSession({
        screen,
        guest,
        pin,
        pendingGuests,
        adminPermissions,
        lastActivity: Date.now(),
      });
    }
  }, [screen, guest, pin, pendingGuests, adminPermissions, sessionRestored]);

  // Inactivity timer — reset on any user interaction
  const resetInactivity = () => {
    if (screen === "pin" || screen === "admin") return;
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    // Update lastActivity in session storage
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const data: PersistedSession = JSON.parse(raw);
        data.lastActivity = Date.now();
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
      }
    } catch {}
    inactivityTimer.current = setTimeout(() => {
      clearSession();
      setGuest(null);
      setPin("");
      setPendingGuests([]);
      setAdminPermissions([]);
      setScreen("pin");
    }, INACTIVITY_TIMEOUT_MS);
  };

  useEffect(() => {
    if (screen === "pin" || screen === "admin") {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      return;
    }
    const events = ["mousemove", "keydown", "touchstart", "click", "scroll"];
    events.forEach((e) =>
      window.addEventListener(e, resetInactivity, { passive: true }),
    );
    resetInactivity(); // start timer immediately
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetInactivity));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  const handlePinSuccess = (
    p: string,
    matches: StoredGuest[],
    isAdmin: boolean,
    permissions?: string[],
  ) => {
    if (isAdmin) {
      if (permissions) setAdminPermissions(permissions);
      setScreen("admin");
      return;
    }
    if (matches.length === 1) {
      setGuest(matches[0]);
      setPin(p);
      setScreen("invitation");
    } else if (matches.length > 1) {
      setPendingGuests(matches);
      setPin(p);
      setScreen("select");
    }
  };

  const handleGuestSelect = (g: StoredGuest) => {
    setGuest(g);
    setScreen("invitation");
  };

  return (
    <div className="size-full">
      <AnimatePresence mode="wait">
        {screen === "pin" && (
          <motion.div
            key="pin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <PinGate onSuccess={handlePinSuccess} />
          </motion.div>
        )}
        {screen === "select" && (
          <motion.div
            key="select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GuestSelector
              guests={pendingGuests}
              onSelect={handleGuestSelect}
              onHelpRsvp={(g) => {
                setGuest(g);
                setPin(g.pin);
                setScreen("rsvp");
              }}
              onBack={() => setScreen("pin")}
            />
          </motion.div>
        )}
        {screen === "invitation" && guest && (
          <motion.div
            key="inv"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
          >
            <InvitationScreen
              guest={guest}
              onRSVP={() => setScreen("rsvp")}
              onExit={() => setScreen("pin")}
            />
          </motion.div>
        )}
        {screen === "rsvp" && guest && (
          <motion.div
            key="rsvp"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <RSVPForm
              guest={guest}
              pin={pin}
              onConfirmed={() => setScreen("confirmed")}
              onBack={() => setScreen("invitation")}
            />
          </motion.div>
        )}
        {screen === "confirmed" && guest && (
          <motion.div
            key="conf"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ConfirmedScreen
              guest={guest}
              onBack={() => setScreen("invitation")}
            />
          </motion.div>
        )}
        {screen === "admin" && (
          <motion.div
            key="admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AdminDashboard
              onExit={() => setScreen("pin")}
              adminPermissions={adminPermissions}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
