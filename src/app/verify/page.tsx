"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, AlertCircle, RefreshCw, ArrowLeft, Armchair } from "lucide-react";


function OrnamentalRule({ wide = false }: { wide?: boolean }) {
  const w = wide ? 320 : 220;
  return (
    <svg viewBox={`0 0 ${w} 16`} style={{ width: wide ? 280 : 200, height: 14 }} fill="none">
      <line x1="0" y1="8" x2={w / 2 - 18} y2="8" stroke="#C9A84C" strokeWidth="0.7" strokeOpacity="0.55" />
      <path d={`M${w/2 - 10} 8 L${w/2 - 5} 3 L${w/2} 8 L${w/2 - 5} 13 Z`} fill="#C9A84C" fillOpacity="0.5" />
      <circle cx={w / 2} cy="8" r="3.5" fill="#C9A84C" fillOpacity="0.85" />
      <path d={`M${w/2 + 10} 8 L${w/2 + 5} 3 L${w/2} 8 L${w/2 + 5} 13 Z`} fill="#C9A84C" fillOpacity="0.5" />
      <line x1={w / 2 + 18} y1="8" x2={w} y2="8" stroke="#C9A84C" strokeWidth="0.7" strokeOpacity="0.55" />
    </svg>
  );
}

function CornerOrnament({ flip = false }: { flip?: boolean }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ transform: flip ? "scaleX(-1)" : undefined }}>
      <path d="M4 4 L4 22" stroke="#C9A84C" strokeWidth="0.8" strokeOpacity="0.6" />
      <path d="M4 4 L22 4" stroke="#C9A84C" strokeWidth="0.8" strokeOpacity="0.6" />
      <path d="M4 4 L18 18" stroke="#C9A84C" strokeWidth="0.5" strokeOpacity="0.3" />
      <circle cx="4" cy="4" r="2.5" fill="#C9A84C" fillOpacity="0.7" />
      <circle cx="4" cy="14" r="1" fill="#C9A84C" fillOpacity="0.4" />
      <circle cx="14" cy="4" r="1" fill="#C9A84C" fillOpacity="0.4" />
    </svg>
  );
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [loading, setLoading] = useState(true);
  const [delegate, setDelegate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!code) {
      setLoading(false);
      return;
    }

    async function fetchGuest() {
      try {
        const res = await fetch(`/api/qr/verify?code=${encodeURIComponent(code!)}`);
        const data = await res.json();
        if (!res.ok || data.error) {
          setError(data.error || "Guest not found.");
        } else {
          setDelegate(data);
        }
      } catch (err) {
        setError("Failed to connect to verification server.");
      } finally {
        setLoading(false);
      }
    }

    fetchGuest();
  }, [code]);

  const handleConfirmCheckin = async () => {
    if (!delegate || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/qr/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: delegate.code || code, delegateId: delegate.id }),
      });
      const data = await res.json();
      if (res.ok && (data.checkedIn || data.delegate)) {
        setDelegate((prev: any) => ({
          ...prev,
          checkedIn: true,
          status: "CHECKED_IN",
        }));
      } else {
        setError(data.error || "Failed to confirm attendance.");
      }
    } catch (err) {
      setError("Network error confirming attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-card border border-sidebar-border rounded-lg max-w-md w-full text-center space-y-4 shadow-2xl">
        <RefreshCw className="w-8 h-8 text-accent animate-spin" />
        <h2 className="text-xs tracking-widest text-accent uppercase font-mono">Verifying Guest Badge...</h2>
        <p className="text-xs text-muted-foreground font-mono">CODE #{code}</p>
      </div>
    );
  }

  if (!code || error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-card border border-sidebar-border rounded-lg max-w-md w-full text-center space-y-4 shadow-2xl">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl text-foreground" style={{ fontFamily: "Playfair Display,serif" }}>{error || "No Code Provided"}</h2>
        <p className="text-xs text-muted-foreground" style={{ fontFamily: "Lato,sans-serif" }}>
          Please verify the guest code or scan a valid QR code badge.
        </p>
        <Link href="/" className="mt-4 px-6 py-3 bg-accent text-accent-foreground text-xs uppercase tracking-widest hover:bg-accent/80 transition-colors flex items-center gap-2 font-semibold" style={{ fontFamily: "Lato,sans-serif" }}>
          <ArrowLeft className="w-4 h-4" /> Return to Main Platform
        </Link>
      </div>
    );
  }

  const isCheckedIn = delegate?.checkedIn || delegate?.status === "CHECKED_IN";
  const tableName = typeof delegate?.table === "object" ? delegate.table?.name : delegate?.table;

  return (
    <div className={`w-full max-w-sm border p-6 shadow-2xl space-y-4 relative overflow-hidden rounded-lg transition-all ${
      isCheckedIn ? "bg-emerald-950/30 border-emerald-400/80 shadow-[0_0_25px_rgba(16,185,129,0.3)]" : "bg-primary/95 border-sidebar-border"
    }`}>
      {/* Corner Ornaments */}
      <div className="absolute top-2 left-2 opacity-30"><CornerOrnament /></div>
      <div className="absolute top-2 right-2 opacity-30"><CornerOrnament flip /></div>

      {/* Top Header */}
      <div className="text-center pt-1">
        <p className="text-[9px] tracking-[0.4em] text-accent uppercase font-bold" style={{ fontFamily: "Lato,sans-serif" }}>
          Attendance Verification Desk
        </p>
        <div className="flex justify-center my-1.5"><OrnamentalRule /></div>
      </div>

      {/* High Visibility Status Banner */}
      {isCheckedIn ? (
        <div className="px-4 py-2.5 bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 rounded flex items-center justify-between font-bold text-xs tracking-wider shadow-md">
          <span className="flex items-center gap-2 text-xs font-black">
            ✓ ALREADY CHECKED IN
          </span>
          <span className="text-[9px] text-emerald-200 uppercase tracking-widest bg-emerald-900/60 px-2 py-0.5 rounded">Verified</span>
        </div>
      ) : (
        <div className="px-4 py-2 bg-accent/10 border border-accent/30 text-accent rounded flex items-center justify-between font-semibold text-xs tracking-wider">
          <span>READY FOR CHECK-IN</span>
          <span className="text-[9px] uppercase tracking-widest text-accent/70">Pending Arrival</span>
        </div>
      )}

      {/* Code & Status Header */}
      <div className="flex items-center justify-between border-b border-sidebar-border pb-3">
        <div className="px-3 py-1 bg-accent/10 border border-accent/30 rounded">
          <span className="font-mono text-xs text-accent font-extrabold tracking-wider">
            CODE #{delegate.code || code}
          </span>
        </div>

        <span className={`inline-flex items-center gap-1 px-3 py-1 text-[9px] uppercase tracking-widest border font-black ${
          isCheckedIn ? "bg-emerald-500 text-slate-950 border-emerald-400" : "bg-card text-muted-foreground border-sidebar-border"
        }`} style={{ fontFamily: "Lato,sans-serif" }}>
          {isCheckedIn ? "✓ CHECKED IN" : "INVITED"}
        </span>
      </div>

      {/* Guest Name & Details */}
      <div className="space-y-2 py-1">
        <h1 className="text-2xl md:text-3xl text-foreground font-bold" style={{ fontFamily: "Playfair Display,serif" }}>
          {delegate.name}
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 bg-card border border-sidebar-border text-[10px] text-primary-foreground/80 uppercase tracking-wider font-semibold" style={{ fontFamily: "Lato,sans-serif" }}>
            {delegate.role || "Honored Guest"}
          </span>
          {tableName && (
            <span className="px-2.5 py-0.5 bg-accent/10 border border-accent/30 text-accent text-[10px] flex items-center gap-1 font-bold" style={{ fontFamily: "Lato,sans-serif" }}>
              <Armchair className="w-3 h-3 text-accent" />
              Table: {tableName}
            </span>
          )}
        </div>
      </div>

      {/* Giant Confirm Attendance Button */}
      <button
        onClick={handleConfirmCheckin}
        disabled={submitting}
        className={`w-full py-4 text-xs uppercase tracking-[0.25em] font-black transition-all duration-300 flex items-center justify-center gap-2 border cursor-pointer shadow-lg ${
          isCheckedIn
            ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400"
            : "bg-accent text-accent-foreground border-accent hover:bg-accent/90"
        }`}
        style={{ fontFamily: "Lato,sans-serif" }}
      >
        {submitting ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Check className="w-4 h-4 stroke-[3]" />
            {isCheckedIn ? "✓ ALREADY CHECKED IN (Click to Re-confirm)" : "CONFIRM ATTENDANCE"}
          </>
        )}
      </button>

      {/* Navigation link */}
      <div className="text-center pt-2 border-t border-sidebar-border">
        <Link href="/" className="text-[9px] tracking-widest text-primary-foreground/40 hover:text-accent uppercase transition-colors" style={{ fontFamily: "Lato,sans-serif" }}>
          ← Back to Main Platform
        </Link>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden">
      <Suspense fallback={<div className="text-accent text-xs font-mono">Loading guest verification...</div>}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
