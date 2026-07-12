import { C } from "../constants";

// ─── SHARED UI ────────────────────────────────────────────────────────────────
function Avatar({ name, size = 38 }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const hue = (name.charCodeAt(0) * 47 + (name.charCodeAt(1) || 0) * 13) % 360;
  return <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: `hsl(${hue},50%,28%)`, border: `2px solid hsl(${hue},50%,40%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.34, fontWeight: 800, color: "#fff", fontFamily: "inherit" }}>{initials}</div>;
}

function Btn({ children, onClick, variant = "primary", disabled, small, style: sx }) {
  const base = { border: "none", borderRadius: 10, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all .15s", opacity: disabled ? 0.5 : 1, ...sx };
  const v = {
    primary: { background: C.teal, color: C.bg, padding: small ? "6px 14px" : "10px 22px", fontSize: small ? 12 : 14 },
    ghost: { background: "transparent", color: C.mutedUp, border: `1px solid ${C.border}`, padding: small ? "5px 13px" : "9px 21px", fontSize: small ? 12 : 14 },
    danger: { background: "transparent", color: C.red, border: `1px solid rgba(255,77,77,0.3)`, padding: small ? "5px 13px" : "9px 21px", fontSize: small ? 12 : 14 },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...v[variant] }}>{children}</button>;
}

function StatCard({ label, value, accent }) {
  return <div style={{ background: C.surfaceUp, borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.border}` }}><p style={{ margin: 0, fontSize: 11, color: C.muted, letterSpacing: ".06em", textTransform: "uppercase" }}>{label}</p><p style={{ margin: "5px 0 0", fontSize: 26, fontWeight: 800, color: accent || C.white }}>{value}</p></div>;
}

export { Avatar, Btn, StatCard };
