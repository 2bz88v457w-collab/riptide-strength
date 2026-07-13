import { useState } from "react";
import { C } from "../constants";
import { fmtDate, today } from "../helpers";
import { AthletePRCard, AthleteProgressCard } from "./AthleteCards";
import { LogModal } from "./LogModal";
import { SwimmerProfileModal } from "./SwimmerProfileModal";
import { Avatar, StatCard } from "./common";

// ─── ATHLETE APP ──────────────────────────────────────────────────────────────
function AthleteApp({ athlete, workouts, logs, testScores, progressions, onConsumeProgressions, onLog, onUpdateAthlete, onLogout }) {
  const myWorkouts = workouts.filter((w) => w.assignees?.includes(athlete.id)).sort((a, b) => b.date.localeCompare(a.date));
  const myLogs = logs.filter((l) => l.athleteId === athlete.id);
  const [logTarget, setLogTarget] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  // Week helpers (weeks start Monday)
  const weekStartKey = (dateStr) => {
    const d = new Date(dateStr + "T12:00:00");
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    return d.toISOString().slice(0, 10);
  };
  const thisWeekKey = weekStartKey(today());
  const lastWeekKey = (() => { const d = new Date(thisWeekKey + "T12:00:00"); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10); })();
  const weekLabel = (key) => key === thisWeekKey ? "This week" : key === lastWeekKey ? "Last week" : `Week of ${fmtDate(key)}`;

  // Up Next = newest unlogged workout dated today or earlier, so workouts
  // built out in advance don't take over the hero; if nothing is due yet,
  // fall back to the soonest upcoming one (myWorkouts is sorted newest-first)
  const todayKey = today();
  const unlogged = myWorkouts.filter((w) => !myLogs.some((l) => l.workoutId === w.id));
  const upNext = unlogged.find((w) => w.date <= todayKey) || unlogged[unlogged.length - 1];
  const historyWorkouts = myWorkouts.filter((w) => w.id !== upNext?.id);

  // Group history by week, newest week first
  const weekGroups = [];
  historyWorkouts.forEach((w) => {
    const key = weekStartKey(w.date);
    let group = weekGroups.find((g) => g.key === key);
    if (!group) { group = { key, workouts: [] }; weekGroups.push(group); }
    group.workouts.push(w);
  });
  weekGroups.sort((a, b) => b.key.localeCompare(a.key));

  const [expandedWeeks, setExpandedWeeks] = useState(() => new Set([thisWeekKey]));
  const toggleWeek = (key) => setExpandedWeeks((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const upNextEx = upNext?.blocks?.reduce((s, b) => s + b.exercises.length, 0) || 0;
  const upNextSupers = upNext?.blocks?.reduce((s, b) => { const p = new Set(b.exercises.filter((e) => e.pairId).map((e) => e.pairId)); return s + p.size; }, 0) || 0;

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "env(safe-area-inset-top) 20px 0" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={athlete.name} size={34} /><div><p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: C.white }}>{athlete.name}</p><p style={{ margin: 0, fontSize: 11, color: C.muted }}>{athlete.grade ? `${athlete.grade} · ` : ""}{athlete.school || athlete.event}</p></div></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowProfile(true)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.mutedUp, fontSize: 12, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}>Profile</button>
            <button onClick={onLogout} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 12, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}>Log out</button>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px calc(24px + env(safe-area-inset-bottom))" }}>

        {/* UP NEXT hero */}
        {upNext ? (
          <div style={{ background: `linear-gradient(135deg, ${C.surfaceUp}, ${C.surface})`, border: `1px solid ${C.borderBright}`, borderRadius: 18, padding: "20px 22px", marginBottom: 20, boxShadow: `0 0 40px ${C.tealGlow}` }}>
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 800, color: C.teal, textTransform: "uppercase", letterSpacing: ".08em" }}>Up next</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.white }}>{upNext.title}</p>
            <p style={{ margin: "5px 0 16px", fontSize: 13, color: C.muted }}>{fmtDate(upNext.date)} · {upNextEx} exercises{upNextSupers > 0 && <span style={{ color: C.gold }}> · {upNextSupers} superset{upNextSupers > 1 ? "s" : ""}</span>}</p>
            <button onClick={() => setLogTarget({ wkt: upNext, existingLog: null })} style={{ background: C.teal, color: C.bg, border: "none", borderRadius: 12, padding: "13px 0", fontWeight: 900, fontSize: 15, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>Start logging →</button>
          </div>
        ) : myWorkouts.length > 0 && (
          <div style={{ background: C.surface, border: `1px solid ${C.teal}55`, borderRadius: 18, padding: "18px 22px", marginBottom: 20, textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.teal }}>✓ You're all caught up</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: C.muted }}>Every assigned workout is logged. Nice work.</p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
          <StatCard label="Workouts" value={myWorkouts.length} />
          <StatCard label="Logged" value={myLogs.length} accent={myLogs.length > 0 ? C.teal : undefined} />
          <StatCard label="Avg RPE" value={myLogs.filter((l) => l.rpe).length ? (myLogs.reduce((s, l) => s + (parseFloat(l.rpe) || 0), 0) / myLogs.filter((l) => l.rpe).length).toFixed(1) : "—"} accent={C.gold} />
        </div>
        <AthleteProgressCard athlete={athlete} testScores={testScores} />
        <AthletePRCard athlete={athlete} logs={logs} workouts={workouts} />

        {/* Weekly grouped history */}
        {myWorkouts.length === 0 && <p style={{ color: C.muted, textAlign: "center", padding: "40px 0" }}>No workouts assigned yet — check back soon.</p>}
        {weekGroups.length > 0 && <h3 style={{ fontSize: 12, color: C.muted, margin: "0 0 12px", letterSpacing: ".06em", textTransform: "uppercase" }}>History</h3>}
        {weekGroups.map((group) => {
          const open = expandedWeeks.has(group.key);
          const loggedCount = group.workouts.filter((w) => myLogs.some((l) => l.workoutId === w.id)).length;
          return (
            <div key={group.key} style={{ marginBottom: 10 }}>
              <button onClick={() => toggleWeek(group.key)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: open ? "12px 12px 0 0" : 12, padding: "11px 16px", cursor: "pointer", fontFamily: "inherit" }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: C.white }}>{open ? "▾" : "▸"} {weekLabel(group.key)}</span>
                <span style={{ fontSize: 11, color: loggedCount === group.workouts.length ? C.teal : C.muted, fontWeight: 700 }}>{loggedCount}/{group.workouts.length} logged</span>
              </button>
              {open && (
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderTop: "none", borderRadius: "0 0 12px 12px", padding: "6px 8px" }}>
                  {group.workouts.map((wkt) => {
                    const log = myLogs.find((l) => l.workoutId === wkt.id);
                    return (
                      <button key={wkt.id} onClick={() => setLogTarget({ wkt, existingLog: log })} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "transparent", border: "none", borderRadius: 8, padding: "9px 8px", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                        <span style={{ fontSize: 14, color: log ? C.teal : C.muted, width: 18, flexShrink: 0 }}>{log ? "✓" : "○"}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{wkt.title}</p>
                          <p style={{ margin: "1px 0 0", fontSize: 11, color: C.muted }}>{fmtDate(wkt.date)}</p>
                        </div>
                        {log?.rpe && <span style={{ fontSize: 11, color: C.gold, fontWeight: 700, flexShrink: 0 }}>RPE {log.rpe}</span>}
                        <span style={{ fontSize: 11, color: C.mutedUp, flexShrink: 0 }}>{log ? "View" : "Log"} ›</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {logTarget && <LogModal workout={logTarget.wkt} athleteId={athlete.id} existingLog={logTarget.existingLog} allLogs={logs} allWorkouts={workouts} progressions={progressions} onConsumeProgressions={onConsumeProgressions} onSave={async (d) => { const ok = await onLog(d); if (ok !== false) setLogTarget(null); return ok; }} onClose={() => setLogTarget(null)} />}
      {showProfile && <SwimmerProfileModal athlete={athlete} onSave={onUpdateAthlete} onClose={() => setShowProfile(false)} />}
    </div>
  );
}

export { AthleteApp };
