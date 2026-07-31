import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";
import { sessionRole, signOut } from "./lib/auth";
import { rosterAdmin } from "./lib/rosterAdmin";
import { C } from "./constants";
import { LoginScreen } from "./components/LoginScreen";
import { CoachApp } from "./components/CoachApp";
import { AthleteApp } from "./components/AthleteApp";

// Surface a failed Supabase write to the user and the console. Local state is
// only updated after a successful write so the UI never drifts from the DB.
function reportDbError(action, error) {
  console.error(`${action} failed:`, error);
  alert(`${action} failed: ${error.message}`);
}

// JSON-string columns are parsed on read and stringified on write.
const parseWorkout = (w) => ({ ...w, blocks: typeof w.blocks === "string" ? JSON.parse(w.blocks) : w.blocks, assignees: typeof w.assignees === "string" ? JSON.parse(w.assignees) : w.assignees });
const parseLog = (l) => ({ ...l, sets: typeof l.sets === "string" ? JSON.parse(l.sets) : l.sets, blockNotes: typeof l.blockNotes === "string" && l.blockNotes ? JSON.parse(l.blockNotes) : l.blockNotes });
const parseAssessment = (a) => ({ ...a, movement: typeof a.movement === "string" ? JSON.parse(a.movement) : a.movement, performance: typeof a.performance === "string" && a.performance ? JSON.parse(a.performance) : a.performance });

const LoadingScreen = () => (
  <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
    <div style={{ width: 44, height: 44, borderRadius: 10, background: C.teal, display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.bg} strokeWidth="2.5" strokeLinecap="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg></div>
    <p style={{ color: C.muted, fontSize: 14, margin: 0, fontFamily: "system-ui" }}>Loading Riptide Strength…</p>
  </div>
);

export default function App() {
  // authSession: undefined = still checking storage, null = signed out.
  const [authSession, setAuthSession] = useState(undefined);
  const [athletes, setAthletes] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [testScores, setTestScores] = useState([]);
  const [progressions, setProgressions] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setAuthSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // Data is fetched once signed in; RLS decides what each role can see, so the
  // same queries serve both coach and athlete.
  const userId = authSession?.user?.id;
  useEffect(() => {
    if (!userId) { setLoading(true); return; }
    let cancelled = false;
    async function fetchAll() {
      const [ath, wkts, lg, ts, prog, assess] = await Promise.all([
        supabase.from("athletes").select("*"),
        supabase.from("workouts").select("*"),
        supabase.from("logs").select("*"),
        supabase.from("test_scores").select("*"),
        supabase.from("progressions").select("*"),
        supabase.from("assessments").select("*"),
      ]);
      if (cancelled) return;
      const failed = [];
      const take = (res, label) => {
        if (res.error) { console.error(`Loading ${label} failed:`, res.error); failed.push(label); return []; }
        return res.data || [];
      };
      setAthletes(take(ath, "athletes"));
      setWorkouts(take(wkts, "workouts").map(parseWorkout));
      setLogs(take(lg, "logs").map(parseLog));
      setTestScores(take(ts, "test scores"));
      setProgressions(take(prog, "progressions"));
      setAssessments(take(assess, "assessments").map(parseAssessment));
      if (failed.length) alert(`Some data failed to load (${failed.join(", ")}). Close and reopen the app to retry.`);
      setLoading(false);
    }
    fetchAll();
    return () => { cancelled = true; };
  }, [userId]);

  const saveWorkout = useCallback(async (wkt) => {
    const payload = { ...wkt, blocks: JSON.stringify(wkt.blocks), assignees: JSON.stringify(wkt.assignees) };
    const exists = workouts.find((w) => w.id === wkt.id);
    const { error } = exists
      ? await supabase.from("workouts").update(payload).eq("id", wkt.id)
      : await supabase.from("workouts").insert(payload);
    if (error) { reportDbError("Saving workout", error); return false; }
    setWorkouts((ws) => exists ? ws.map((w) => w.id === wkt.id ? wkt : w) : [...ws, wkt]);
    return true;
  }, [workouts]);

  const deleteWorkout = useCallback(async (id) => {
    const { error } = await supabase.from("workouts").delete().eq("id", id);
    if (error) { reportDbError("Deleting workout", error); return false; }
    setWorkouts((ws) => ws.filter((w) => w.id !== id));
    return true;
  }, []);

  const saveLog = useCallback(async (log) => {
    const payload = {
      ...log,
      sets: JSON.stringify(log.sets),
      blockNotes: log.blockNotes ? JSON.stringify(log.blockNotes) : null,
      loggedAt: Date.now(),
    };
    const exists = logs.find((l) => l.athleteId === log.athleteId && l.workoutId === log.workoutId);
    // Use the row's primary key id to avoid quoted column name issues in the WHERE clause
    const { error } = exists
      ? await supabase.from("logs").update(payload).eq("id", exists.id)
      : await supabase.from("logs").insert(payload);
    if (error) {
      console.error("Log save error:", error);
      alert("Session failed to save: " + error.message);
      return false;
    }
    const { data, error: refreshError } = await supabase.from("logs").select("*");
    if (refreshError) { console.error("Refreshing logs failed:", refreshError); return true; }
    setLogs((data || []).map(parseLog));
    return true;
  }, [logs]);

  const saveTestScore = useCallback(async (score) => {
    const { error } = await supabase.from("test_scores").insert(score);
    if (error) { reportDbError("Saving test scores", error); return false; }
    setTestScores((ts) => [...ts, score]);
    return true;
  }, []);

  const saveProgressions = useCallback(async (rules) => {
    // One pending rule per (athlete, movement): a new rule replaces any old one.
    const key = (p) => p.athleteId + "|" + p.exerciseName.toLowerCase().trim();
    const newKeys = new Set(rules.map(key));
    const staleIds = progressions.filter((p) => newKeys.has(key(p))).map((p) => p.id);
    if (staleIds.length) {
      const { error } = await supabase.from("progressions").delete().in("id", staleIds);
      if (error) { reportDbError("Replacing existing bumps", error); return false; }
    }
    const { error } = await supabase.from("progressions").insert(rules);
    if (error) { reportDbError("Saving bumps", error); return false; }
    setProgressions((ps) => [...ps.filter((p) => !staleIds.includes(p.id)), ...rules]);
    return true;
  }, [progressions]);

  const deleteProgressions = useCallback(async (ids) => {
    if (!ids.length) return true;
    const { error } = await supabase.from("progressions").delete().in("id", ids);
    if (error) { reportDbError("Removing bumps", error); return false; }
    setProgressions((ps) => ps.filter((p) => !ids.includes(p.id)));
    return true;
  }, []);

  const saveAssessment = useCallback(async (assessment) => {
    const payload = { ...assessment, movement: JSON.stringify(assessment.movement), performance: JSON.stringify(assessment.performance) };
    const { error } = await supabase.from("assessments").insert(payload);
    if (error) { reportDbError("Saving assessment", error); return false; }
    setAssessments((as) => [...as, assessment]);
    return true;
  }, []);

  const deleteAssessment = useCallback(async (id) => {
    const { error } = await supabase.from("assessments").delete().eq("id", id);
    if (error) { reportDbError("Deleting assessment", error); return false; }
    setAssessments((as) => as.filter((a) => a.id !== id));
    return true;
  }, []);

  // Coach roster operations go through the roster-admin edge function so the
  // matching auth user is created/updated/deleted alongside the row.
  const addAthlete = useCallback(async (athleteWithPin) => {
    const { pin, ...athlete } = athleteWithPin;
    const { ok, error, data } = await rosterAdmin("create", { athlete, pin });
    if (!ok) { reportDbError("Adding athlete", error); return false; }
    setAthletes((as) => [...as, data.athlete]);
    return true;
  }, []);

  const coachUpdateAthlete = useCallback(async (athleteWithPin) => {
    const { pin, ...athlete } = athleteWithPin;
    const { ok, error, data } = await rosterAdmin("update", { athlete, pin: pin || null });
    if (!ok) { reportDbError("Saving athlete", error); return false; }
    setAthletes((as) => as.map((a) => a.id === athlete.id ? data.athlete : a));
    return true;
  }, []);

  const deleteAthlete = useCallback(async (id) => {
    const { ok, error } = await rosterAdmin("delete", { athleteId: id });
    if (!ok) { reportDbError("Deleting athlete", error); return false; }
    setAthletes((as) => as.filter((a) => a.id !== id));
    return true;
  }, []);

  // Bulk add/remove one tag across many athletes. Tags don't touch auth
  // credentials, so these are direct row updates (no edge function needed).
  const bulkTagAthletes = useCallback(async (ids, tag, mode) => {
    const t = tag.trim();
    if (!t || !ids.length) return false;
    const targets = athletes.filter((a) => ids.includes(a.id));
    const results = await Promise.all(targets.map(async (a) => {
      const has = (a.tags ?? []).includes(t);
      if (mode === "add" ? has : !has) return { id: a.id, tags: a.tags ?? [], ok: true }; // already in desired state
      const tags = mode === "add" ? [...(a.tags ?? []), t] : (a.tags ?? []).filter((x) => x !== t);
      const { error } = await supabase.from("athletes").update({ tags }).eq("id", a.id);
      return { id: a.id, tags, ok: !error, error };
    }));
    setAthletes((as) => as.map((a) => { const r = results.find((x) => x.id === a.id && x.ok); return r ? { ...a, tags: r.tags } : a; }));
    const failed = results.filter((r) => !r.ok);
    if (failed.length) { reportDbError(`Tagging ${failed.length} athlete${failed.length > 1 ? "s" : ""}`, failed[0].error); return false; }
    return true;
  }, [athletes]);

  // Athletes update their own row directly (RLS allows own-row updates).
  const updateAthleteProfile = useCallback(async (athlete) => {
    const { error } = await supabase.from("athletes").update(athlete).eq("id", athlete.id);
    if (error) { reportDbError("Saving profile", error); return false; }
    setAthletes((as) => as.map((a) => a.id === athlete.id ? athlete : a));
    return true;
  }, []);

  const handleLogout = useCallback(() => { signOut(); }, []);

  if (authSession === undefined) return <LoadingScreen />;
  if (!authSession) return <LoginScreen />;
  if (loading) return <LoadingScreen />;

  const role = sessionRole(authSession);
  if (role === "coach") return <CoachApp athletes={athletes} workouts={workouts} logs={logs} testScores={testScores} progressions={progressions} assessments={assessments} onSaveAssessment={saveAssessment} onDeleteAssessment={deleteAssessment} onSaveProgressions={saveProgressions} onDeleteProgression={(id) => deleteProgressions([id])} onSaveWorkout={saveWorkout} onDeleteWorkout={deleteWorkout} onUpdateAthlete={coachUpdateAthlete} onDeleteAthlete={deleteAthlete} onAddAthlete={addAthlete} onSaveTestScore={saveTestScore} onBulkTag={bulkTagAthletes} onLogout={handleLogout} />;

  const me = athletes.find((a) => a.user_id === authSession.user.id);
  if (!me) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, padding: 24, textAlign: "center" }}>
      <p style={{ color: C.white, fontSize: 15, margin: 0 }}>Your login works, but you're not on the roster yet.</p>
      <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>Ask your coach to check your athlete entry, then sign in again.</p>
      <button onClick={handleLogout} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.mutedUp, fontSize: 13, padding: "8px 18px", cursor: "pointer", fontFamily: "inherit" }}>Log out</button>
    </div>
  );
  return <AthleteApp athlete={me} workouts={workouts} logs={logs} testScores={testScores} progressions={progressions} onConsumeProgressions={deleteProgressions} onLog={saveLog} onUpdateAthlete={updateAthleteProfile} onLogout={handleLogout} />;
}
