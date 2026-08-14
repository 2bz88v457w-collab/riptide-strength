import { useState } from "react";
import { C, STROKES, DISTANCES } from "../constants";
import { computeAttention, ATTENTION } from "../helpers";
import { Avatar } from "./common";

const FLAG_STYLE = {
  quiet: { color: C.red, icon: "◷" },
  ramp: { color: C.gold, icon: "▲" },
  flat: { color: "#A78BFA", icon: "▬" },
};

// Triage view: who to chase, who might be overreaching, who is coasting.
// Athletes with nothing worth flagging never appear.
function AttentionTab({ athletes, workouts, logs }) {
  const [groupFilter, setGroupFilter] = useState("All");
  const poolGroups = [...new Set(athletes.map((a) => a.event).filter(Boolean))];
  const tags = [...new Set(athletes.flatMap((a) => a.tags ?? []))].sort();

  const inGroup = (a) => {
    if (groupFilter === "All") return true;
    if (tags.includes(groupFilter)) return (a.tags ?? []).includes(groupFilter);
    if (STROKES.includes(groupFilter)) return a.stroke === groupFilter;
    if (DISTANCES.includes(groupFilter)) return a.distance === groupFilter;
    return a.event === groupFilter;
  };
  const roster = athletes.filter(inGroup);
  const rows = computeAttention(roster, workouts, logs);
  const count = (kind) => rows.filter((r) => r.flags.some((f) => f.kind === kind)).length;

  const pill = (label, active, onClick, key) => (
    <button key={key} onClick={onClick} style={{ border: `1px solid ${active ? C.teal : C.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: active ? C.tealGlow : "transparent", color: active ? C.teal : C.mutedUp }}>{label}</button>
  );

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.white }}>Needs attention</h1>
        <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 13 }}>
          Athletes who missed assigned sessions, whose RPE is climbing, or whose RPE has gone flat and low.
          Anyone not listed is fine.
        </p>
      </div>

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 16 }}>
        {pill("Everyone", groupFilter === "All", () => setGroupFilter("All"), "g-all")}
        {poolGroups.map((g) => pill(g, groupFilter === g, () => setGroupFilter(g), "g-" + g))}
        {tags.map((t) => pill(`🏷 ${t}`, groupFilter === t, () => setGroupFilter(t), "t-" + t))}
      </div>

      {rows.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 18 }}>
          {[["Not logging", count("quiet"), C.red], ["RPE climbing", count("ramp"), C.gold], ["RPE flat & low", count("flat"), "#A78BFA"]].map(([label, n, color]) => (
            <div key={label} style={{ background: C.surfaceUp, borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.border}` }}>
              <p style={{ margin: 0, fontSize: 11, color: C.muted, letterSpacing: ".06em", textTransform: "uppercase" }}>{label}</p>
              <p style={{ margin: "5px 0 0", fontSize: 26, fontWeight: 800, color: n ? color : C.muted }}>{n}</p>
            </div>
          ))}
        </div>
      )}

      {rows.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: C.muted }}>
          <p style={{ fontSize: 32, margin: "0 0 8px" }}>✓</p>
          <p style={{ margin: 0, color: C.teal, fontWeight: 700 }}>Nobody needs attention right now.</p>
          <p style={{ margin: "6px 0 0", fontSize: 12 }}>
            Athletes appear here when they miss assigned sessions, or once {ATTENTION.minRpeSessions}+ of their sessions
            carry an RPE and the trend shifts.
          </p>
        </div>
      )}

      {rows.map(({ athlete: a, flags, logCount }) => (
        <div key={a.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", marginBottom: 8, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <Avatar name={a.name} size={38} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
              <p style={{ margin: 0, fontWeight: 700, color: C.white, fontSize: 14 }}>{a.name}</p>
              {(a.tags ?? []).map((t) => <span key={t} style={{ fontSize: 10, fontWeight: 700, color: C.teal, background: C.tealGlow, border: `1px solid ${C.border}`, borderRadius: 10, padding: "1px 6px" }}>🏷 {t}</span>)}
            </div>
            <p style={{ margin: "2px 0 6px", fontSize: 11, color: C.muted }}>{[a.event, `${logCount} session${logCount === 1 ? "" : "s"} logged all-time`].filter(Boolean).join(" · ")}</p>
            {flags.map((f) => {
              const st = FLAG_STYLE[f.kind] || { color: C.muted, icon: "•" };
              return (
                <div key={f.kind} style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 4 }}>
                  <span style={{ color: st.color, fontSize: 11, flexShrink: 0 }}>{st.icon}</span>
                  <p style={{ margin: 0, fontSize: 12.5 }}>
                    <span style={{ color: st.color, fontWeight: 700 }}>{f.label}</span>
                    <span style={{ color: C.mutedUp }}> — {f.detail}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export { AttentionTab };
