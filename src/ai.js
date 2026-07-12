import { uid } from "./helpers";

// ─── AI GENERATE ──────────────────────────────────────────────────────────────
async function generateWorkout(athlete, focus) {
  const prompt = `You are an expert strength coach for competitive swimmers.
Create a swim-specific strength workout for ${athlete.name}, group: ${athlete.event || "competitive swimmer"}.
Focus: ${focus || "general athletic development and injury prevention"}.
Return ONLY valid JSON:
{"blocks":[
  {"name":"Warm-up","exercises":[{"name":"string","sets":"2","reps":"10","load":"bodyweight","note":"cue","pairId":null}]},
  {"name":"Block 1","exercises":[{"name":"DB Front Squat","sets":"3","reps":"6","load":"moderate","note":"brace core","pairId":"p1"},{"name":"Box Jump","sets":"3","reps":"5","load":"bodyweight","note":"max height","pairId":"p1"}]},
  {"name":"Block 2","exercises":[...]},
  {"name":"Block 3","exercises":[...]},
  {"name":"Cool Down","exercises":[{"name":"string","sets":"1","reps":"30s","load":"","note":"breathe","pairId":null}]}
]}
Warm-up: 3-4 activation exercises. Blocks 1-3: superset pairs (strength+power). Cool Down: 2-3 mobility exercises.`;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.REACT_APP_ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1400, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await res.json();
  const text = data.content?.find((b) => b.type === "text")?.text || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON");
  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.blocks.map((b) => ({ id: uid(), name: b.name, exercises: b.exercises.map((e) => ({ id: uid(), name: e.name, sets: e.sets, reps: e.reps, load: e.load, note: e.note, pairId: e.pairId || null })) }));
}

export { generateWorkout };
