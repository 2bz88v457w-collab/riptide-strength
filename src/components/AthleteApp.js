import { useState } from "react";
import { C } from "../constants";
import { fmtDate } from "../helpers";
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
          <StatCard label="Workouts" value={myWorkouts.length} />
          <StatCard label="Logged" value={myLogs.length} accent={myLogs.length > 0 ? C.teal : undefined} />
          <StatCard label="Avg RPE" value={myLogs.filter((l) => l.rpe).length ? (myLogs.reduce((s, l) => s + (parseFloat(l.rpe) || 0), 0) / myLogs.filter((l) => l.rpe).length).toFixed(1) : "—"} accent={C.gold} />
        </div>
        <AthleteProgressCard athlete={athlete} testScores={testScores} />
        <AthletePRCard athlete={athlete} logs={logs} workouts={workouts} />
        <h3 style={{ fontSize: 12, color: C.muted, margin: "0 0 12px", letterSpacing: ".06em", textTransform: "uppercase" }}>Your workouts</h3>
        {myWorkouts.length === 0 && <p style={{ color: C.muted, textAlign: "center", padding: "40px 0" }}>No workouts assigned yet — check back soon.</p>}
        {myWorkouts.map((wkt) => {
          const log = myLogs.find((l) => l.workoutId === wkt.id);
          const totalEx = wkt.blocks?.reduce((s, b) => s + b.exercises.length, 0) || 0;
          const supersetCount = wkt.blocks?.reduce((s, b) => { const p = new Set(b.exercises.filter((e) => e.pairId).map((e) => e.pairId)); return s + p.size; }, 0) || 0;
          return (
            <div key={wkt.id} style={{ background: C.surface, border: `1px solid ${log ? C.teal : C.border}`, borderRadius: 14, padding: "16px 18px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div><p style={{ margin: 0, fontWeight: 700, color: C.white, fontSize: 15 }}>{wkt.title}</p><p style={{ margin: "3px 0 0", fontSize: 12, color: C.muted }}>{fmtDate(wkt.date)} · {totalEx} exercises{supersetCount > 0 && <span style={{ color: C.gold, marginLeft: 6 }}>· {supersetCount} superset{supersetCount > 1 ? "s" : ""}</span>}</p></div>
                <button onClick={() => setLogTarget({ wkt, existingLog: log })} style={{ background: log ? "transparent" : C.teal, color: log ? C.teal : C.bg, border: `1px solid ${C.teal}`, borderRadius: 9, padding: "7px 16px", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, marginLeft: 12 }}>{log ? "View log" : "Log session"}</button>
              </div>
              {log && <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 10, display: "flex", gap: 16, flexWrap: "wrap" }}>{log.rpe && <span style={{ fontSize: 12, color: C.gold, fontWeight: 700 }}>RPE {log.rpe}/10</span>}{log.note && <span style={{ fontSize: 12, color: C.mutedUp, fontStyle: "italic" }}>"{log.note.slice(0, 90)}{log.note.length > 90 ? "…" : ""}"</span>}</div>}
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
