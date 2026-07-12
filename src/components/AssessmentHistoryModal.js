import { C, ASSESSMENT_MOVEMENTS, ASSESSMENT_MAX, PERFORMANCE_TESTS } from "../constants";
import { computeMovementScore, movementLevel, fmtDate } from "../helpers";
import { Avatar, Btn } from "./common";

// ─── ASSESSMENT HISTORY MODAL ─────────────────────────────────────────────────
function AssessmentHistoryModal({ athlete, assessments, onDelete, onClose }) {
  const cellVal = (v) => v === 0 || v === 1 || v === 2 ? v : "—";
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 100, overflowY: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "calc(24px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom))" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 18, width: "100%", maxWidth: 680, padding: 26 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}><Avatar name={athlete.name} size={40} />
            <div><h2 style={{ margin: 0, color: C.white, fontSize: 18, fontWeight: 800 }}>{athlete.name}</h2><p style={{ margin: "2px 0 0", color: C.muted, fontSize: 12 }}>Assessment history</p></div></div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 24, cursor: "pointer" }}>×</button>
        </div>
        {assessments.map((as) => {
          const { total, pain, complete } = computeMovementScore(as.movement);
          const level = movementLevel(total, pain);
          return (
            <div key={as.id} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 16px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9, flexWrap: "wrap", gap: 6 }}>
                <span style={{ color: C.white, fontWeight: 800, fontSize: 14 }}>{fmtDate(as.date)}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: level.color, background: `${level.color}18`, border: `1px solid ${level.color}44`, borderRadius: 20, padding: "2px 10px" }}>{level.label}</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: C.white }}>{total}<span style={{ fontSize: 11, color: C.muted }}>/{ASSESSMENT_MAX}</span></span>
                  {!complete && <span style={{ fontSize: 11, color: C.gold }}>incomplete</span>}
                  <button onClick={() => { if (window.confirm("Delete this assessment?")) onDelete(as.id); }} style={{ background: "none", border: "none", color: C.red, fontSize: 17, cursor: "pointer", padding: "0 2px", lineHeight: 1 }}>×</button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 5, marginBottom: 8 }}>
                {ASSESSMENT_MOVEMENTS.map((m) => (
                  <div key={m.key} style={{ background: C.surfaceUp, borderRadius: 7, padding: "5px 9px" }}>
                    <p style={{ margin: 0, fontSize: 10, color: C.muted }}>{m.label}</p>
                    <p style={{ margin: "1px 0 0", fontSize: 13, fontWeight: 800, color: C.white }}>
                      {m.bilateral ? <>L {cellVal(as.movement?.[m.key + "L"])} · R {cellVal(as.movement?.[m.key + "R"])}</> : cellVal(as.movement?.[m.key])}
                    </p>
                  </div>
                ))}
              </div>
              {PERFORMANCE_TESTS.some((t) => as.performance?.[t.key]) && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                  {PERFORMANCE_TESTS.filter((t) => as.performance?.[t.key]).map((t) => (
                    <span key={t.key} style={{ fontSize: 11, color: C.mutedUp, background: C.surfaceUp, borderRadius: 4, padding: "2px 8px" }}>{t.label}: <strong style={{ color: C.white }}>{as.performance[t.key]}</strong> {t.unit}</span>
                  ))}
                </div>
              )}
              {as.notes && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.teal, fontStyle: "italic" }}>"{as.notes}"</p>}
            </div>
          );
        })}
        <div style={{ display: "flex", justifyContent: "flex-end" }}><Btn variant="ghost" onClick={onClose}>Close</Btn></div>
      </div>
    </div>
  );
}

export { AssessmentHistoryModal };
