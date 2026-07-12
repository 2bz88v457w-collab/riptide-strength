import { useState } from "react";
import { C, TEST_METRICS } from "../constants";
import { fmtDate, computePRs } from "../helpers";

// ─── ATHLETE PROGRESS CARD ────────────────────────────────────────────────────
function AthleteProgressCard({ athlete, testScores }) {
  const myScores = testScores.filter((s) => s.athleteId === athlete.id).sort((a, b) => a.date.localeCompare(b.date));
  if (myScores.length === 0) return null;
  const latest = myScores[myScores.length - 1];
  const first = myScores[0];
  const hasDelta = myScores.length >= 2;
  const getDelta = (key) => { if (!hasDelta || !latest[key] || !first[key]) return null; const diff = latest[key] - first[key]; const pct = ((diff / first[key]) * 100).toFixed(0); return { diff, pct }; };
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: `0 0 30px ${C.tealGlow}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div><p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.teal, textTransform: "uppercase", letterSpacing: ".06em" }}>Your progress</p>{hasDelta ? <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>{fmtDate(first.date)} → {fmtDate(latest.date)}</p> : <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>Baseline — {fmtDate(latest.date)}</p>}</div>
        <span style={{ fontSize: 11, color: C.muted }}>{myScores.length} test{myScores.length !== 1 ? "s" : ""}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {TEST_METRICS.map((m) => {
          const val = latest[m.key];
          const d = getDelta(m.key);
          if (!val) return <div key={m.key} style={{ background: C.bg, borderRadius: 10, padding: "12px 10px", textAlign: "center", border: `1px solid ${C.border}` }}><p style={{ margin: 0, fontSize: 10, color: C.muted, textTransform: "uppercase" }}>{m.label}</p><p style={{ margin: "6px 0 0", fontSize: 18, color: C.muted }}>—</p></div>;
          return (
            <div key={m.key} style={{ background: C.bg, borderRadius: 10, padding: "12px 10px", textAlign: "center", border: `1px solid ${m.color}33` }}>
              <p style={{ margin: 0, fontSize: 10, color: m.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>{m.label}</p>
              <p style={{ margin: "6px 0 2px", fontSize: 24, fontWeight: 900, color: C.white }}>{val}{m.key === "rdl" && <span style={{ fontSize: 11, color: C.muted, fontWeight: 400, marginLeft: 3 }}>lbs</span>}</p>
              {d && <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: d.diff >= 0 ? C.teal : C.red }}>{d.diff >= 0 ? "+" : ""}{d.diff} ({d.diff >= 0 ? "+" : ""}{d.pct}%)</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ATHLETE PR CARD ──────────────────────────────────────────────────────────
function AthletePRCard({ athlete, logs, workouts }) {
  const [expanded, setExpanded] = useState(false);
  const prs = computePRs(athlete.id, logs, workouts);
  const entries = Object.entries(prs).sort((a, b) => b[1].date.localeCompare(a[1].date));
  if (entries.length === 0) return null;
  const daysAgo = (d) => Math.floor((Date.now() - new Date(d + "T12:00:00")) / 86400000);
  const recent = entries.filter(([, v]) => daysAgo(v.date) <= 14);
  const shown = expanded ? entries : entries.slice(0, 4);
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 20px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.gold, textTransform: "uppercase", letterSpacing: ".06em" }}>🔥 Your PRs</p>
        <span style={{ fontSize: 11, color: C.muted }}>{entries.length} movement{entries.length !== 1 ? "s" : ""}{recent.length > 0 ? ` · ${recent.length} new` : ""}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {shown.map(([exName, v]) => {
          const isNew = daysAgo(v.date) <= 14;
          return (
            <div key={exName} style={{ background: C.bg, borderRadius: 10, padding: "10px 12px", border: `1px solid ${isNew ? `${C.gold}55` : C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.white, lineHeight: 1.3 }}>{exName}</p>
                {isNew && <span style={{ fontSize: 9, fontWeight: 800, color: C.gold, background: `${C.gold}1A`, borderRadius: 8, padding: "1px 6px", flexShrink: 0 }}>NEW</span>}
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 900, color: isNew ? C.gold : C.white }}>{v.best}<span style={{ fontSize: 10, color: C.muted, fontWeight: 400, marginLeft: 3 }}>lbs</span></p>
              <p style={{ margin: "1px 0 0", fontSize: 10, color: C.muted }}>{fmtDate(v.date)}</p>
            </div>
          );
        })}
      </div>
      {entries.length > 4 && (
        <button onClick={() => setExpanded((v) => !v)} style={{ background: "none", border: "none", color: C.teal, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", padding: "10px 0 0", width: "100%", textAlign: "center" }}>
          {expanded ? "Show less" : `Show all ${entries.length}`}
        </button>
      )}
    </div>
  );
}

export { AthletePRCard, AthleteProgressCard };
