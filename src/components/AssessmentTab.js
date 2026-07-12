import { useState } from "react";
import { C, ASSESSMENT_MOVEMENTS, ASSESSMENT_MAX } from "../constants";
import { computeMovementScore, movementLevel, fmtDate } from "../helpers";
import { AssessmentHistoryModal } from "./AssessmentHistoryModal";
import { AssessmentModal } from "./AssessmentModal";
import { Avatar, Btn } from "./common";

// ─── ASSESSMENT TAB ───────────────────────────────────────────────────────────
function AssessmentTab({ athletes, assessments, onSaveAssessment, onDeleteAssessment }) {
  const [showEntry, setShowEntry] = useState(false);
  const [detail, setDetail] = useState(null); // athlete whose history is open

  // Latest assessment per athlete, plus previous for the trend arrow.
  const byAthlete = {};
  [...assessments].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)).forEach((as) => {
    (byAthlete[as.athleteId] = byAthlete[as.athleteId] || []).push(as);
  });

  const rows = athletes.map((a) => {
    const hist = byAthlete[a.id] || [];
    const latest = hist[hist.length - 1];
    const prev = hist[hist.length - 2];
    const score = latest ? computeMovementScore(latest.movement) : null;
    const prevScore = prev ? computeMovementScore(prev.movement) : null;
    const level = score ? movementLevel(score.total, score.pain) : null;
    return { athlete: a, latest, hist, score, prevScore, level };
  });

  const buckets = [
    { label: "Pain flagged", color: C.red, test: (r) => r.score?.pain, note: "Address before loading — program mobility / see guide notes" },
    { label: "Level 1", color: "#A78BFA", test: (r) => r.level?.label === "Level 1", note: "Most mobility & function work (score ≤ 17)" },
    { label: "Level 2", color: C.gold, test: (r) => r.level?.label === "Level 2", note: "Score 18–21" },
    { label: "Level 3", color: C.teal, test: (r) => r.level?.label === "Level 3", note: "Score 22–24 — ready to load" },
    { label: "Not assessed", color: C.muted, test: (r) => !r.latest, note: "" },
  ];

  const painCells = (movement) => ASSESSMENT_MOVEMENTS.flatMap((m) => (m.bilateral ? [["L", m.key + "L"], ["R", m.key + "R"]] : [["", m.key]])
    .filter(([, k]) => movement?.[k] === 0).map(([side]) => m.label + (side ? ` (${side})` : "")));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div><h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.white }}>Movement assessments</h1>
          <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 13 }}>{assessments.length} assessment{assessments.length !== 1 ? "s" : ""} · grouped by movement level to guide mobility & function work</p></div>
        <Btn onClick={() => setShowEntry(true)}>+ New assessment</Btn>
      </div>

      {buckets.map((bucket) => {
        const bucketRows = rows.filter((r) => bucket.test(r) && (bucket.label !== "Not assessed" || true));
        if (bucketRows.length === 0) return null;
        return (
          <div key={bucket.label} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: bucket.color, textTransform: "uppercase", letterSpacing: ".05em" }}>{bucket.label} ({bucketRows.length})</h3>
              {bucket.note && <span style={{ fontSize: 11, color: C.muted }}>{bucket.note}</span>}
            </div>
            {bucketRows.map(({ athlete, latest, score, prevScore, hist }) => {
              const diff = score && prevScore ? score.total - prevScore.total : null;
              const pains = latest ? painCells(latest.movement) : [];
              return (
                <div key={athlete.id} onClick={() => latest && setDetail(athlete)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 16px", marginBottom: 6, display: "flex", alignItems: "center", gap: 12, cursor: latest ? "pointer" : "default" }}>
                  <Avatar name={athlete.name} size={36} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 700, color: C.white, fontSize: 14 }}>{athlete.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>
                      {latest ? <>{fmtDate(latest.date)} · {hist.length} assessment{hist.length !== 1 ? "s" : ""}{!score.complete && <span style={{ color: C.gold }}> · incomplete</span>}</> : athlete.event || ""}
                    </p>
                    {pains.length > 0 && <p style={{ margin: "3px 0 0", fontSize: 11, color: C.red }}>Pain: {pains.join(", ")}</p>}
                  </div>
                  {latest && <>
                    {diff !== null && diff !== 0 && <span style={{ fontSize: 13, fontWeight: 800, color: diff > 0 ? C.teal : C.red }}>{diff > 0 ? "▲" : "▼"}{Math.abs(diff)}</span>}
                    <span style={{ fontSize: 18, fontWeight: 900, color: C.white }}>{score.total}<span style={{ fontSize: 11, color: C.muted }}>/{ASSESSMENT_MAX}</span></span>
                  </>}
                </div>
              );
            })}
          </div>
        );
      })}

      {showEntry && <AssessmentModal athletes={athletes} onSave={async (a) => { await onSaveAssessment(a); setShowEntry(false); }} onClose={() => setShowEntry(false)} />}
      {detail && <AssessmentHistoryModal athlete={detail} assessments={(byAthlete[detail.id] || []).slice().reverse()} onDelete={onDeleteAssessment} onClose={() => setDetail(null)} />}
    </div>
  );
}

export { AssessmentTab };
