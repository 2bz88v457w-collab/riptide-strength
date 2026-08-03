import { useState } from "react";
import { C, STROKES, DISTANCES } from "../constants";
import { uid, today, fmtDate } from "../helpers";
import { AssessmentTab } from "./AssessmentTab";
import { AttendanceTab } from "./AttendanceTab";
import { BuilderModal } from "./BuilderModal";
import { EditAthleteModal } from "./EditAthleteModal";
import { ProgressDashboard } from "./ProgressDashboard";
import { ProgressionTab } from "./ProgressionTab";
import { SessionDetailModal } from "./SessionDetailModal";
import { TestScoreModal } from "./TestScoreModal";
import { Avatar, Btn, StatCard } from "./common";

// ─── COACH APP ────────────────────────────────────────────────────────────────
function CoachApp({ athletes, workouts, logs, testScores, progressions, assessments, onSaveAssessment, onDeleteAssessment, onSaveProgressions, onDeleteProgression, onSaveWorkout, onDeleteWorkout, onUpdateAthlete, onDeleteAthlete, onAddAthlete, onSaveTestScore, onBulkTag, onLogout }) {
  const [tab, setTab] = useState("workouts");
  const [showBuilder, setShowBuilder] = useState(false);
  const [editWkt, setEditWkt] = useState(null);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [editAthlete, setEditAthlete] = useState(null);
  const [showAddAthlete, setShowAddAthlete] = useState(false);
  const [showTestEntry, setShowTestEntry] = useState(false);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [newAthlete, setNewAthlete] = useState({ name: "", event: "", pin: "" });
  const [adding, setAdding] = useState(false);
  const [rosterFilter, setRosterFilter] = useState("All");
  const [rosterSort, setRosterSort] = useState("alpha");
  const [rosterSearch, setRosterSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [seasonFilter, setSeasonFilter] = useState("All");
  // Tag filters are multi-select with OR semantics (an athlete matches if they
  // carry ANY selected tag), and they narrow within the single-select filter
  // above (group / school / champ / stroke / distance).
  const [tagFilters, setTagFilters] = useState([]);
  const toggleTagFilter = (t) => setTagFilters((f) => f.includes(t) ? f.filter((x) => x !== t) : [...f, t]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkTag, setBulkTag] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  // Distinct seasons, newest first (ordered by each season's most recent workout date).
  const seasons = [...new Set([...workouts].sort((a, b) => b.date.localeCompare(a.date)).map((w) => w.season).filter(Boolean))];
  const latestSeason = seasons[0] || "";
  const seasonWorkouts = seasonFilter === "All" ? workouts : workouts.filter((w) => w.season === seasonFilter);
  const poolGroups = [...new Set(athletes.map((a) => a.event).filter(Boolean))];
  const schools = [...new Set(athletes.filter((a) => !a.archived).map((a) => a.school).filter(Boolean))].sort();
  const champTags = ["Regional", "State"].filter((tag) => athletes.some((a) => a.champTag === tag && !a.archived));

  const activeAthletes = athletes.filter((a) => !a.archived);
  const rosterSpecialties = [...STROKES.map((s) => ["stroke", s, "🏊"]), ...DISTANCES.map((d) => ["distance", d, "⏱"])].filter(([f, v]) => activeAthletes.some((a) => a[f] === v));
  // Custom tags: an athlete can carry any number, alongside pool group + champ tag.
  const allTags = [...new Set(athletes.flatMap((a) => a.tags ?? []))].sort();
  const rosterTags = allTags.filter((t) => activeAthletes.some((a) => (a.tags ?? []).includes(t)));
  const toggleSelect = (id) => setSelectedIds((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const applyBulkTag = async (mode) => {
    if (!bulkTag.trim() || !selectedIds.length) return;
    setBulkBusy(true);
    const ok = await onBulkTag(selectedIds, bulkTag.trim(), mode);
    setBulkBusy(false);
    if (ok) setBulkTag("");
  };
  const archivedAthletes = athletes.filter((a) => a.archived);

  const applyFilter = (list) => {
    let result = list;
    if (rosterFilter !== "All") {
      if (rosterFilter === "Regional" || rosterFilter === "State") result = result.filter((a) => a.champTag === rosterFilter);
      else if (schools.includes(rosterFilter)) result = result.filter((a) => a.school === rosterFilter);
      else if (STROKES.includes(rosterFilter)) result = result.filter((a) => a.stroke === rosterFilter);
      else if (DISTANCES.includes(rosterFilter)) result = result.filter((a) => a.distance === rosterFilter);
      else result = result.filter((a) => a.event === rosterFilter);
    }
    if (tagFilters.length) result = result.filter((a) => (a.tags ?? []).some((t) => tagFilters.includes(t)));
    if (rosterSearch) result = result.filter((a) => a.name.toLowerCase().includes(rosterSearch.toLowerCase()) || a.school?.toLowerCase().includes(rosterSearch.toLowerCase()));
    if (rosterSort === "alpha") result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    else if (rosterSort === "group") result = [...result].sort((a, b) => (a.event || "").localeCompare(b.event || "") || a.name.localeCompare(b.name));
    return result;
  };

  const filteredAthletes = applyFilter(activeAthletes);
  const handleAddAthlete = async () => { if (!newAthlete.name || !newAthlete.pin) return; setAdding(true); await onAddAthlete({ id: uid(), ...newAthlete }); setNewAthlete({ name: "", event: "", pin: "" }); setShowAddAthlete(false); setAdding(false); };
  const inp = { background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", width: "100%" };

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "env(safe-area-inset-top) 20px 0" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", minHeight: 58, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "4px 10px", padding: "8px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: C.teal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.bg} strokeWidth="2.5" strokeLinecap="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg></div>
            <span style={{ fontWeight: 900, fontSize: 16, color: C.white, whiteSpace: "nowrap" }}>Riptide <span style={{ color: C.teal }}>Strength</span></span>
            <span style={{ fontSize: 11, background: C.tealGlow, color: C.teal, border: `1px solid ${C.borderBright}`, borderRadius: 20, padding: "2px 10px", fontWeight: 700 }}>Coach</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: "100%", minWidth: 0 }}>
            <div style={{ display: "flex", background: C.bg, borderRadius: 30, padding: 3, overflowX: "auto", maxWidth: "100%" }}>
              {["workouts","roster","logs","attendance","bumps","Assessments","progress"].map((t) => <button key={t} onClick={() => { setTab(t); setSelectedAthlete(null); }} style={{ border: "none", borderRadius: 26, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: tab === t ? C.teal : "transparent", color: tab === t ? C.bg : C.muted, transition: "all .15s", textTransform: "capitalize", whiteSpace: "nowrap", flexShrink: 0 }}>{t}</button>)}
            </div>
            <button onClick={onLogout} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 12, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>Log out</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "26px 20px calc(26px + env(safe-area-inset-bottom))" }}>

        {tab === "workouts" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div><h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.white }}>Workouts</h1><p style={{ margin: "4px 0 0", color: C.muted, fontSize: 13 }}>{workouts.length} total · {logs.length} sessions logged</p></div>
              <Btn onClick={() => { setEditWkt(null); setShowBuilder(true); }}>+ New workout</Btn>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
              <StatCard label="Workouts" value={workouts.length} />
              <StatCard label="Athletes" value={athletes.length} />
              <StatCard label="Sessions logged" value={logs.length} accent={logs.length > 0 ? C.teal : undefined} />
              <StatCard label="This week" value={workouts.filter((w) => { const diff = (Date.now() - new Date(w.date + "T12:00:00")) / 86400000; return diff >= 0 && diff < 7; }).length} />
            </div>
            {seasons.length > 0 && (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 16 }}>
                {["All", ...seasons].map((s) => (
                  <button key={s} onClick={() => setSeasonFilter(s)} style={{ border: `1px solid ${seasonFilter === s ? C.teal : C.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: seasonFilter === s ? C.tealGlow : "transparent", color: seasonFilter === s ? C.teal : C.mutedUp }}>{s}{s !== "All" && ` (${workouts.filter((w) => w.season === s).length})`}</button>
                ))}
              </div>
            )}
            {seasonWorkouts.length === 0 && <div style={{ textAlign: "center", padding: "56px 0", color: C.muted }}><p style={{ fontSize: 40, margin: "0 0 10px" }}>🏋️</p><p style={{ margin: 0 }}>{workouts.length === 0 ? "No workouts yet." : "No workouts in this season."}</p></div>}
            {[...seasonWorkouts].sort((a, b) => b.date.localeCompare(a.date)).map((wkt) => {
              const totalEx = wkt.blocks?.reduce((s, b) => s + b.exercises.length, 0) || 0;
              const supersetCount = wkt.blocks?.reduce((s, b) => { const p = new Set(b.exercises.filter((e) => e.pairId).map((e) => e.pairId)); return s + p.size; }, 0) || 0;
              const wktLogs = logs.filter((l) => l.workoutId === wkt.id);
              const names = wkt.assignees?.map((id) => athletes.find((a) => a.id === id)?.name.split(" ")[0]).filter(Boolean) || [];
              return (
                <div key={wkt.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px", marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <p style={{ margin: 0, fontWeight: 700, color: C.white, fontSize: 15 }}>{wkt.title}</p>
                      <p style={{ margin: "3px 0 8px", fontSize: 12, color: C.muted }}>{fmtDate(wkt.date)} · {totalEx} exercises{supersetCount > 0 && <span style={{ color: C.gold, marginLeft: 6 }}>· {supersetCount} superset{supersetCount > 1 ? "s" : ""}</span>} · {wktLogs.length}/{wkt.assignees?.length || 0} logged</p>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{names.slice(0, 8).map((n) => <span key={n} style={{ fontSize: 11, background: C.tealGlow, color: C.teal, border: `1px solid ${C.border}`, borderRadius: 20, padding: "2px 9px" }}>{n}</span>)}{names.length > 8 && <span style={{ fontSize: 11, color: C.muted }}>+{names.length - 8} more</span>}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                      <Btn variant="ghost" small onClick={() => { setEditWkt(wkt); setShowBuilder(true); }}>Edit</Btn>
                      <Btn variant="ghost" small onClick={() => { const copy = { ...JSON.parse(JSON.stringify(wkt)), id: uid(), title: wkt.title + " — Copy", date: today(), assignees: [] }; setEditWkt(copy); setShowBuilder(true); }}>Duplicate</Btn>
                      <button onClick={() => { if (window.confirm(`Delete "${wkt.title}"? Athletes' logged sessions for it will lose their workout details.`)) onDeleteWorkout(wkt.id); }} style={{ background: "none", border: "none", color: C.red, fontSize: 20, cursor: "pointer", padding: "0 4px" }}>×</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "roster" && !selectedAthlete && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div><h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.white }}>Roster</h1><p style={{ margin: "3px 0 0", color: C.muted, fontSize: 13 }}>{activeAthletes.length} active{archivedAthletes.length > 0 ? ` · ${archivedAthletes.length} archived` : ""}</p></div>
              <Btn small onClick={() => setShowAddAthlete(true)}>+ Add athlete</Btn>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
              <input value={rosterSearch} onChange={(e) => setRosterSearch(e.target.value)} placeholder="Search name or school…" style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "7px 12px", fontSize: 13, fontFamily: "inherit", flex: 1 }} />
              <div style={{ display: "flex", background: C.bg, borderRadius: 8, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                {[["alpha","A–Z"],["group","Group"]].map(([val, label]) => (
                  <button key={val} onClick={() => setRosterSort(val)} style={{ border: "none", padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: rosterSort === val ? C.teal : "transparent", color: rosterSort === val ? C.bg : C.muted }}>{label}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 18 }}>
              {(() => { const showingAll = rosterFilter === "All" && !tagFilters.length; return (
                <button onClick={() => { setRosterFilter("All"); setTagFilters([]); }} style={{ border: `1px solid ${showingAll ? C.teal : C.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: showingAll ? C.tealGlow : "transparent", color: showingAll ? C.teal : C.mutedUp }}>All ({activeAthletes.length})</button>
              ); })()}
              {poolGroups.map((g) => <button key={g} onClick={() => setRosterFilter(g)} style={{ border: `1px solid ${rosterFilter === g ? C.teal : C.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: rosterFilter === g ? C.tealGlow : "transparent", color: rosterFilter === g ? C.teal : C.mutedUp }}>{g} ({activeAthletes.filter((a) => a.event === g).length})</button>)}
              {schools.length > 0 && <div style={{ width: 1, background: C.border, margin: "0 3px" }} />}
              {schools.map((s) => <button key={s} onClick={() => setRosterFilter(s)} style={{ border: `1px solid ${rosterFilter === s ? C.teal : C.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: rosterFilter === s ? C.tealGlow : "transparent", color: rosterFilter === s ? C.teal : C.mutedUp }}>{s.replace(" High School","").replace(" Middle School","")} ({activeAthletes.filter((a) => a.school === s).length})</button>)}
              {champTags.length > 0 && <div style={{ width: 1, background: C.border, margin: "0 3px" }} />}
              {champTags.map((tag) => <button key={tag} onClick={() => setRosterFilter(tag)} style={{ border: `1px solid ${rosterFilter === tag ? C.gold : C.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: rosterFilter === tag ? `${C.gold}22` : "transparent", color: rosterFilter === tag ? C.gold : C.mutedUp }}>🏆 {tag} ({activeAthletes.filter((a) => a.champTag === tag).length})</button>)}
              {rosterSpecialties.length > 0 && <div style={{ width: 1, background: C.border, margin: "0 3px" }} />}
              {rosterSpecialties.map(([field, val, icon]) => <button key={field + val} onClick={() => setRosterFilter(val)} style={{ border: `1px solid ${rosterFilter === val ? C.teal : C.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: rosterFilter === val ? C.tealGlow : "transparent", color: rosterFilter === val ? C.teal : C.mutedUp }}>{icon} {val} ({activeAthletes.filter((a) => a[field] === val).length})</button>)}
              {rosterTags.length > 0 && <div style={{ width: 1, background: C.border, margin: "0 3px" }} />}
              {rosterTags.map((t) => { const on = tagFilters.includes(t); return <button key={"tag-" + t} onClick={() => toggleTagFilter(t)} title={on ? `Remove "${t}" from the filter` : `Add "${t}" to the filter (matches any selected tag)`} style={{ border: `1px solid ${on ? C.teal : C.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: on ? C.tealGlow : "transparent", color: on ? C.teal : C.mutedUp }}>{on ? "✓ " : "🏷 "}{t} ({activeAthletes.filter((a) => (a.tags ?? []).includes(t)).length})</button>; })}
              {tagFilters.length > 1 && <span style={{ fontSize: 11, color: C.muted, alignSelf: "center" }}>any of {tagFilters.length} tags</span>}
            </div>
            {selectedIds.length > 0 && (
              <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.teal, whiteSpace: "nowrap" }}>{selectedIds.length} selected</span>
                <input value={bulkTag} onChange={(e) => setBulkTag(e.target.value)} list="tagbank-bulk" placeholder="tag, e.g. aug-clinic" style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "6px 10px", fontSize: 13, fontFamily: "inherit", flex: 1, minWidth: 140 }} />
                <datalist id="tagbank-bulk">{allTags.map((t) => <option key={t} value={t} />)}</datalist>
                <Btn small onClick={() => applyBulkTag("add")} disabled={!bulkTag.trim() || bulkBusy}>{bulkBusy ? "Working…" : "Add tag to selected"}</Btn>
                <Btn small variant="ghost" onClick={() => applyBulkTag("remove")} disabled={!bulkTag.trim() || bulkBusy}>Remove tag from selected</Btn>
                <button onClick={() => setSelectedIds([])} style={{ background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Clear</button>
              </div>
            )}
            {filteredAthletes.length === 0 && <p style={{ color: C.muted, textAlign: "center", padding: "32px 0" }}>No athletes match this filter.</p>}
            {filteredAthletes.map((a) => {
              const aWkts = workouts.filter((w) => w.assignees?.includes(a.id));
              const aLogs = logs.filter((l) => l.athleteId === a.id);
              return (
                <div key={a.id} style={{ background: C.surface, border: `1px solid ${selectedIds.includes(a.id) ? C.borderBright : C.border}`, borderRadius: 14, padding: "12px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
                  <button onClick={() => toggleSelect(a.id)} aria-label={`Select ${a.name}`} style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${selectedIds.includes(a.id) ? C.teal : C.muted}`, background: selectedIds.includes(a.id) ? C.teal : "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>{selectedIds.includes(a.id) && <span style={{ color: C.bg, fontSize: 11, fontWeight: 900 }}>✓</span>}</button>
                  <div onClick={() => setSelectedAthlete(a)} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, cursor: "pointer" }}>
                    <Avatar name={a.name} size={42} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                        <p style={{ margin: 0, fontWeight: 700, color: C.white, fontSize: 14 }}>{a.name}</p>
                        {a.champTag && <span style={{ fontSize: 10, fontWeight: 700, color: C.gold, background: `${C.gold}1A`, border: `1px solid ${C.gold}44`, borderRadius: 10, padding: "1px 6px" }}>🏆 {a.champTag}</span>}
                        {a.grade && <span style={{ fontSize: 10, color: C.mutedUp, background: C.surfaceUp, borderRadius: 10, padding: "1px 6px" }}>{a.grade}</span>}
                        {(a.tags ?? []).map((t) => <span key={t} style={{ fontSize: 10, fontWeight: 700, color: C.teal, background: C.tealGlow, border: `1px solid ${C.border}`, borderRadius: 10, padding: "1px 6px" }}>🏷 {t}</span>)}
                      </div>
                      <p style={{ margin: "2px 0 0", color: C.muted, fontSize: 11 }}>{[a.event || "No group", a.school, a.stroke, a.distance].filter(Boolean).join(" · ")}</p>
                    </div>
                    <div style={{ display: "flex", gap: 16, textAlign: "center", marginRight: 6 }}>
                      <div><p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.white }}>{aWkts.length}</p><p style={{ margin: 0, fontSize: 10, color: C.muted }}>wkts</p></div>
                      <div><p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: aLogs.length ? C.teal : C.muted }}>{aLogs.length}</p><p style={{ margin: 0, fontSize: 10, color: C.muted }}>logged</p></div>
                    </div>
                  </div>
                  <button onClick={() => setEditAthlete(a)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.mutedUp, fontSize: 12, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>Edit</button>
                </div>
              );
            })}
            {archivedAthletes.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <button onClick={() => setShowArchived((v) => !v)} style={{ background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 10 }}>{showArchived ? "▾" : "▸"} Archived ({archivedAthletes.length})</button>
                {showArchived && archivedAthletes.map((a) => (
                  <div key={a.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12, opacity: 0.55 }}>
                    <Avatar name={a.name} size={38} />
                    <div style={{ flex: 1 }}><p style={{ margin: 0, fontWeight: 600, color: C.white, fontSize: 14 }}>{a.name}</p><p style={{ margin: "2px 0 0", color: C.muted, fontSize: 11 }}>{a.event}{a.school ? ` · ${a.school}` : ""}</p></div>
                    <button onClick={() => setEditAthlete(a)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.mutedUp, fontSize: 12, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
                  </div>
                ))}
              </div>
            )}
            {showAddAthlete && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 18, width: "100%", maxWidth: 400, padding: 26 }}>
                  <h2 style={{ margin: "0 0 20px", color: C.white, fontSize: 18, fontWeight: 800 }}>Add athlete</h2>
                  {[["Full name","name","text","Maya Chen"],["Pool group","event","text","8 Lane"],["PIN","pin","text","1234"]].map(([label,key,type,ph]) => (
                    <div key={key} style={{ marginBottom: 14 }}><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>{label.toUpperCase()}</label><input type={type} value={newAthlete[key]} onChange={(e) => setNewAthlete((n) => ({ ...n, [key]: e.target.value }))} placeholder={ph} style={inp} /></div>
                  ))}
                  <div style={{ display: "flex", gap: 10 }}><Btn variant="ghost" onClick={() => setShowAddAthlete(false)} style={{ flex: 1 }}>Cancel</Btn><Btn onClick={handleAddAthlete} disabled={!newAthlete.name || !newAthlete.pin || adding} style={{ flex: 1 }}>{adding ? "Adding…" : "Add athlete"}</Btn></div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "roster" && selectedAthlete && (() => {
          const aWkts = workouts.filter((w) => w.assignees?.includes(selectedAthlete.id)).sort((a, b) => b.date.localeCompare(a.date));
          const aLogs = logs.filter((l) => l.athleteId === selectedAthlete.id);
          return (
            <div>
              <button onClick={() => setSelectedAthlete(null)} style={{ background: "none", border: "none", color: C.teal, cursor: "pointer", fontSize: 13, marginBottom: 18, padding: 0, fontFamily: "inherit" }}>← Back to roster</button>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <Avatar name={selectedAthlete.name} size={56} />
                <div style={{ flex: 1 }}><h2 style={{ margin: 0, color: C.white, fontSize: 22, fontWeight: 900 }}>{selectedAthlete.name}</h2><p style={{ margin: "4px 0 0", color: C.muted, fontSize: 13 }}>{[selectedAthlete.event || "No group", selectedAthlete.stroke, selectedAthlete.distance].filter(Boolean).join(" · ")}</p></div>
                <Btn variant="ghost" small onClick={() => setEditAthlete(selectedAthlete)}>Edit athlete</Btn>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 24 }}>
                <StatCard label="Assigned" value={aWkts.length} />
                <StatCard label="Logged" value={aLogs.length} accent={aLogs.length > 0 ? C.teal : undefined} />
                <StatCard label="Avg RPE" value={aLogs.filter((l) => l.rpe).length ? (aLogs.reduce((s, l) => s + (parseFloat(l.rpe) || 0), 0) / aLogs.filter((l) => l.rpe).length).toFixed(1) : "—"} accent={C.gold} />
              </div>
              {aWkts.map((wkt) => {
                const log = aLogs.find((l) => l.workoutId === wkt.id);
                return (
                  <div key={wkt.id} style={{ background: C.surface, border: `1px solid ${log ? C.teal : C.border}`, borderRadius: 14, padding: "14px 18px", marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div><p style={{ margin: 0, fontWeight: 700, color: C.white }}>{wkt.title}</p><p style={{ margin: "3px 0 0", fontSize: 12, color: C.muted }}>{fmtDate(wkt.date)}</p></div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {log && <Btn variant="ghost" small onClick={() => setSessionDetail({ log, workout: wkt, athlete: selectedAthlete })}>View session</Btn>}
                        <span style={{ fontSize: 12, fontWeight: 700, color: log ? C.teal : C.muted }}>{log ? "✓ Logged" : "Not logged"}</span>
                      </div>
                    </div>
                    {log && <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>{log.rpe && <span style={{ fontSize: 13, color: C.gold, fontWeight: 700, marginRight: 14 }}>RPE {log.rpe}/10</span>}{log.note && <span style={{ fontSize: 13, color: C.mutedUp, fontStyle: "italic" }}>"{log.note}"</span>}</div>}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {tab === "logs" && (
          <div>
            <h1 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 900, color: C.white }}>All session logs</h1>
            {logs.length === 0 && <p style={{ color: C.muted, textAlign: "center", padding: "48px 0" }}>No sessions logged yet.</p>}
            {[...logs].sort((a, b) => b.loggedAt - a.loggedAt).map((log, i) => {
              const logAthlete = athletes.find((a) => a.id === log.athleteId);
              const wkt = workouts.find((w) => w.id === log.workoutId);
              if (!logAthlete || !wkt) return null;
              return (
                <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 18px", marginBottom: 10, display: "flex", gap: 14, alignItems: "center" }}>
                  <Avatar name={logAthlete.name} size={42} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 700, color: C.white, fontSize: 14 }}>{logAthlete.name} <span style={{ color: C.muted, fontWeight: 400 }}>logged</span> {wkt.title}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 12, color: C.muted }}>{fmtDate(log.date)}{log.rpe && <span style={{ color: C.gold, fontWeight: 700, marginLeft: 8 }}>RPE {log.rpe}</span>}</p>
                    {log.note && <p style={{ margin: "5px 0 0", fontSize: 13, color: C.mutedUp, fontStyle: "italic" }}>"{log.note}"</p>}
                  </div>
                  <Btn variant="ghost" small onClick={() => setSessionDetail({ log, workout: wkt, athlete: logAthlete })}>View</Btn>
                </div>
              );
            })}
          </div>
        )}

        {tab === "attendance" && (
          <AttendanceTab athletes={activeAthletes} workouts={workouts} logs={logs} />
        )}

        {tab === "bumps" && (
          <ProgressionTab athletes={activeAthletes} progressions={progressions} logs={logs} workouts={workouts} onSave={onSaveProgressions} onDelete={onDeleteProgression} />
        )}

        {tab === "Assessments" && (
          <AssessmentTab athletes={activeAthletes} assessments={assessments} onSaveAssessment={onSaveAssessment} onDeleteAssessment={onDeleteAssessment} />
        )}

        {tab === "progress" && (
          <ProgressDashboard athletes={athletes} testScores={testScores} onEnterScores={() => setShowTestEntry(true)} />
        )}

      </div>

      {showBuilder && <BuilderModal athletes={athletes} defaultSeason={latestSeason} onSave={async (wkt) => { await onSaveWorkout(wkt); setShowBuilder(false); setEditWkt(null); }} onClose={() => { setShowBuilder(false); setEditWkt(null); }} editWkt={editWkt} />}
      {editAthlete && <EditAthleteModal athlete={editAthlete} allTags={allTags} onSave={async (updated) => { await onUpdateAthlete(updated); setEditAthlete(null); if (selectedAthlete?.id === updated.id) setSelectedAthlete(updated); }} onArchive={async () => { await onUpdateAthlete({ ...editAthlete, archived: true }); setEditAthlete(null); if (selectedAthlete?.id === editAthlete.id) setSelectedAthlete(null); }} onUnarchive={async () => { await onUpdateAthlete({ ...editAthlete, archived: false }); setEditAthlete(null); }} onDelete={async () => { await onDeleteAthlete(editAthlete.id); setEditAthlete(null); if (selectedAthlete?.id === editAthlete.id) setSelectedAthlete(null); }} onClose={() => setEditAthlete(null)} />}
      {sessionDetail && <SessionDetailModal log={sessionDetail.log} workout={sessionDetail.workout} athlete={sessionDetail.athlete} onClose={() => setSessionDetail(null)} />}
      {showTestEntry && <TestScoreModal athletes={athletes} onSave={async (score) => { await onSaveTestScore(score); setShowTestEntry(false); }} onClose={() => setShowTestEntry(false)} />}
    </div>
  );
}

export { CoachApp };
