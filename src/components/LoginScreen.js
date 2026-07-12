import { useState } from "react";
import { C } from "../constants";
import { Btn } from "./common";

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ athletes, onLogin, onCoachLogin }) {
  const [name, setName] = useState(""); const [pin, setPin] = useState(""); const [coachPin, setCoachPin] = useState(""); const [mode, setMode] = useState("athlete"); const [err, setErr] = useState("");
  const handleAthleteLogin = () => { setErr(""); const match = athletes.find((a) => a.name.toLowerCase() === name.trim().toLowerCase() && a.pin === pin); if (match) onLogin(match); else setErr("Name or PIN not found. Check with your coach."); };
  const handleCoachLogin = () => { setErr(""); if (coachPin === "RS214") onCoachLogin(); else setErr("Incorrect coach PIN."); };
  const fieldStyle = { background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 9, color: C.white, padding: "11px 14px", width: "100%", boxSizing: "border-box", fontFamily: "inherit" };
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <img src="/logo.png" alt="The Cage – Riptide Swimming" style={{ width: 360, maxWidth: "92%", marginBottom: 8, filter: "drop-shadow(0 4px 24px rgba(0,212,184,0.18))" }} />
        <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 13, letterSpacing: ".04em" }}>STRENGTH · SPEED · POWER</p>
      </div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, width: "100%", maxWidth: 380, padding: 28, boxShadow: `0 0 80px ${C.tealGlow}` }}>
        <div style={{ display: "flex", background: C.bg, borderRadius: 30, padding: 4, marginBottom: 22 }}>
          {["athlete","coach"].map((m) => <button key={m} onClick={() => { setMode(m); setErr(""); }} style={{ flex: 1, border: "none", borderRadius: 26, padding: "7px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: mode === m ? C.teal : "transparent", color: mode === m ? C.bg : C.muted, transition: "all .15s" }}>{m === "athlete" ? "I'm an athlete" : "Coach"}</button>)}
        </div>
        {mode === "athlete" ? (<>
          <div style={{ marginBottom: 14 }}><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>YOUR NAME</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="First Last" style={{ ...fieldStyle, fontSize: 15 }} /></div>
          <div style={{ marginBottom: 20 }}><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>PIN</label><input value={pin} onChange={(e) => setPin(e.target.value)} type="password" placeholder="••••" maxLength={6} style={{ ...fieldStyle, fontSize: 22, letterSpacing: ".2em" }} onKeyDown={(e) => e.key === "Enter" && handleAthleteLogin()} /></div>
          {err && <p style={{ color: C.red, fontSize: 13, margin: "0 0 14px", textAlign: "center" }}>{err}</p>}
          <Btn onClick={handleAthleteLogin} style={{ width: "100%" }}>Log in →</Btn>
        </>) : (<>
          <div style={{ marginBottom: 20 }}><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>COACH PIN</label><input value={coachPin} onChange={(e) => setCoachPin(e.target.value)} type="password" placeholder="••••••••" style={{ ...fieldStyle, fontSize: 22, letterSpacing: ".2em" }} onKeyDown={(e) => e.key === "Enter" && handleCoachLogin()} /></div>
          {err && <p style={{ color: C.red, fontSize: 13, margin: "0 0 14px", textAlign: "center" }}>{err}</p>}
          <Btn onClick={handleCoachLogin} style={{ width: "100%" }}>Enter coach dashboard →</Btn>
        </>)}
      </div>
    </div>
  );
}

export { LoginScreen };
