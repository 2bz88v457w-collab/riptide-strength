import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://juwxlrbkpeluojtqcplt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Vs461RaDSo7X8ygrjwbehQ_UYobFhox";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const C = {
  bg: "#060D14", surface: "#0D1B2A", surfaceUp: "#132338",
  border: "rgba(0,210,180,0.12)", borderBright: "rgba(0,210,180,0.35)",
  teal: "#00D4B8", tealGlow: "rgba(0,212,184,0.15)",
  gold: "#FFB700", red: "#FF4D4D",
  white: "#EEF4F8", muted: "#5A7A96", mutedUp: "#7A9AB6",
};

const BLOCK_COLORS = [C.teal, C.gold, "#A78BFA", C.red, C.mutedUp];
const BLOCKS = ["Warm-up", "Block 1", "Block 2", "Block 3", "Cool Down"];

// Exercise library grouped by movement function. A move can belong to several
// types (e.g. Renegade Row + DB is PULL, PUSH, and BRACE). FUNCTION is mobility /
// locomotion work and is not required for a balanced workout.
const EXERCISE_CATEGORIES = {
  SQUAT: [
    "180 Jump", "180 Jump - Rapid Fire", "360 Jump", "Active Bows", "Alternating Lunge Jump",
    "Assisted Single-leg Pistol Squat + TRX", "Assisted Single-leg Squat", "Assisted Single-leg Squat + Band",
    "Assisted Single-leg Squat + TRX", "Back Squat", "Back Squat + BB", "Bear Hug Squat + SB", "Bodyweight Squat",
    "Box Jump", "Broad Jump", "Bulgarian Split Squat", "Burpees", "Cook Squat", "Cook Squat Single-arm Reach",
    "Crossover Lunge", "DB Box Step Up", "DB Front Squat", "DB Thrusters", "Driving Squat + Plate",
    "Dual KB Front Squat", "Front Load Reverse Lunge + SB", "Front Load Split Squat + SB", "Front Squat + BB",
    "Front Squat + DB", "Front Squat Hands Free + BB", "Goblet Squat", "Goblet Squat + DB", "Goblet Squat + KB",
    "Goblet Squat Curls + KB", "Goblet Squat Heartbeats + KB", "Hop + 90 Twist", "Hop to Broad Jump", "Lateral Bound",
    "Lateral Bound with Stick", "Lateral Lunge", "Lateral Single-leg Jump DOWN", "Lateral Single-leg Jump UP",
    "Lateral Single-leg Jump UP & DOWN", "Lateral Squat", "Lateral Step-up", "Lunge",
    "Lunge Jump", "Multi-Planar Lunge", "Overhead Squat", "Overhead Squat + BB", "Overhead Squat + DB",
    "Overhead Squat + PVC", "Overhead Squat + SB", "Power Step-Up", "Power Step-Up Alternating", "Prisoner Squat",
    "PVC OH Squat", "Rear Foot Elevated Split Squat", "Rear-Foot-Elevated Squat", "Rear-Foot-Elevated Squat + DB",
    "Rear-Foot-Elevated Squat + TRX", "Rear-Foot-Elevated Squat Jump", "Reverse Lunge", "Reverse Lunge + Slideboard",
    "Reverse Rotational Lunge + SB", "Rotational Squat", "Shoulder Lateral Lunge + SB", "Shoulder Reverse Lunge + SB",
    "Single Arm KB Front Squat", "Single-arm Overhead Squat + DB", "Single-arm Overhead Squat + KB",
    "Single-arm Squat + KB", "Single-arm Squat to Row + Cable", "Single-leg Alternating Hop",
    "Single-leg Box Jump DOWN", "Single-leg Box Jump UP", "Single-leg Box Jump UP & DOWN", "Single-leg Hop",
    "Single-leg Jump", "Single-leg Lateral Hop", "Single-leg Lateral Hop with Stick", "Single-leg Pistol Squat",
    "Single-leg Sit DOWN", "Single-leg Squat", "Single-leg Squat + DB", "Single-leg Squat Elevated + DB",
    "Single-leg Squat to Box", "Single-leg Step UP", "Single-leg Wall Sit", "Speed Squat", "Split Squat",
    "Squat + DB", "Squat Facing Wall", "Squat Jump", "Squat to Side Kick", "Star Hop",
    "Star Single-leg Alternating Hop", "Star Single-leg Hop", "Start Throw + MB", "Step-up", "Sumo Squat Hold",
     "TRX Single Leg Blast Off", "Tuck Jump", "Wall Sit",
  ],
  HINGE: [
    "Banded Hamstring Curls", "Banded Hip Extension", "Body Curl + Slideboard", "Body Curl + TRX",
    "Cable Pull-Through", "DB Snatch", "Deadlift + BB", "Deadlift + DB", "Dropdown Leg Curl + Slideboard",
    "Elevated Single-leg Hip Lift + TB", "Floor Bridge & Leg Thrust", "Glute Bridge", "Glute Bridge OH Extension",
    "Good Morning + SB", "Hip Circuit + Mini-Band", "Hip Circuits", "Hip Hinge", "Hip Hinge + KB", "Hip Hinge + SB",
    "Hip Hinge + Weight", "Hip Hinge Greasing", "Hip Thrust", "Hip Thrust + Bench", "KB Clean", "KB Swing",
    "Leg Curl + Slideboard", "Leg Curl + TRX", "Lying Adduction + MB-Pad", "Nordic Curl",
    "Overhead Squat X-Walk + Band", "RDL", "Reverse Extension + Bench", "Reverse Lunge + Slideboard",
    "Romanian Deadlift", "Romanian Deadlift + BB", "Romanian Deadlift + DB", "Romanian Deadlift + KB", "Single Leg Hip Thrust",
    "Single Leg Layouts", "Single-arm Romanian Deadlift + DB", "Single-arm Romanian Deadlift + KB",
    "Single-arm Snatch + DB", "Single-arm Snatch + KB", "Single-arm Swing + KB", "Single-leg Balance",
    "Single-leg Body Curl + TRX", "Single-leg Curl + TRX", "Single-leg Deadlift & Row + Cable",
    "Single-leg Deadlift + BB", "Single-leg Deadlift + Cable", "Single-leg Deadlift + DB",
    "Single-leg Deadlift + DBx2", "Single-leg Deadlift + SB", "Single-leg Floor Bridge", "Single-leg Hip Lift + TB",
    "Single-leg Hip Thrust + Bench", "Single-leg Layout 3D", "Single-leg Layout to Diagonal Reach",
    "Single-leg Layout to Wall Touch", "Single-Leg RDL", "Slideboard", "Squat to Side Kick", "Swing + KB",
    "Swing + KBx2", "Table Top", "Trap Bar Deadlift", "X-Walk + Band",
  ],
  PUSH: [
    "Alternating Chest Press + DB", "Alternating Press + DB", "Alternating Press + KB", "Arnold Press",
    "Around the World + SB", "Banded Chest Press OH Extension", "Behind Neck Press + BB", "Bench Press + BB",
    "Chest Pass + MB", "Chest Press + DB", "Chest Press + TRX", "Curl to Press + DB", "DB Bench Press",
    "Decline Push-up", "Dive Bomber Push-up", "Dropdown Push-up", "Floor Chest Press", "Ghost Renegade Row",
    "Half-Kneeling Shoulder Press", "Halo + KB", "Hands-up Push-up", "Handstand Push-up", "Incline Bench Press + BB",
    "Incline Chest Press + DB", "Incline Push-up", "Incline Single-arm Push-up", "Inverted Handstand Push-up",
    "Kneeling Alternating Press + DB", "Kneeling Alternating Press + KB", "Kneeling Alternating Press + SB",
    "Kneeling Chest Press + Cable", "Kneeling Overhead Press + SB", "Kneeling Power Push-up",
    "Kneeling Single-arm Press + DB", "Kneeling Single-arm Press + KB", "Landmine Press", "Overhead Press",
    "Overhead Press + BB", "Overhead Press + DB", "Pike Push-up", "Power Push Ups", "Push Press + BB",
    "Push Press + DB", "Push Pull + Cable", "Push ups", "Push-up + SB", "Push-up + TRX", "Push-up Adduction + MB-Pad",
    "Push-up Hold", "Push-up Shoulder Taps", "Push-up to Twist", "Push-up Tuck + TRX", "Push-up Variation",
    "Push-up Walk", "Renegade Row + DB", "Rotational Power Push with Band", "Seated Shoulder Press", "Shot Put Throw + MB",
    "Single-arm Chest Press + DB", "Single-arm Overhead Press + DB", "Single-arm Overhead Press + KB",
    "Single-leg Chest Pass + MB", "Single-leg Push-up", "Spiderman Push-up", "Spiderman Push-up + SB",
    "Split Jerk + DB", "Staggered Push-up", "Tall Kneeling Alternating Press + DB",
    "Tall Kneeling Alternating Press + KB", "Tall Kneeling Chest Pass + MB", "Tall Kneeling Single-arm Press + DB",
    "Tall Kneeling Single-arm Press + KB", "Tempo Push-up", "Tricep Extension + TRX", "TRX Chest Press",
    "Walkout Push-up + SB",
  ],
  PULL: [
    "Active-Passive Hang", "Assisted Behind Neck Pull-up + Band", "Assisted Pull-up + Band", "Batwing + DB",
    "Behind Neck Pull-up", "Bent Knee Row + TRX", "Chest Chin-up", "Chest Pull-up", "Chin-up",
    "Dropdown Behind Neck Pull-up", "Dropdown Pull-up", "Face Pull", "Facepull + Cable", "Flexed Arm Hang",
    "Inverted Bent Knee Row + BB", "Lat Pull Down", "Overhead Raise + TRX", "Overhead Throw + MB", "Plank Row + DB",
    "Pull Ups", "Pull-up / Band-Assisted", "Pullover + DB", "Pullover + SB", "Pullover Leg Raise + SB",
    "Push Pull + Cable", "Renegade Row", "Renegade Row + DB", "Reverse Fly", "Reverse Flys + DB", "Row + BB",
    "Row + DB", "Row + SB", "Row + TRX", "Seated Pull-up + TRX", "Seated Pull-up Angled + TRX", "Seated Row",
    "Shoulder Combo + Band", "Shoulder Pull Apart Series + Band", "Shoulder Walkback + Band", "Side-to-Side Pull-up",
    "Single Straight-leg Pull-up + TRX", "Single-arm Row + DB", "Single-arm Row + SB", "Single-arm Row + TRX",
    "Single-arm Squat to Row + Cable", "Slam + MB", "Speed Pull-ups + Band", "Speed Skiers + Band",
    "Straight-leg Pull-up + TRX", "TRX Row", "TRX YTWs", "Wide Overhead Raise + TRX", "Woodchop + MB",
  ],
  BRACE: [
    "ABC Leg Raise", "Alt Leg Lowers", "Alt V Ups", "Alternating Bridge", "Alternating Leg Lift", "Alternating Plank",
    "Alternating PNF + Cable", "Back Bridge", "Back Plank", "Bicycles", "Bird Dog", "Bodysaw + Slideboard",
    "Bodysaw + TRX", "Bridge Drag + SB", "Bridge Shoulder Taps", "Bridge to Pike + TRX", "Bridge to Plank",
    "Bridge to Plank Adduction + MB-Pad", "Bridge to Twist", "Bridge to Twist + TRX", "Centipede", "Centipede Kicks",
    "Centipede Shoulder Taps", "Copenhagen Plank", "Copenhagen Plank (Variation)", "Core Push + Cable",
    "Core Rotation + Band", "Crossover Crunch", "Crunch + Stick", "Dead Bug", "Dead Bug (Banded)", "Dip Walk + Step",
    "Driving Squat + Plate", "Dropdown Straight-leg Sit-up", "Elevated Single-leg Hip Lift + TB", "Farmer Carry + DB",
    "Farmers Carry", "Floor Bridge", "Floor Bridge & Leg Thrust", "Flutter Kicks", "Front Bridge",
    "Front Bridge + TRX", "Ghost Renegade Row", "Goblet Squat Heartbeats + KB", "Half Kneeling Slam Ball Throw",
    "Half Turkish Get-up + KB", "Hanging Knee Raise", "Hanging Leg Raise", "Hanging Wipers", "Hip Thrust + Bench",
    "Hollow", "Hollow Hold", "Kneeling Chest Press + Cable", "Kneeling Chop & Press + Cable",
    "Kneeling Reverse Woodchop + Cable", "Kneeling Rollout + Ab Wheel", "Kneeling Rollout + BB",
    "Kneeling Rollout + SB", "Kneeling Side Throw + MB", "Kneeling Woodchop + Cable", "Lateral Flutter Kicks",
    "Lateral Mountain Climber", "Leg Lowers", "Leg Lowers + Band", "Leg Raise", "Leg Raise + Bench", "Lizards",
    "Lunge Reverse Woodchop + Cable", "Lunge Woodchop + Cable", "Lying Adduction + MB-Pad",
    "Med Ball Rotational Throw", "Med Ball Slam", "Mountain Climber", "Opposite Bridge", "Opposite Plank",
    "Opposite V-up", "Pallof Press", "Plank Adduction + MB-Pad", "Plank Row + DB", "Plank Shoulder Taps",
    "Plank Side Tuck + TRX", "Plank Swings + TRX", "Plank to Pike + TRX", "Plank Tuck + TRX", "PNF + Cable",
    "Pullover + DB", "Push Pull + Cable", "Quadraped Opposite", "Quadruped Med Ball Twist", "Renegade Row + DB",
    "Reverse Crunch", "Reverse Russian Twist", "Reverse Woodchop + Cable", "Rock the Boat", "Rollout + Ab Wheel",
    "Rollout + TRX", "Russian Twist + MB", "Seated Leg Circles", "Short Side Bridge", "Shot Put Throw + MB",
    "Side Bridge", "Side Throw + MB", "Side Throw with Step + MB", "Side Tuck + TRX", "Single-leg Floor Bridge",
    "Single-leg Hip Lift + TB", "Single-leg Hip Thrust + Bench", "Single-leg Side Throw + MB", "Slam Ball",
    "Speed PNF Rotation + Band", "Speed Rotation + Band", "Speed V-ups", "Start Slam Ball Throw", "Start Throw + MB",
    "Stir the Pot + SB", "Stir the Pot Single-leg + SB", "Straight-leg Sit-up", "Straight-leg Sit-up & Leg Raise",
    "Straight-leg Sit-up + DB", "Suitcase Carry", "Suitcase Carry + DB", "Super Turtle", "Superman to V-up",
    "Swing + TRX", "Table Top", "Toe Touch", "Toes to Bar", "TRX Plank Pike", "Tuck + TRX", "Turkish Get-up + KB",
    "Twist + MB", "Twisting Mountain Climber", "V In-Out", "V-up", "V-up Switch + SB", "Waiter Carry + DB",
    "Walkout + SB", "Woodchop + Cable",
  ],
  FUNCTION: [
    "5-10-5 Drill", "ABC Leg Raise", "Active Bows", "Adductors + Foam Roll", "Alternating Bridge",
    "Alternating Leg Lift", "Alternating Plank", "Ankle ABC's", "Ankle Mobs 3D", "Ankle Mobs 3D Kneeling",
    "Around the World + SB", "Around the World Stretch (closed)", "Around the World Stretch (open)",
    "Assisted Single-leg Squat", "Back + Foam Roll", "Back Bridge", "Back Plank", "Backpedal", "Backward Run",
    "Backward Step Overs", "Battle Rope Wave", "Batwing + DB", "Bear Crawl", "Bodyweight Squat", "Brettzel",
    "Brettzel 2.0", "Bridge Shoulder Taps", "Bridge to Plank", "Bridge to Plank Adduction + MB-Pad",
    "Bridge to Twist", "Burpees", "Butt Kickers", "Calf + Foam Roll", "Carioca", "Carioca with High Knees",
    "Cat - Cow Stretch", "Centipede", "Centipede Kicks", "Centipede Shoulder Taps", "Chest Stretch", "Chicken Wing",
    "Child's Pose - Cobra Stretch", "Cook Squat", "Cook Squat Single-arm Reach", "Crab Crawl Backward",
    "Crab Crawl Forward", "Crossover Lunge", "Crossover Lunge Alternating", "Crossover Lunge Behind",
    "Crossover Lunge In Front", "Crossover Skip", "Crossover Skip to Sprint", "Dead Bug", "Decline Push-up",
    "Dive Bomber Push-up", "Dropdown Push-up", "Dropdown Straight-leg Sit-up", "Eldoa A Stretch", "Eldoa B Stretch",
    "Eldoa T Stretch", "Elevated Single-leg Hip Lift + TB", "EUT Stretch", "Farmer Carry + DB", "Floor Angel",
    "Floor Angel Knees Bent", "Floor Bridge", "Floor Bridge & Leg Thrust", "Flutter Kicks", "Front Bridge",
    "Ghost Renegade Row", "Goblet Squat + KB", "Gorilla", "Half Turkish Get-up + KB", "Halo + KB",
    "Hamstring + Foam Roll", "Hands-up Push-up", "Heel to Hip", "Heel to Hip & Bend", "High Bear Crawl",
    "High Knee Cradle", "High Knee Run", "High Knee Run Backward", "High Knee Skip", "High Knee Skip Backward",
    "High Knee Walk", "Hip Circuit + Mini-Band", "Hip Circuits", "Hip Hinge + Weight", "Hip Hinge Greasing",
    "Hip Thrust + Bench", "Hollow", "Hop + 90 Twist", "Hop to Jump", "Inchworm", "Incline Push-up",
    "Incline Single-arm Push-up", "Iron Cross", "Jumping Jacks", "Kneeling Hip Flexor Stretch",
    "Kneeling Hip Flexor Stretch + Bench", "Kneeling Power Push-up", "Kneeling T Stretch",
    "Kneeling T-spine Mobility", "Lat + Foam Roll", "Lat Stretch", "Lateral Bear Crawl", "Lateral Bound",
    "Lateral Bound with Stick", "Lateral Crossover Skip", "Lateral Flutter Kicks", "Lateral Lunge", "Lateral Shuffle",
    "Lateral Shuffle to Sprint", "Lateral Skip", "Lateral Squat", "LEFT Drill", "Leg Lowers + Band", "Leg Raise",
    "Leg Swings", "Lizards", "Log Roll", "Lunge", "Lunge & Twist", "Lying Adduction + MB-Pad", "Mountain Climber",
    "Multi-Planar Lunge", "Opposite Bridge", "Opposite Plank", "Opposite V-up", "Overhead Squat",
    "Overhead Squat X-Walk + Band", "Pike Push-up", "Piriformis + Foam Roll", "Piriformis Lying",
    "Piriformis Stretch", "Piriformis Stretch + Bench", "Plank Adduction + MB-Pad", "Plank Shoulder Taps",
    "Prisoner Squat", "Push ups", "Push-up Hold", "Push-up Shoulder Taps", "Push-up to Twist", "Push-up Walk",
    "Quadraped Opposite", "Quads + Foam Roll", "Quick Feet", "Quick Feet with Slow Arms", "Rear-Foot-Elevated Squat",
    "Reverse Bear Crawl", "Reverse Crunch", "Reverse High Bear Crawl", "Reverse Lunge",
    "Reverse Lunge & Twist – Dynamic", "Reverse Lunge Combo", "Reverse Russian Twist", "Reverse Single-leg Layout",
    "Reverse Spiderman", "Rock the Boat", "Roll Back to Stand", "Rotational Squat", "Roundoff", "Run & Jump",
    "Scap Push-ups", "Scorpion", "Seated Leg Circles", "Seated T-spine Mobility", "Seated Wall Angel",
    "Seated Wall Angel Knees Bent", "Short Side Bridge", "Shoulder Circuits", "Shoulder Combo + Band",
    "Shoulder Mobility + PVC Pipe", "Shoulder Mobility + Tennis Ball", "Shoulder Pull Apart Series + Band",
    "Shoulder Walkback + Band", "Side Bridge", "Side Shuffle", "Single Leg Layouts", "Single-leg Alternating Hop",
    "Single-leg Balance", "Single-leg Floor Bridge", "Single-leg Hip Lift + TB", "Single-leg Hip Thrust + Bench",
    "Single-leg Hop", "Single-leg Jump", "Single-leg Lateral Hop", "Single-leg Lateral Hop with Stick",
    "Single-leg Layout + Twist", "Single-leg Layout 3D", "Single-leg Layout to Diagonal Reach",
    "Single-leg Layout to Wall Touch", "Single-leg Push-up", "Single-leg Sit DOWN", "Single-leg Squat",
    "Single-leg Wall Sit", "Skipping", "Sled Push", "Spiderman", "Spiderman Push-up", "Split Squat", "Squat & Twist",
    "Squat to Side Kick", "Staggered Push-up", "Standing Wall Angel", "Stationary Skips", "Stir the Pot + SB",
    "Straight-leg Sit-up", "Straight-leg Sit-up & Leg Raise", "Straight-leg Skip", "Straight-leg Walk",
    "Suitcase Carry + DB", "Sumo Squat Hold", "Super Spiderman", "Super Turtle", "Superman to V-up",
    "T-spine + Foam Roll", "T-spine Mobility + Double TB", "Table Top", "Table Top Walk", "Toe Touch",
    "Turkish Get-up + KB", "Waiter Carry + DB", "Wall Sit", "Wide Bear Crawl", "Wide Skip", "Windup Stretch",
    "X-Walk + Band",
  ],
};

// Movement functions every workout should include at least once (FUNCTION is optional).
const REQUIRED_MOVE_TYPES = ["SQUAT", "HINGE", "PUSH", "PULL", "BRACE"];

// Flat list for datalists, grouped by move type, deduped across types.
const EXERCISE_BANK = [...new Set(Object.values(EXERCISE_CATEGORIES).flat())];

// lowercased exercise name -> [move types]
const EXERCISE_TYPES = {};
Object.entries(EXERCISE_CATEGORIES).forEach(([type, names]) => names.forEach((n) => {
  const k = n.toLowerCase();
  (EXERCISE_TYPES[k] = EXERCISE_TYPES[k] || []).push(type);
}));

function getMoveTypes(name) { return EXERCISE_TYPES[name?.toLowerCase().trim()] || []; }

// Set of move types covered by a workout's blocks.
function getWorkoutMoveTypes(blocks) {
  const covered = new Set();
  (blocks || []).forEach((b) => b.exercises.forEach((e) => getMoveTypes(e.name).forEach((t) => covered.add(t))));
  return covered;
}

// Athlete specialty — used to target mobility/strength work at the right swimmers.
const STROKES = ["Freestyle", "Backstroke", "Breaststroke", "Butterfly", "IM"];
const DISTANCES = ["Sprint", "Mid-Distance", "Distance"];

const TEST_METRICS = [
  { key: "pushups", label: "Push-ups", unit: "reps in 30s", color: C.teal },
  { key: "pullups", label: "Pull-ups", unit: "unbroken reps", color: C.gold },
  { key: "rdl", label: "RDL", unit: "lbs", color: "#A78BFA" },
];

// ─── MOVEMENT ASSESSMENT (Surge Strength test form) ──────────────────────────
// Each screen scores 0/1/2; bilateral screens are scored per side (stored as
// key + "L"/"R"). Shoulder Impingement is pass/fail only (2 or 0). A 0 always
// means pain. Max total 24; minimum with no pain 14.
const ASSESSMENT_MOVEMENTS = [
  { key: "shoulderImpingement", label: "Shoulder Impingement", bilateral: true, options: [2, 0], guide: "No pain = 2 · Pain = 0" },
  { key: "shoulderMobility", label: "Shoulder Mobility", bilateral: true, options: [2, 1, 0], guide: "Fists < 1.5 hand lengths apart = 2 · > 1.5 = 1 · Pain = 0" },
  { key: "straightLegRaise", label: "Straight-leg Raise", bilateral: true, options: [2, 1, 0], guide: "Heel past knee = 2 · Heel not past knee = 1 · Pain = 0" },
  { key: "overheadSquat", label: "Overhead Squat", bilateral: false, options: [2, 1, 0], guide: "Depth > 90°, knees aligned, heels flat, chest/arms up, balanced = 2 · else = 1 · Pain = 0" },
  { key: "hipHinge", label: "Hip Hinge", bilateral: false, options: [2, 1, 0], guide: "Hinges > 45° = 2 · < 45° = 1 · Pain = 0" },
  { key: "singleLegBalance", label: "Single-leg Balance", bilateral: true, options: [2, 1, 0], guide: "No loss of balance or ground touch = 2 · Loss or touch = 1 · Pain = 0" },
  { key: "singleLegSquat", label: "Single-leg Squat", bilateral: true, options: [2, 1, 0], guide: "Squats > 45° = 2 · < 45° = 1 · Pain = 0" },
];
const ASSESSMENT_MAX = 24;
const PERFORMANCE_TESTS = [
  { key: "broadJump", label: "Broad Jump", unit: "inches" },
  { key: "pullups", label: "Pull-ups", unit: "reps" },
  { key: "flexedArmHang", label: "Flexed Arm Hang", unit: "seconds" },
  { key: "squats", label: "Squats", unit: "reps" },
  { key: "pushups", label: "Push-ups", unit: "reps" },
  { key: "bridgeCombo", label: "Bridge Combo Test", unit: "score" },
  { key: "gutPunch", label: "Gut Punch Breathing (self-test)", unit: "score" },
];

// The individual score cells for a movement map ({ keyL/keyR or key: 0|1|2 }).
function assessmentCellKeys() {
  return ASSESSMENT_MOVEMENTS.flatMap((m) => m.bilateral ? [m.key + "L", m.key + "R"] : [m.key]);
}

// Total, pain flag, and completeness for one assessment's movement scores.
function computeMovementScore(movement) {
  const vals = assessmentCellKeys().map((k) => movement?.[k]);
  const entered = vals.filter((v) => v === 0 || v === 1 || v === 2);
  return {
    total: entered.reduce((s, v) => s + v, 0),
    pain: entered.some((v) => v === 0),
    complete: entered.length === vals.length,
  };
}

// Movement level buckets used for grouping athletes. Any pain overrides the
// score: those athletes need attention before level-based programming.
function movementLevel(total, pain) {
  if (pain) return { label: "Pain flagged", color: C.red };
  if (total >= 22) return { label: "Level 3", color: C.teal };
  if (total >= 18) return { label: "Level 2", color: C.gold };
  return { label: "Level 1", color: "#A78BFA" };
}

// True below the given viewport width; drives phone-friendly layouts (inline
// styles everywhere, so no CSS media queries to lean on).
function useIsNarrow(bp = 640) {
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && window.innerWidth <= bp);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp}px)`);
    const fn = () => setNarrow(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [bp]);
  return narrow;
}

const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });

// ─── SUPERSET HELPERS ─────────────────────────────────────────────────────────
function getSupersetLabels(exercises) {
  const labels = {};
  const pairsSeen = {};
  let letterIdx = 0;
  exercises.forEach((ex) => {
    if (!ex.pairId) return;
    if (pairsSeen[ex.pairId] === undefined) pairsSeen[ex.pairId] = String.fromCharCode(65 + letterIdx++);
    const letter = pairsSeen[ex.pairId];
    const count = Object.values(labels).filter((l) => l && l[0] === letter).length + 1;
    labels[ex.id] = `${letter}${count}`;
  });
  return labels;
}

// ─── MOVEMENT HISTORY HELPER ──────────────────────────────────────────────────
function getLastSets(exerciseName, athleteId, allLogs, allWorkouts, currentWorkoutId) {
  if (!exerciseName) return null;
  const name = exerciseName.toLowerCase().trim();
  const athleteLogs = allLogs
    .filter((l) => l.athleteId === athleteId && l.workoutId !== currentWorkoutId)
    .sort((a, b) => (b.loggedAt || 0) - (a.loggedAt || 0));
  for (const log of athleteLogs) {
    const wkt = allWorkouts.find((w) => w.id === log.workoutId);
    if (!wkt) continue;
    const allExercises = wkt.blocks?.flatMap((b) => b.exercises) || [];
    const match = allExercises.find((e) => e.name.toLowerCase().trim() === name);
    if (match && log.sets?.[match.id]) {
      const sets = log.sets[match.id];
      const done = sets.filter((s) => s.done || s.reps || s.load);
      if (done.length > 0) return { sets: done, date: log.date };
    }
  }
  return null;
}

function initBlocks() { return BLOCKS.map((name) => ({ id: uid(), name, exercises: [] })); }
function emptyEx() { return { id: uid(), name: "", sets: "3", reps: "8", load: "", note: "", pairId: null }; }

// ─── PR DETECTION HELPERS ─────────────────────────────────────────────────────
// Parse a numeric load out of whatever the athlete typed ("95", "95 lbs", "95lb").
// Returns null for blanks and non-numeric loads like "BW".
function parseLoadNum(v) {
  if (!v) return null;
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? null : n;
}

// Round a computed weight to the nearest plate increment.
function roundLoad(n, inc = 2.5) { return Math.round(n / inc) * inc; }

// ─── WEIGHT PROGRESSION ("BUMPS") ─────────────────────────────────────────────
// Look up a pending coach bump for a movement and compute the pre-fill target
// from the athlete's most recent logged session: heaviest set × (1 + pct/100).
// Returns { rule, base, target } or null when there's no rule or no usable
// numeric history (the rule stays pending until the movement is logged with a weight).
function getProgressionFill(exerciseName, athleteId, progressions, allLogs, allWorkouts, currentWorkoutId) {
  const name = exerciseName?.toLowerCase().trim();
  if (!name) return null;
  const rule = progressions.find((p) => p.athleteId === athleteId && p.exerciseName.toLowerCase().trim() === name);
  if (!rule) return null;
  const hist = getLastSets(exerciseName, athleteId, allLogs, allWorkouts, currentWorkoutId);
  if (!hist) return null;
  const nums = hist.sets.map((s) => parseLoadNum(s.load)).filter((n) => n !== null && n > 0);
  if (nums.length === 0) return null;
  const base = Math.max(...nums);
  return { rule, base, target: roundLoad(base * (1 + rule.pct / 100)) };
}

export { roundLoad, getProgressionFill, getMoveTypes, getWorkoutMoveTypes, EXERCISE_CATEGORIES, EXERCISE_BANK, REQUIRED_MOVE_TYPES, ASSESSMENT_MOVEMENTS, ASSESSMENT_MAX, computeMovementScore, movementLevel };

// Best numeric load an athlete has ever logged for an exercise name (excluding current workout).
function getBestLoad(exerciseName, athleteId, allLogs, allWorkouts, currentWorkoutId) {
  if (!exerciseName) return null;
  const name = exerciseName.toLowerCase().trim();
  let best = null; let bestDate = null;
  for (const log of allLogs) {
    if (log.athleteId !== athleteId || log.workoutId === currentWorkoutId) continue;
    const wkt = allWorkouts.find((w) => w.id === log.workoutId);
    if (!wkt) continue;
    for (const b of wkt.blocks || []) {
      for (const e of b.exercises) {
        if (e.name.toLowerCase().trim() !== name) continue;
        for (const s of log.sets?.[e.id] || []) {
          const n = parseLoadNum(s.load);
          if (n !== null && (best === null || n > best)) { best = n; bestDate = log.date; }
        }
      }
    }
  }
  return best !== null ? { best, date: bestDate } : null;
}

// All-time PRs per movement for one athlete, from their full log history.
function computePRs(athleteId, allLogs, allWorkouts) {
  const prs = {};
  allLogs.filter((l) => l.athleteId === athleteId).forEach((log) => {
    const wkt = allWorkouts.find((w) => w.id === log.workoutId);
    if (!wkt) return;
    wkt.blocks?.forEach((b) => b.exercises.forEach((e) => {
      (log.sets?.[e.id] || []).forEach((s) => {
        const n = parseLoadNum(s.load);
        if (n === null) return;
        const key = e.name.trim();
        if (!key) return;
        if (!prs[key] || n > prs[key].best) prs[key] = { best: n, date: log.date };
      });
    }));
  });
  return prs;
}

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

// ─── EXERCISE ROW ─────────────────────────────────────────────────────────────
function ExRow({ ex, label, blockExercises, onChange, onRemove, onPair, onUnpair, onSwap }) {
  const isNarrow = useIsNarrow();
  const f = (k) => (e) => onChange({ ...ex, [k]: e.target.value });
  const inp = (w) => ({ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, color: C.white, padding: "6px 8px", fontSize: 13, width: w, fontFamily: "inherit", boxSizing: "border-box" });
  const isPaired = !!ex.pairId;
  const canPair = blockExercises.filter((e) => e.id !== ex.id && !e.pairId).length > 0;
  const isBW = ex.load?.trim().toUpperCase() === "BW";
  const toggleBW = () => onChange({ ...ex, load: isBW ? "" : "BW" });
  const nameInput = <input list="exbank" value={ex.name} onChange={f("name")} placeholder="Exercise" style={{ ...inp("100%"), minWidth: 0, flex: 1 }} />;
  const setsInput = <input value={ex.sets} onChange={f("sets")} placeholder="Sets" inputMode="numeric" style={inp(isNarrow ? 52 : "100%")} />;
  const repsInput = <input value={ex.reps} onChange={f("reps")} placeholder="Reps" style={inp(isNarrow ? 60 : "100%")} />;
  const loadInput = <input value={ex.load} onChange={f("load")} placeholder="Load" disabled={isBW} style={{ ...inp("100%"), opacity: isBW ? 0.5 : 1, ...(isNarrow ? { flex: 1, minWidth: 0 } : {}) }} />;
  const bwBtn = <button onClick={toggleBW} title="Bodyweight only" style={{ background: isBW ? C.teal : "none", border: `1px solid ${isBW ? C.teal : C.border}`, borderRadius: 6, color: isBW ? C.bg : C.mutedUp, fontSize: 10, fontWeight: 800, padding: isNarrow ? "7px 8px" : "6px 2px", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>BW</button>;
  const noteInput = <input value={ex.note} onChange={f("note")} placeholder="Coaching cue" style={{ ...inp("100%"), ...(isNarrow ? { flex: 1, minWidth: 0 } : {}) }} />;
  const swapBtn = <button onClick={onSwap} style={{ background: "none", border: `1px dashed ${C.border}`, borderRadius: 6, color: C.mutedUp, fontSize: 11, padding: "4px 6px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>⇄ Swap</button>;
  const pairBtn = isPaired ? <button onClick={onUnpair} style={{ background: "none", border: `1px solid ${C.gold}33`, borderRadius: 6, color: C.gold, fontSize: 11, padding: "4px 6px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>Unpair</button>
    : canPair ? <button onClick={onPair} style={{ background: "none", border: `1px dashed ${C.border}`, borderRadius: 6, color: C.muted, fontSize: 11, padding: "4px 6px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>+ Super</button>
    : <div />;
  const removeBtn = <button onClick={onRemove} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 18, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>;
  return (
    <div style={{ marginBottom: isNarrow ? 12 : 6 }}>
      {label && <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 4 }}><div style={{ width: 20, height: 20, borderRadius: 5, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 10, fontWeight: 900, color: C.bg }}>{label}</span></div><span style={{ fontSize: 10, color: C.gold, fontWeight: 700 }}>SUPERSET</span></div>}
      {isNarrow ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>{nameInput}{removeBtn}</div>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>{setsInput}{repsInput}{loadInput}{bwBtn}</div>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>{noteInput}{swapBtn}{pairBtn}</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 52px 60px 46px 34px 1fr 70px 70px 24px", gap: 5, alignItems: "center" }}>
          {nameInput}{setsInput}{repsInput}{loadInput}{bwBtn}{noteInput}{swapBtn}{pairBtn}{removeBtn}
        </div>
      )}
    </div>
  );
}

// ─── MOVE PICKER ──────────────────────────────────────────────────────────────
// Searchable, type-filterable list of every move in the library, alphabetical.
// multi: checkboxes + "Add N moves" footer via onAdd(names).
// single (multi=false): tapping a move calls onPick(name) immediately (used by Swap).
// Typing something not in the library offers an "add as custom move" row.
function MovePicker({ title, subtitle, multi, onAdd, onPick, onClose }) {
  const isNarrow = useIsNarrow();
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const q = search.trim().toLowerCase();
  const list = EXERCISE_BANK
    .filter((n) => (filter === "ALL" || getMoveTypes(n).includes(filter)) && (!q || n.toLowerCase().includes(q)))
    .sort((a, b) => a.localeCompare(b));
  const customName = q && !EXERCISE_BANK.some((n) => n.toLowerCase() === q) ? search.trim() : null;
  const pick = (name) => {
    if (!multi) { onPick(name); return; }
    setSelected((s) => s.includes(name) ? s.filter((x) => x !== name) : [...s, name]);
  };
  const chip = (key, label) => (
    <button key={key} onClick={() => setFilter(key)} style={{ border: `1px solid ${filter === key ? C.teal : C.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: filter === key ? C.tealGlow : "transparent", color: filter === key ? C.teal : C.mutedUp, whiteSpace: "nowrap", textTransform: "capitalize" }}>{label}</button>
  );
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 300, display: "flex", alignItems: isNarrow ? "flex-end" : "center", justifyContent: "center", padding: isNarrow ? 0 : 20 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: isNarrow ? "18px 18px 0 0" : 16, width: "100%", maxWidth: 560, padding: isNarrow ? "14px 14px calc(14px + env(safe-area-inset-bottom))" : 22, display: "flex", flexDirection: "column", maxHeight: isNarrow ? "88vh" : "80vh", boxShadow: `0 0 60px ${C.tealGlow}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <h3 style={{ margin: 0, color: C.white, fontSize: 17, fontWeight: 800 }}>{title}</h3>
            {subtitle && <p style={{ margin: "3px 0 0", color: C.muted, fontSize: 12 }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 24, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {chip("ALL", "All")}
          {Object.keys(EXERCISE_CATEGORIES).map((t) => chip(t, t.toLowerCase()))}
        </div>
        <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search moves…" style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", width: "100%", marginBottom: 8 }} />
        <div style={{ overflowY: "auto", flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 6 }}>
          {list.map((n) => { const on = multi && selected.includes(n); return (
            <button key={n} onClick={() => pick(n)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: on ? C.tealGlow : "transparent", border: `1px solid ${on ? C.teal : "transparent"}`, borderRadius: 8, padding: "7px 10px", cursor: "pointer", fontFamily: "inherit" }}>
              {multi && <div style={{ width: 15, height: 15, borderRadius: 4, border: `2px solid ${on ? C.teal : C.muted}`, background: on ? C.teal : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{on && <span style={{ color: C.bg, fontSize: 9, fontWeight: 900 }}>✓</span>}</div>}
              <span style={{ fontSize: 13, color: on ? C.teal : C.white, flex: 1, textAlign: "left", minWidth: 0 }}>{n}</span>
              <span style={{ fontSize: 10, color: C.muted, whiteSpace: "nowrap", flexShrink: 0 }}>{getMoveTypes(n).map((t) => t.toLowerCase()).join(" · ")}</span>
            </button>
          ); })}
          {customName && (
            <button onClick={() => { pick(customName); if (multi) setSearch(""); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "transparent", border: `1px dashed ${C.teal}66`, borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontFamily: "inherit", marginTop: 3 }}>
              <span style={{ fontSize: 13, color: C.teal, fontWeight: 700, textAlign: "left" }}>+ Add "{customName}" as custom move</span>
            </button>
          )}
          {list.length === 0 && !customName && <p style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "20px 0", margin: 0 }}>No moves match.</p>}
        </div>
        {multi && (
          <div style={{ paddingTop: 10 }}>
            {selected.length > 0 && <p style={{ margin: "0 0 8px", fontSize: 11, color: C.mutedUp, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Selected: {selected.join(" · ")}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
              <Btn onClick={() => onAdd(selected)} disabled={selected.length === 0} style={{ flex: 2 }}>Add {selected.length || ""} move{selected.length !== 1 ? "s" : ""}</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PAIR PICKER ──────────────────────────────────────────────────────────────
function PairPicker({ exercise, blockExercises, onPick, onClose }) {
  const candidates = blockExercises.filter((e) => e.id !== exercise.id && !e.pairId);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 14, width: "100%", maxWidth: 380, padding: 22 }}>
        <h3 style={{ margin: "0 0 6px", color: C.white, fontSize: 16 }}>Pair with…</h3>
        <p style={{ margin: "0 0 16px", color: C.muted, fontSize: 13 }}>"{exercise.name || "this exercise"}" will be paired as a superset</p>
        {candidates.map((e) => (
          <button key={e.id} onClick={() => onPick(e.id)} style={{ display: "block", width: "100%", background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px 14px", marginBottom: 7, color: C.white, fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>{e.name || "(unnamed)"}</button>
        ))}
        <Btn variant="ghost" onClick={onClose} style={{ width: "100%", marginTop: 4 }}>Cancel</Btn>
      </div>
    </div>
  );
}

// ─── WORKOUT BUILDER ──────────────────────────────────────────────────────────
function BuilderModal({ athletes, onSave, onClose, editWkt }) {
  const isNarrow = useIsNarrow();
  const [title, setTitle] = useState(editWkt?.title || "");
  const [date, setDate] = useState(editWkt?.date || today());
  const [assignees, setAssignees] = useState(editWkt?.assignees || []);
  const [blocks, setBlocks] = useState(() => editWkt?.blocks ? JSON.parse(JSON.stringify(editWkt.blocks)) : initBlocks());
  const [focus, setFocus] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genErr, setGenErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [pairTarget, setPairTarget] = useState(null);
  const [swapTarget, setSwapTarget] = useState(null);
  const [pickerBlock, setPickerBlock] = useState(null); // block index the move picker adds to
  const [search, setSearch] = useState("");

  const updEx = (bi, ei, ex) => setBlocks((bs) => bs.map((b, i) => i === bi ? { ...b, exercises: b.exercises.map((e, j) => j === ei ? ex : e) } : b));
  const remEx = (bi, ei) => setBlocks((bs) => bs.map((b, i) => { if (i !== bi) return b; const removed = b.exercises[ei]; return { ...b, exercises: b.exercises.filter((_, j) => j !== ei).map((e) => e.pairId && e.pairId === removed?.pairId ? { ...e, pairId: null } : e) }; }));
  const addMoves = (bi, names) => setBlocks((bs) => bs.map((b, i) => i === bi ? { ...b, exercises: [...b.exercises, ...names.map((n) => ({ ...emptyEx(), name: n }))] } : b));
  const handlePair = (bi, exId) => setPairTarget({ bi, exId });
  const handlePickPair = (partnerId) => {
    if (!pairTarget) return;
    const newPairId = uid();
    setBlocks((bs) => bs.map((b, i) => i !== pairTarget.bi ? b : { ...b, exercises: b.exercises.map((e) => e.id === pairTarget.exId || e.id === partnerId ? { ...e, pairId: newPairId } : e) }));
    setPairTarget(null);
  };
  const handleUnpair = (bi, exId) => setBlocks((bs) => bs.map((b, i) => { if (i !== bi) return b; const exItem = b.exercises.find((e) => e.id === exId); if (!exItem?.pairId) return b; return { ...b, exercises: b.exercises.map((e) => e.pairId === exItem.pairId ? { ...e, pairId: null } : e) }; }));
  const handleSwapConfirm = (newName) => {
    if (!swapTarget) return;
    const { bi, exId } = swapTarget;
    setBlocks((bs) => bs.map((b, i) => i !== bi ? b : { ...b, exercises: b.exercises.map((e) => e.id === exId ? { ...e, name: newName } : e) }));
    setSwapTarget(null);
  };
  const toggleAthlete = (id) => setAssignees((a) => a.includes(id) ? a.filter((x) => x !== id) : [...a, id]);
  const poolGroups = [...new Set(athletes.map((a) => a.event).filter(Boolean))];
  const champTags = ["Regional", "State"].filter((tag) => athletes.some((a) => a.champTag === tag));
  const selectGroup = (group) => { const ids = athletes.filter((a) => a.event === group).map((a) => a.id); const allOn = ids.every((id) => assignees.includes(id)); setAssignees((a) => allOn ? a.filter((x) => !ids.includes(x)) : [...new Set([...a, ...ids])]); };
  const selectTag = (tag) => { const ids = athletes.filter((a) => a.champTag === tag).map((a) => a.id); const allOn = ids.length > 0 && ids.every((id) => assignees.includes(id)); setAssignees((a) => allOn ? a.filter((x) => !ids.includes(x)) : [...new Set([...a, ...ids])]); };
  const selectByField = (field, value) => { const ids = athletes.filter((a) => a[field] === value).map((a) => a.id); const allOn = ids.length > 0 && ids.every((id) => assignees.includes(id)); setAssignees((a) => allOn ? a.filter((x) => !ids.includes(x)) : [...new Set([...a, ...ids])]); };
  // Stroke/distance quick-select groups — only ones at least one athlete has set.
  const specialtyGroups = [...STROKES.map((s) => ["stroke", s, "🏊"]), ...DISTANCES.map((d) => ["distance", d, "⏱"])].filter(([f, v]) => athletes.some((a) => a[f] === v));
  const handleGen = async () => {
    const target = athletes.find((a) => assignees.includes(a.id)) || athletes[0];
    if (!target) return;
    setGenerating(true); setGenErr("");
    try { const b = await generateWorkout(target, focus); setBlocks(b); if (!title) setTitle(`${focus || "Strength Power"} – ${target.event || "Group"}`); }
    catch { setGenErr("Generation failed — check API key in .env"); }
    setGenerating(false);
  };
  const handleSave = async () => {
    if (!title || assignees.length === 0) return;
    setSaving(true);
    await onSave({ id: editWkt?.id || uid(), title, date, assignees, blocks });
    setSaving(false);
  };
  const inp = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", width: "100%" };
  const filteredAthletes = athletes.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 100, overflowY: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "calc(24px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom))" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 18, width: "100%", maxWidth: 900, padding: isNarrow ? 16 : 28, boxShadow: `0 0 60px ${C.tealGlow}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ margin: 0, color: C.white, fontSize: 20, fontWeight: 800 }}>{editWkt ? "Edit workout" : "New workout"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 24, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 160px", gap: 12, marginBottom: 18 }}>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>TITLE</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Strength Power – Week 5" style={inp} /></div>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>DATE</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inp} /></div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em" }}>Assign to</label>
            <span style={{ fontSize: 12, color: assignees.length > 0 ? C.teal : C.muted, fontWeight: 700 }}>{assignees.length} athlete{assignees.length !== 1 ? "s" : ""}</span>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ width: isNarrow ? "100%" : 160, background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden", flexShrink: 0 }}>
              <div style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>Groups</div>
              <div style={{ padding: 6, display: isNarrow ? "grid" : "block", gridTemplateColumns: isNarrow ? "1fr 1fr" : undefined, gap: isNarrow ? 3 : undefined }}>
                {poolGroups.map((g) => { const gIds = athletes.filter((a) => a.event === g).map((a) => a.id); const allOn = gIds.length > 0 && gIds.every((id) => assignees.includes(id)); const someOn = gIds.some((id) => assignees.includes(id)); return (
                  <button key={g} onClick={() => selectGroup(g)} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", background: allOn ? C.tealGlow : "transparent", border: `1px solid ${allOn || someOn ? C.teal : "transparent"}`, borderRadius: 7, padding: "6px 8px", cursor: "pointer", marginBottom: 3, fontFamily: "inherit" }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${allOn ? C.teal : someOn ? C.teal : C.muted}`, background: allOn ? C.teal : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{allOn && <span style={{ color: C.bg, fontSize: 9, fontWeight: 900 }}>✓</span>}{someOn && !allOn && <span style={{ color: C.teal, fontSize: 11, lineHeight: 1 }}>–</span>}</div>
                    <span style={{ fontSize: 12, color: allOn ? C.teal : C.white, flex: 1, textAlign: "left" }}>{g}</span>
                    <span style={{ fontSize: 10, color: C.muted }}>{gIds.length}</span>
                  </button>
                ); })}
                {poolGroups.length === 0 && <p style={{ color: C.muted, fontSize: 12, padding: "6px 4px", margin: 0 }}>No groups</p>}
                {champTags.length > 0 && <div style={{ height: 1, background: C.border, margin: "4px 0" }} />}
                {champTags.map((tag) => { const gIds = athletes.filter((a) => a.champTag === tag).map((a) => a.id); const allOn = gIds.length > 0 && gIds.every((id) => assignees.includes(id)); const someOn = gIds.some((id) => assignees.includes(id)); return (
                  <button key={tag} onClick={() => selectTag(tag)} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", background: allOn ? `${C.gold}22` : "transparent", border: `1px solid ${allOn || someOn ? C.gold : "transparent"}`, borderRadius: 7, padding: "6px 8px", cursor: "pointer", marginBottom: 3, fontFamily: "inherit" }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${allOn ? C.gold : someOn ? C.gold : C.muted}`, background: allOn ? C.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{allOn && <span style={{ color: C.bg, fontSize: 9, fontWeight: 900 }}>✓</span>}{someOn && !allOn && <span style={{ color: C.gold, fontSize: 11, lineHeight: 1 }}>–</span>}</div>
                    <span style={{ fontSize: 12, color: allOn ? C.gold : C.white, flex: 1, textAlign: "left" }}>🏆 {tag}</span>
                    <span style={{ fontSize: 10, color: C.muted }}>{gIds.length}</span>
                  </button>
                ); })}
                {specialtyGroups.length > 0 && <div style={{ height: 1, background: C.border, margin: "4px 0", gridColumn: "1/-1" }} />}
                {specialtyGroups.map(([field, val, icon]) => { const gIds = athletes.filter((a) => a[field] === val).map((a) => a.id); const allOn = gIds.length > 0 && gIds.every((id) => assignees.includes(id)); const someOn = gIds.some((id) => assignees.includes(id)); return (
                  <button key={field + val} onClick={() => selectByField(field, val)} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", background: allOn ? C.tealGlow : "transparent", border: `1px solid ${allOn || someOn ? C.teal : "transparent"}`, borderRadius: 7, padding: "6px 8px", cursor: "pointer", marginBottom: 3, fontFamily: "inherit" }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${allOn || someOn ? C.teal : C.muted}`, background: allOn ? C.teal : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{allOn && <span style={{ color: C.bg, fontSize: 9, fontWeight: 900 }}>✓</span>}{someOn && !allOn && <span style={{ color: C.teal, fontSize: 11, lineHeight: 1 }}>–</span>}</div>
                    <span style={{ fontSize: 12, color: allOn ? C.teal : C.white, flex: 1, textAlign: "left" }}>{icon} {val}</span>
                    <span style={{ fontSize: 10, color: C.muted }}>{gIds.length}</span>
                  </button>
                ); })}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: isNarrow ? "100%" : 260, background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ padding: "6px 10px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", whiteSpace: "nowrap" }}>Athletes</span>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 6, color: C.white, padding: "3px 8px", fontSize: 12, fontFamily: "inherit", flex: 1, minWidth: 0 }} />
              </div>
              <div style={{ overflowY: "auto", maxHeight: 200, padding: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
                {filteredAthletes.map((a) => { const on = assignees.includes(a.id); return (
                  <button key={a.id} onClick={() => toggleAthlete(a.id)} style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, background: on ? C.tealGlow : "transparent", border: `1px solid ${on ? C.teal : "transparent"}`, borderRadius: 7, padding: "5px 8px", cursor: "pointer", fontFamily: "inherit" }}>
                    <div style={{ width: 13, height: 13, borderRadius: 3, border: `2px solid ${on ? C.teal : C.muted}`, background: on ? C.teal : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{on && <span style={{ color: C.bg, fontSize: 8, fontWeight: 900 }}>✓</span>}</div>
                    <span style={{ fontSize: 12, color: on ? C.teal : C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
                  </button>
                ); })}
              </div>
            </div>
          </div>
        </div>
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.teal, whiteSpace: "nowrap" }}>✦ AI Generate</span>
          <input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. strength power — DB front squat + box jumps" style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 7, color: C.white, padding: "7px 10px", fontSize: 13, fontFamily: "inherit", flex: 1, minWidth: 180 }} />
          <Btn onClick={handleGen} disabled={generating} small>{generating ? "Generating…" : "Generate"}</Btn>
          {genErr && <span style={{ color: C.red, fontSize: 12 }}>{genErr}</span>}
        </div>
        <datalist id="exbank">{EXERCISE_BANK.map((e) => <option key={e} value={e} label={getMoveTypes(e).join(" · ")} />)}</datalist>
        {(() => {
          const covered = getWorkoutMoveTypes(blocks);
          const count = REQUIRED_MOVE_TYPES.filter((t) => covered.has(t)).length;
          const complete = count === REQUIRED_MOVE_TYPES.length;
          return (
            <div style={{ background: C.bg, border: `1px solid ${complete ? C.teal : C.gold}44`, borderRadius: 10, padding: "8px 14px", marginBottom: 14, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: complete ? C.teal : C.gold, whiteSpace: "nowrap" }}>Move types {count}/{REQUIRED_MOVE_TYPES.length}</span>
              {REQUIRED_MOVE_TYPES.map((t) => { const on = covered.has(t); return (
                <span key={t} style={{ fontSize: 11, fontWeight: 700, textTransform: "capitalize", color: on ? C.teal : C.muted, background: on ? C.tealGlow : "transparent", border: `1px solid ${on ? C.teal : C.border}`, borderRadius: 20, padding: "2px 10px" }}>{on ? "✓ " : ""}{t.toLowerCase()}</span>
              ); })}
              {covered.has("FUNCTION") && <span style={{ fontSize: 11, fontWeight: 700, color: C.mutedUp, border: `1px solid ${C.border}`, borderRadius: 20, padding: "2px 10px" }}>✓ function</span>}
              {!complete && <span style={{ fontSize: 11, color: C.muted }}>aim for at least one squat, hinge, push, pull & brace move</span>}
            </div>
          );
        })()}
        {!isNarrow && <div style={{ display: "grid", gridTemplateColumns: "1fr 52px 60px 46px 34px 1fr 70px 70px 24px", gap: 5, marginBottom: 6 }}>
          {["Exercise","Sets","Reps","Load","BW","Coaching cue","","",""].map((h, i) => <span key={i} style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</span>)}
        </div>}
        {blocks.map((block, bi) => {
          const labels = getSupersetLabels(block.exercises);
          const rendered = []; const seen = new Set();
          block.exercises.forEach((ex, ei) => {
            if (seen.has(ex.id)) return;
            if (ex.pairId) {
              const partner = block.exercises.find((e) => e.id !== ex.id && e.pairId === ex.pairId);
              if (partner) {
                const partnerEi = block.exercises.indexOf(partner);
                seen.add(ex.id); seen.add(partner.id);
                rendered.push(
                  <div key={ex.pairId} style={{ background: `${C.gold}08`, border: `1px solid ${C.gold}33`, borderRadius: 10, padding: "10px 10px 6px", marginBottom: 8 }}>
                    <ExRow ex={ex} label={labels[ex.id]} blockExercises={block.exercises} onChange={(u) => updEx(bi, ei, u)} onRemove={() => remEx(bi, ei)} onPair={() => handlePair(bi, ex.id)} onUnpair={() => handleUnpair(bi, ex.id)} onSwap={() => setSwapTarget({ bi, exId: ex.id })} />
                    <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "2px 0 4px 10px" }}><div style={{ width: 1, height: 10, background: C.gold, opacity: .4 }} /><span style={{ fontSize: 10, color: C.gold, opacity: .6 }}>superset</span></div>
                    <ExRow ex={partner} label={labels[partner.id]} blockExercises={block.exercises} onChange={(u) => updEx(bi, partnerEi, u)} onRemove={() => remEx(bi, partnerEi)} onPair={() => handlePair(bi, partner.id)} onUnpair={() => handleUnpair(bi, partner.id)} onSwap={() => setSwapTarget({ bi, exId: partner.id })} />
                  </div>
                );
                return;
              }
            }
            seen.add(ex.id);
            rendered.push(<ExRow key={ex.id} ex={ex} label={null} blockExercises={block.exercises} onChange={(u) => updEx(bi, ei, u)} onRemove={() => remEx(bi, ei)} onPair={() => handlePair(bi, ex.id)} onUnpair={() => handleUnpair(bi, ex.id)} onSwap={() => setSwapTarget({ bi, exId: ex.id })} />);
          });
          return (
            <div key={block.id} style={{ marginBottom: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><div style={{ width: 3, height: 16, borderRadius: 2, background: BLOCK_COLORS[bi] || C.muted }} /><span style={{ fontSize: 12, fontWeight: 800, color: BLOCK_COLORS[bi] || C.muted, textTransform: "uppercase", letterSpacing: ".05em" }}>{block.name}</span></div>
              {rendered}
              <button onClick={() => setPickerBlock(bi)} style={{ background: "none", border: `1px dashed ${C.border}`, borderRadius: 7, color: C.muted, fontSize: 12, padding: "5px 14px", cursor: "pointer", marginTop: 4, fontFamily: "inherit" }}>+ Add exercise</button>
            </div>
          );
        })}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8, borderTop: `1px solid ${C.border}`, paddingTop: 18 }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={!title || assignees.length === 0 || saving}>{saving ? "Saving…" : `Save workout (${assignees.length} athlete${assignees.length !== 1 ? "s" : ""})`}</Btn>
        </div>
      </div>
      {pairTarget && <PairPicker exercise={blocks[pairTarget.bi].exercises.find((e) => e.id === pairTarget.exId)} blockExercises={blocks[pairTarget.bi].exercises} onPick={handlePickPair} onClose={() => setPairTarget(null)} />}
      {pickerBlock !== null && <MovePicker multi title="Add moves" subtitle={`Adding to ${blocks[pickerBlock].name}`} onAdd={(names) => { addMoves(pickerBlock, names); setPickerBlock(null); }} onClose={() => setPickerBlock(null)} />}
      {swapTarget && <MovePicker title="Swap exercise" subtitle={`Replacing: ${blocks[swapTarget.bi].exercises.find((e) => e.id === swapTarget.exId)?.name || "unnamed"}`} onPick={handleSwapConfirm} onClose={() => setSwapTarget(null)} />}
    </div>
  );
}

// ─── SESSION DETAIL MODAL ─────────────────────────────────────────────────────
function SessionDetailModal({ log, workout, athlete, onClose }) {
  if (!log || !workout) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.82)", zIndex: 200, overflowY: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "calc(24px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom))" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 18, width: "100%", maxWidth: 640, padding: 26 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div><h2 style={{ margin: 0, color: C.white, fontSize: 18, fontWeight: 800 }}>{workout.title}</h2><p style={{ margin: "3px 0 0", color: C.muted, fontSize: 13 }}>{athlete?.name} · {fmtDate(log.date)}</p></div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 24, cursor: "pointer" }}>×</button>
        </div>
        {log.rpe && <div style={{ background: C.surfaceUp, borderRadius: 10, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}><span style={{ fontSize: 12, color: C.muted }}>RPE</span><span style={{ fontSize: 28, fontWeight: 900, color: C.gold }}>{log.rpe}<span style={{ fontSize: 14, color: C.muted }}>/10</span></span>{log.note && <span style={{ fontSize: 13, color: C.mutedUp, fontStyle: "italic", flex: 1 }}>"{log.note}"</span>}</div>}
        {workout.blocks?.map((block, bi) => {
          const labels = getSupersetLabels(block.exercises);
          const seen = new Set(); const rendered = [];
          block.exercises.forEach((ex) => {
            if (seen.has(ex.id)) return;
            const exSets = log.sets?.[ex.id] || [];
            const loggedSets = exSets.filter((s) => s.reps || s.load || s.done);
            if (ex.pairId) {
              const partner = block.exercises.find((e) => e.id !== ex.id && e.pairId === ex.pairId);
              if (partner) {
                seen.add(ex.id); seen.add(partner.id);
                const partnerSets = (log.sets?.[partner.id] || []).filter((s) => s.reps || s.load || s.done);
                rendered.push(
                  <div key={ex.pairId} style={{ background: `${C.gold}08`, border: `1px solid ${C.gold}33`, borderRadius: 12, padding: 12, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><div style={{ width: 18, height: 18, borderRadius: 4, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 9, fontWeight: 900, color: C.bg }}>{labels[ex.id]?.[0]}</span></div><span style={{ fontSize: 11, fontWeight: 800, color: C.gold }}>SUPERSET</span></div>
                    {[{ e: ex, s: loggedSets }, { e: partner, s: partnerSets }].map(({ e, s }) => (
                      <div key={e.id} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span style={{ color: C.white, fontWeight: 600, fontSize: 13 }}>{e.name}</span><span style={{ color: C.muted, fontSize: 11 }}>{e.sets}×{e.reps}</span></div>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{s.length > 0 ? s.map((row, i) => <div key={i} style={{ fontSize: 12, background: row.done ? C.tealGlow : C.surfaceUp, border: `1px solid ${row.done ? C.teal : C.border}`, borderRadius: 6, padding: "3px 10px", color: row.done ? C.teal : C.mutedUp }}>S{i + 1}: {row.reps || "—"} @ {row.load || "—"}</div>) : <span style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>Not logged</span>}</div>
                      </div>
                    ))}
                  </div>
                );
                return;
              }
            }
            seen.add(ex.id);
            rendered.push(
              <div key={ex.id} style={{ background: C.surfaceUp, borderRadius: 10, padding: "10px 14px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ color: C.white, fontWeight: 600, fontSize: 14 }}>{ex.name}</span><span style={{ color: C.muted, fontSize: 12 }}>{ex.sets}×{ex.reps}{ex.load ? ` @ ${ex.load}` : ""}</span></div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{loggedSets.length > 0 ? loggedSets.map((row, i) => <div key={i} style={{ fontSize: 12, background: row.done ? C.tealGlow : C.bg, border: `1px solid ${row.done ? C.teal : C.border}`, borderRadius: 6, padding: "3px 10px", color: row.done ? C.teal : C.mutedUp }}>S{i + 1}: {row.reps || "—"} @ {row.load || "—"}</div>) : <span style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>Not logged</span>}</div>
              </div>
            );
          });
          return (
            <div key={block.id} style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><div style={{ width: 3, height: 14, borderRadius: 2, background: BLOCK_COLORS[bi] || C.muted }} /><span style={{ fontSize: 11, fontWeight: 800, color: BLOCK_COLORS[bi] || C.muted, textTransform: "uppercase", letterSpacing: ".06em" }}>{block.name}</span></div>
              {rendered}
              {log.blockNotes?.[block.id] && <p style={{ margin: "6px 0 0", fontSize: 12, color: C.mutedUp, fontStyle: "italic", background: C.bg, borderRadius: 7, padding: "6px 10px" }}>"{log.blockNotes[block.id]}"</p>}
            </div>
          );
        })}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}><Btn variant="ghost" onClick={onClose}>Close</Btn></div>
      </div>
    </div>
  );
}

// ─── LOG MODAL ────────────────────────────────────────────────────────────────
function LogModal({ workout, athleteId, existingLog, allLogs, allWorkouts, progressions = [], onConsumeProgressions, onSave, onClose }) {
  // Coach bumps that fire in this session, frozen at open: { [exId]: { rule, base, target } }.
  // Only fresh logs get pre-filled — re-opening a saved log never re-fills or re-consumes.
  const [prefills] = useState(() => {
    if (existingLog) return {};
    const map = {};
    workout.blocks.forEach((b) => b.exercises.forEach((ex) => {
      if (ex.load?.trim().toUpperCase() === "BW") return;
      const fill = getProgressionFill(ex.name, athleteId, progressions, allLogs, allWorkouts, workout.id);
      if (fill) map[ex.id] = fill;
    }));
    return map;
  });
  const [sets, setSets] = useState(() => {
    const init = {};
    workout.blocks.forEach((b) => b.exercises.forEach((ex) => {
      const isBW = ex.load?.trim().toUpperCase() === "BW";
      // Pre-filled loads bypass updSet on purpose: the set stays not-done until the athlete confirms.
      init[ex.id] = existingLog?.sets?.[ex.id] || Array.from({ length: parseInt(ex.sets) || 3 }, () => ({ reps: "", load: isBW ? "BW" : prefills[ex.id] ? String(prefills[ex.id].target) : "", done: false }));
    }));
    return init;
  });
  const [note, setNote] = useState(existingLog?.note || "");
  const [blockNotes, setBlockNotes] = useState(() => { const init = {}; workout.blocks.forEach((b) => { init[b.id] = existingLog?.blockNotes?.[b.id] || ""; }); return init; });
  const [rpe, setRpe] = useState(existingLog?.rpe || "");
  const [saving, setSaving] = useState(false);
  const updSet = (exId, idx, k, v, isBW, prescribedReps) => setSets((s) => ({
    ...s,
    [exId]: s[exId].map((r, i) => {
      if (i !== idx) return r;
      const updated = { ...r, [k]: v };
      // Auto-mark complete: weighted exercises complete when a load is entered;
      // bodyweight exercises complete when reps are entered (load is pre-filled/locked).
      if (!isBW && k === "load") {
        updated.done = v.trim() !== "";
        // If they entered weight but never touched reps, fall back to the prescribed rep count
        if (v.trim() !== "" && !updated.reps.trim()) updated.reps = prescribedReps;
      }
      if (isBW && k === "reps") updated.done = v.trim() !== "";
      return updated;
    }),
  }));
  // Carry a finished weight entry forward to later sets that haven't been given their own weight yet.
  // Runs on blur (not on every keystroke) so it sees the fully-typed value instead of the first digit.
  const fillLoadForward = (exId, idx, v) => {
    if (!v.trim()) return;
    setSets((s) => ({
      ...s,
      [exId]: s[exId].map((r, i) => (i > idx && !r.load.trim()) ? { ...r, load: v } : r),
    }));
  };
  const toggleDone = (exId, idx, prescribedReps) => {
    setSets((s) => { const current = s[exId][idx]; const nowDone = !current.done; const reps = current.reps || (nowDone ? prescribedReps : ""); return { ...s, [exId]: s[exId].map((r, i) => i === idx ? { ...r, done: nowDone, reps } : r) }; });
  };
  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave({ athleteId, workoutId: workout.id, date: workout.date, sets, note, blockNotes, rpe });
    // A bump is one-time: consume every rule that fired in this session, even if the athlete edited the value.
    if (ok !== false && onConsumeProgressions) {
      const ruleIds = [...new Set(Object.values(prefills).map((p) => p.rule.id))];
      if (ruleIds.length) await onConsumeProgressions(ruleIds);
    }
    setSaving(false);
  };
  const inpSm = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, color: C.white, padding: "4px 6px", fontSize: 13, textAlign: "center", fontFamily: "inherit", boxSizing: "border-box" };

  const renderExLog = (ex, isSupersetMember = false) => {
    const history = getLastSets(ex.name, athleteId, allLogs, allWorkouts, workout.id);
    const isBWEx = ex.load?.trim().toUpperCase() === "BW";
    const bestInfo = !isBWEx ? getBestLoad(ex.name, athleteId, allLogs, allWorkouts, workout.id) : null;
    return (
      <div key={ex.id} style={{ background: isSupersetMember ? "transparent" : C.surfaceUp, borderRadius: isSupersetMember ? 8 : 10, padding: "10px 12px", marginBottom: isSupersetMember ? 0 : 8, border: isSupersetMember ? `1px solid ${C.border}` : "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ color: C.white, fontWeight: 700, fontSize: 14 }}>{ex.name}</span><span style={{ color: C.muted, fontSize: 12 }}>{ex.sets}×{ex.reps}{ex.load ? ` @ ${ex.load}` : ""}</span></div>
        {(history || bestInfo) && <div style={{ display: "flex", gap: 6, marginBottom: 7, flexWrap: "wrap", alignItems: "center" }}>
          {history && <><span style={{ fontSize: 11, color: C.muted }}>Last ({fmtDate(history.date)}):</span>{history.sets.map((s, i) => <span key={i} style={{ fontSize: 11, color: C.mutedUp, background: C.bg, borderRadius: 4, padding: "1px 7px" }}>S{i + 1}: {s.reps || "—"} @ {s.load || "—"}</span>)}</>}
          {bestInfo && <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, background: `${C.gold}14`, border: `1px solid ${C.gold}33`, borderRadius: 4, padding: "1px 7px" }}>Best: {bestInfo.best}</span>}
          {prefills[ex.id] && <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, background: `${C.gold}14`, border: `1px solid ${C.gold}33`, borderRadius: 4, padding: "1px 7px" }}>⬆ Coach bump {prefills[ex.id].rule.pct > 0 ? "+" : ""}{prefills[ex.id].rule.pct}%: {prefills[ex.id].base} → {prefills[ex.id].target}</span>}
        </div>}
        {ex.note && <p style={{ margin: "0 0 8px", fontSize: 12, color: C.teal, fontStyle: "italic" }}>"{ex.note}"</p>}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {(sets[ex.id] || []).map((row, idx) => { const exIsBW = isBWEx; const loadNum = parseLoadNum(row.load); const isPR = !exIsBW && loadNum !== null && bestInfo && loadNum > bestInfo.best; return (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 4, background: row.done ? C.tealGlow : "rgba(255,255,255,.03)", border: `1px solid ${isPR ? C.gold : row.done ? C.teal : C.border}`, borderRadius: 7, padding: "4px 7px" }}>
              <span style={{ fontSize: 10, color: C.muted, width: 14 }}>S{idx + 1}</span>
              <input value={row.reps} inputMode="numeric" onChange={(e) => updSet(ex.id, idx, "reps", e.target.value, exIsBW)} placeholder={ex.reps} style={{ ...inpSm, width: 40 }} />
              <span style={{ color: C.muted, fontSize: 10 }}>@</span>
              <input value={row.load} inputMode={exIsBW ? "text" : "numeric"} disabled={exIsBW} onChange={(e) => updSet(ex.id, idx, "load", e.target.value, exIsBW, ex.reps)} onBlur={(e) => !exIsBW && fillLoadForward(ex.id, idx, e.target.value)} placeholder={ex.load || "—"} style={{ ...inpSm, width: 50, opacity: exIsBW ? 0.6 : 1 }} />
              {isPR && <span title="New PR!" style={{ fontSize: 13 }}>🔥</span>}
              <button onClick={() => toggleDone(ex.id, idx, ex.reps)} style={{ background: "none", border: "none", cursor: "pointer", color: row.done ? C.teal : C.muted, fontSize: 17, padding: 0, lineHeight: 1 }}>{row.done ? "✓" : "○"}</button>
            </div>
          ); })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.82)", zIndex: 200, overflowY: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "calc(24px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom))" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 18, width: "100%", maxWidth: 640, padding: 26, boxShadow: `0 0 60px ${C.tealGlow}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div><h2 style={{ margin: 0, color: C.white, fontSize: 18, fontWeight: 800 }}>{workout.title}</h2><p style={{ margin: "3px 0 0", color: C.muted, fontSize: 12 }}>{fmtDate(workout.date)}</p></div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 24, cursor: "pointer" }}>×</button>
        </div>
        {workout.blocks.map((block, bi) => {
          const labels = getSupersetLabels(block.exercises);
          const seen = new Set(); const rendered = [];
          block.exercises.forEach((ex) => {
            if (seen.has(ex.id)) return;
            if (ex.pairId) {
              const partner = block.exercises.find((e) => e.id !== ex.id && e.pairId === ex.pairId);
              if (partner) {
                seen.add(ex.id); seen.add(partner.id);
                rendered.push(
                  <div key={ex.pairId} style={{ background: `${C.gold}08`, border: `1px solid ${C.gold}33`, borderRadius: 12, padding: 10, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><div style={{ width: 20, height: 20, borderRadius: 5, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 9, fontWeight: 900, color: C.bg }}>{labels[ex.id]?.[0]}</span></div><span style={{ fontSize: 11, fontWeight: 800, color: C.gold }}>SUPERSET</span></div>
                    {renderExLog(ex, true)}<div style={{ height: 6 }} />{renderExLog(partner, true)}
                  </div>
                );
                return;
              }
            }
            seen.add(ex.id);
            rendered.push(renderExLog(ex, false));
          });
          const blockComplete = block.exercises.length > 0 && block.exercises.every((ex) => {
            const exSets = sets[ex.id] || [];
            return exSets.length > 0 && exSets.every((s) => s.done);
          });
          return (
            <div key={block.id} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 3, height: 14, borderRadius: 2, background: BLOCK_COLORS[bi] || C.muted }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: BLOCK_COLORS[bi] || C.muted, textTransform: "uppercase", letterSpacing: ".06em" }}>{block.name}</span>
                {blockComplete && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 800, color: C.teal, background: C.tealGlow, border: `1px solid ${C.teal}55`, borderRadius: 20, padding: "1px 8px" }}>✓ Complete</span>}
              </div>
              {rendered}
              <textarea value={blockNotes[block.id] || ""} onChange={(e) => setBlockNotes((n) => ({ ...n, [block.id]: e.target.value }))} placeholder={`Notes for ${block.name}…`} rows={2} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.mutedUp, padding: "7px 10px", fontSize: 12, width: "100%", boxSizing: "border-box", resize: "none", fontFamily: "inherit", marginTop: 8, fontStyle: "italic" }} />
            </div>
          );
        })}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: 12, marginBottom: 18 }}>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>SESSION NOTES</label><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="How did it feel? Any PRs? Anything to flag?" rows={3} style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "9px 12px", fontSize: 13, width: "100%", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} /></div>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>RPE 1–10</label><input value={rpe} onChange={(e) => setRpe(e.target.value)} type="number" min="1" max="10" placeholder="7" style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.gold, padding: "9px 8px", fontSize: 28, fontWeight: 800, width: "100%", boxSizing: "border-box", textAlign: "center", fontFamily: "inherit" }} /></div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save session"}</Btn></div>
      </div>
    </div>
  );
}

// ─── EDIT ATHLETE MODAL ───────────────────────────────────────────────────────
function EditAthleteModal({ athlete, onSave, onArchive, onDelete, onUnarchive, onClose }) {
  const [eName, setEName] = useState(athlete.name);
  const [eEvent, setEEvent] = useState(athlete.event || "");
  const [ePin, setEPin] = useState(athlete.pin);
  const [eTag, setETag] = useState(athlete.champTag || "");
  const [eSchool, setESchool] = useState(athlete.school || "");
  const [eGrade, setEGrade] = useState(athlete.grade || "");
  const [eStroke, setEStroke] = useState(athlete.stroke || "");
  const [eDistance, setEDistance] = useState(athlete.distance || "");
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const isArchived = !!athlete.archived;
  const GRADES = ["6th","7th","8th","9th","10th","11th","12th"];
  const handleSave = async () => { if (!eName || !ePin) return; setSaving(true); await onSave({ ...athlete, name: eName, event: eEvent, pin: ePin, champTag: eTag, school: eSchool, grade: eGrade, stroke: eStroke, distance: eDistance }); setSaving(false); };
  const inp = { background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", width: "100%" };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 18, width: "100%", maxWidth: 440, padding: 26, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: C.white, fontSize: 18, fontWeight: 800 }}>Edit athlete</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 24, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div style={{ gridColumn: "1/-1" }}><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>FULL NAME</label><input value={eName} onChange={(e) => setEName(e.target.value)} style={inp} /></div>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>POOL GROUP</label><input value={eEvent} onChange={(e) => setEEvent(e.target.value)} style={inp} /></div>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>PIN</label><input value={ePin} onChange={(e) => setEPin(e.target.value)} style={inp} /></div>
          <div style={{ gridColumn: "1/-1" }}><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>SCHOOL</label><input value={eSchool} onChange={(e) => setESchool(e.target.value)} placeholder="e.g. Farmington High School" style={inp} /></div>
        </div>
        {[["GRADE", GRADES, eGrade, setEGrade], ["MAIN STROKE", STROKES, eStroke, setEStroke], ["DISTANCE", DISTANCES, eDistance, setEDistance]].map(([label, options, value, setValue]) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 8 }}>{label}</label>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {options.map((g) => <button key={g} onClick={() => setValue(value === g ? "" : g)} style={{ border: `1px solid ${value === g ? C.teal : C.border}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: value === g ? C.tealGlow : "transparent", color: value === g ? C.teal : C.mutedUp }}>{g}</button>)}
            </div>
          </div>
        ))}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>CHAMPIONSHIP TAG</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[["", "None"], ["Regional", "Regional"], ["State", "State"]].map(([val, label]) => (
              <button key={val} onClick={() => setETag(val)} style={{ flex: 1, border: `1px solid ${eTag === val ? C.teal : C.border}`, borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: eTag === val ? C.tealGlow : "transparent", color: eTag === val ? C.teal : C.mutedUp }}>{label}</button>
            ))}
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {!isArchived ? (
            !confirming
              ? <button onClick={() => setConfirming(true)} style={{ background: "none", border: `1px solid rgba(255,183,0,0.3)`, borderRadius: 10, color: C.gold, fontSize: 12, fontWeight: 700, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>Archive</button>
              : <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={onArchive} style={{ background: C.gold, border: "none", borderRadius: 10, color: C.bg, fontSize: 12, fontWeight: 700, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>Confirm archive</button>
                  <button onClick={() => setConfirming(false)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 10, color: C.muted, fontSize: 12, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                </div>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={onUnarchive} style={{ background: "none", border: `1px solid ${C.teal}`, borderRadius: 10, color: C.teal, fontSize: 12, fontWeight: 700, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>Unarchive</button>
              {!confirming
                ? <button onClick={() => setConfirming(true)} style={{ background: "none", border: `1px solid rgba(255,77,77,0.3)`, borderRadius: 10, color: C.red, fontSize: 12, fontWeight: 700, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>Delete permanently</button>
                : <button onClick={onDelete} style={{ background: C.red, border: "none", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 700, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>Confirm delete</button>}
            </div>
          )}
          <div style={{ flex: 1 }} />
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={!eName || !ePin || saving}>{saving ? "Saving…" : "Save"}</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── TEST SCORE MODAL ─────────────────────────────────────────────────────────
function TestScoreModal({ athletes, onSave, onClose }) {
  const [selectedId, setSelectedId] = useState(athletes[0]?.id || "");
  const [selectedName, setSelectedName] = useState(athletes[0]?.name || "");
  const [date, setDate] = useState(today());
  const [scores, setScores] = useState({ pushups: "", pullups: "", rdl: "" });
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const filtered = athletes.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
  const inp = { background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", width: "100%" };
  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    await onSave({ id: uid(), athleteId: selectedId, date, pushups: scores.pushups ? parseInt(scores.pushups) : null, pullups: scores.pullups ? parseInt(scores.pullups) : null, rdl: scores.rdl ? parseFloat(scores.rdl) : null, notes, createdAt: Date.now() });
    setScores({ pushups: "", pullups: "", rdl: "" }); setNotes(""); setSaving(false);
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 100, overflowY: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "calc(24px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom))" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 18, width: "100%", maxWidth: 520, padding: 28, boxShadow: `0 0 60px ${C.tealGlow}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ margin: 0, color: C.white, fontSize: 20, fontWeight: 800 }}>Enter test scores</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 24, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 12, marginBottom: 18 }}>
          <div style={{ position: "relative" }}>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>ATHLETE</label>
            <input value={search || selectedName} onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} placeholder="Search athlete…" style={inp} />
            {showDropdown && search && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, zIndex: 10, maxHeight: 180, overflowY: "auto", marginTop: 4 }}>
                {filtered.map((a) => <button key={a.id} onClick={() => { setSelectedId(a.id); setSelectedName(a.name); setSearch(""); setShowDropdown(false); }} style={{ display: "block", width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${C.border}`, color: C.white, padding: "8px 12px", textAlign: "left", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>{a.name} <span style={{ color: C.muted, fontSize: 11 }}>{a.event}</span></button>)}
              </div>
            )}
          </div>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>DATE</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inp} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 18 }}>
          {TEST_METRICS.map((m) => (
            <div key={m.key} style={{ background: C.bg, borderRadius: 12, padding: 14, border: `1px solid ${C.border}`, textAlign: "center" }}>
              <p style={{ margin: "0 0 4px", fontSize: 11, color: m.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>{m.label}</p>
              <input value={scores[m.key]} onChange={(e) => setScores((s) => ({ ...s, [m.key]: e.target.value }))} inputMode="numeric" placeholder="—" style={{ background: "transparent", border: "none", borderBottom: `2px solid ${m.color}`, color: C.white, fontSize: 28, fontWeight: 800, width: "100%", textAlign: "center", fontFamily: "inherit", outline: "none", padding: "4px 0" }} />
              <p style={{ margin: "6px 0 0", fontSize: 10, color: C.muted }}>{m.unit}</p>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 18 }}><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>NOTES (optional)</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any context — injury, conditions, etc." rows={2} style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "9px 12px", fontSize: 13, width: "100%", boxSizing: "border-box", resize: "none", fontFamily: "inherit" }} /></div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={handleSave} disabled={!selectedId || saving || (!scores.pushups && !scores.pullups && !scores.rdl)}>{saving ? "Saving…" : "Save scores"}</Btn></div>
      </div>
    </div>
  );
}

// ─── ATHLETE PROGRESS CARD ────────────────────────────────────────────────────
function AthleteProgressCard({ athlete, testScores }) {
  const myScores = testScores.filter((s) => s.athleteId === athlete.id).sort((a, b) => a.date.localeCompare(b.date));
  if (myScores.length === 0) return null;
  const latest = myScores[myScores.length - 1];
  const first = myScores[0];
  const hasDelta = myScores.length >= 2;
  const getDelta = (key) => { if (!hasDelta || !latest[key] || !first[key]) return null; const diff = latest[key] - first[key]; const pct = ((diff / first[key]) * 100).toFixed(0); return { diff, pct }; };
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: `0 0 30px ${C.tealGlow}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div><p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.teal, textTransform: "uppercase", letterSpacing: ".06em" }}>Your progress</p>{hasDelta ? <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>{fmtDate(first.date)} → {fmtDate(latest.date)}</p> : <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>Baseline — {fmtDate(latest.date)}</p>}</div>
        <span style={{ fontSize: 11, color: C.muted }}>{myScores.length} test{myScores.length !== 1 ? "s" : ""}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {TEST_METRICS.map((m) => {
          const val = latest[m.key];
          const d = getDelta(m.key);
          if (!val) return <div key={m.key} style={{ background: C.bg, borderRadius: 10, padding: "12px 10px", textAlign: "center", border: `1px solid ${C.border}` }}><p style={{ margin: 0, fontSize: 10, color: C.muted, textTransform: "uppercase" }}>{m.label}</p><p style={{ margin: "6px 0 0", fontSize: 18, color: C.muted }}>—</p></div>;
          return (
            <div key={m.key} style={{ background: C.bg, borderRadius: 10, padding: "12px 10px", textAlign: "center", border: `1px solid ${m.color}33` }}>
              <p style={{ margin: 0, fontSize: 10, color: m.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>{m.label}</p>
              <p style={{ margin: "6px 0 2px", fontSize: 24, fontWeight: 900, color: C.white }}>{val}{m.key === "rdl" && <span style={{ fontSize: 11, color: C.muted, fontWeight: 400, marginLeft: 3 }}>lbs</span>}</p>
              {d && <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: d.diff >= 0 ? C.teal : C.red }}>{d.diff >= 0 ? "+" : ""}{d.diff} ({d.diff >= 0 ? "+" : ""}{d.pct}%)</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ATHLETE PR CARD ──────────────────────────────────────────────────────────
function AthletePRCard({ athlete, logs, workouts }) {
  const [expanded, setExpanded] = useState(false);
  const prs = computePRs(athlete.id, logs, workouts);
  const entries = Object.entries(prs).sort((a, b) => b[1].date.localeCompare(a[1].date));
  if (entries.length === 0) return null;
  const daysAgo = (d) => Math.floor((Date.now() - new Date(d + "T12:00:00")) / 86400000);
  const recent = entries.filter(([, v]) => daysAgo(v.date) <= 14);
  const shown = expanded ? entries : entries.slice(0, 4);
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 20px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.gold, textTransform: "uppercase", letterSpacing: ".06em" }}>🔥 Your PRs</p>
        <span style={{ fontSize: 11, color: C.muted }}>{entries.length} movement{entries.length !== 1 ? "s" : ""}{recent.length > 0 ? ` · ${recent.length} new` : ""}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {shown.map(([exName, v]) => {
          const isNew = daysAgo(v.date) <= 14;
          return (
            <div key={exName} style={{ background: C.bg, borderRadius: 10, padding: "10px 12px", border: `1px solid ${isNew ? `${C.gold}55` : C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.white, lineHeight: 1.3 }}>{exName}</p>
                {isNew && <span style={{ fontSize: 9, fontWeight: 800, color: C.gold, background: `${C.gold}1A`, borderRadius: 8, padding: "1px 6px", flexShrink: 0 }}>NEW</span>}
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 900, color: isNew ? C.gold : C.white }}>{v.best}<span style={{ fontSize: 10, color: C.muted, fontWeight: 400, marginLeft: 3 }}>lbs</span></p>
              <p style={{ margin: "1px 0 0", fontSize: 10, color: C.muted }}>{fmtDate(v.date)}</p>
            </div>
          );
        })}
      </div>
      {entries.length > 4 && (
        <button onClick={() => setExpanded((v) => !v)} style={{ background: "none", border: "none", color: C.teal, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", padding: "10px 0 0", width: "100%", textAlign: "center" }}>
          {expanded ? "Show less" : `Show all ${entries.length}`}
        </button>
      )}
    </div>
  );
}

// ─── COACH PROGRESS DASHBOARD ─────────────────────────────────────────────────
function ProgressDashboard({ athletes, testScores, onEnterScores }) {
  const [groupFilter, setGroupFilter] = useState("All");
  const [metricFilter, setMetricFilter] = useState("pushups");
  const [search, setSearch] = useState("");
  const poolGroups = [...new Set(athletes.map((a) => a.event).filter(Boolean))];
  const filteredAthletes = athletes.filter((a) => { if (groupFilter !== "All" && a.event !== groupFilter) return false; if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false; return true; });
  const athleteData = filteredAthletes.map((a) => {
    const scores = testScores.filter((s) => s.athleteId === a.id && s[metricFilter] != null).sort((x, y) => x.date.localeCompare(y.date));
    const first = scores[0]; const latest = scores[scores.length - 1];
    const diff = first && latest && scores.length >= 2 ? latest[metricFilter] - first[metricFilter] : null;
    const pct = diff !== null && first[metricFilter] ? ((diff / first[metricFilter]) * 100).toFixed(0) : null;
    return { athlete: a, first, latest, diff, pct, count: scores.length };
  }).filter((d) => d.latest);
  const sorted = [...athleteData].sort((a, b) => (b.diff || 0) - (a.diff || 0));
  const metric = TEST_METRICS.find((m) => m.key === metricFilter);
  const groupAvg = (group) => { const gIds = (group === "All" ? athletes : athletes.filter((a) => a.event === group)).map((a) => a.id); const vals = athleteData.filter((d) => gIds.includes(d.athlete.id) && d.diff !== null); if (!vals.length) return null; return (vals.reduce((s, d) => s + d.diff, 0) / vals.length).toFixed(1); };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div><h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.white }}>Progress</h1><p style={{ margin: "4px 0 0", color: C.muted, fontSize: 13 }}>{testScores.length} test entries · {athletes.filter((a) => testScores.some((s) => s.athleteId === a.id)).length} athletes tested</p></div>
        <Btn onClick={onEnterScores}>+ Enter scores</Btn>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {TEST_METRICS.map((m) => <button key={m.key} onClick={() => setMetricFilter(m.key)} style={{ border: `1px solid ${metricFilter === m.key ? m.color : C.border}`, borderRadius: 20, padding: "6px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: metricFilter === m.key ? `${m.color}22` : "transparent", color: metricFilter === m.key ? m.color : C.mutedUp }}>{m.label}</button>)}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
          {["All", ...poolGroups].map((g) => { const avg = groupAvg(g); return <button key={g} onClick={() => setGroupFilter(g)} style={{ border: `1px solid ${groupFilter === g ? C.teal : C.border}`, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: groupFilter === g ? C.tealGlow : "transparent", color: groupFilter === g ? C.teal : C.mutedUp }}>{g}{avg !== null && <span style={{ opacity: .7 }}> avg +{avg}</span>}</button>; })}
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search athlete…" style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "7px 12px", fontSize: 13, fontFamily: "inherit", width: 180 }} />
      </div>
      {sorted.length === 0 && <div style={{ textAlign: "center", padding: "48px 0", color: C.muted }}><p style={{ fontSize: 32, margin: "0 0 8px" }}>📊</p><p style={{ margin: 0 }}>No test scores yet — enter the first ones above.</p></div>}
      {sorted.map((d, i) => (
        <div key={d.athlete.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", marginBottom: 8, display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: i < 3 ? C.gold : C.muted, width: 24, textAlign: "center" }}>{i + 1}</span>
          <Avatar name={d.athlete.name} size={40} />
          <div style={{ flex: 1 }}><p style={{ margin: 0, fontWeight: 700, color: C.white, fontSize: 14 }}>{d.athlete.name}</p><p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>{d.athlete.event} · {d.count} test{d.count !== 1 ? "s" : ""}</p></div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.white }}>{d.latest[metricFilter]}{metric?.key === "rdl" && <span style={{ fontSize: 11, color: C.muted, marginLeft: 3 }}>lbs</span>}</p>
            {d.diff !== null && <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 700, color: d.diff >= 0 ? C.teal : C.red }}>{d.diff >= 0 ? "+" : ""}{d.diff} {d.pct !== null && <span style={{ opacity: .7 }}>({d.diff >= 0 ? "+" : ""}{d.pct}%)</span>}</p>}
            {d.diff === null && <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>baseline only</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── PROGRESSION (BUMPS) TAB ──────────────────────────────────────────────────
function ProgressionTab({ athletes, progressions, logs, workouts, onSave, onDelete }) {
  const isNarrow = useIsNarrow();
  const [movement, setMovement] = useState("");
  const [pct, setPct] = useState("5");
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const poolGroups = [...new Set(athletes.map((a) => a.event).filter(Boolean))];
  const champTags = ["Regional", "State"].filter((tag) => athletes.some((a) => a.champTag === tag));
  const toggleAthlete = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const selectGroup = (group) => { const ids = athletes.filter((a) => a.event === group).map((a) => a.id); const allOn = ids.every((id) => selected.includes(id)); setSelected((s) => allOn ? s.filter((x) => !ids.includes(x)) : [...new Set([...s, ...ids])]); };
  const selectTag = (tag) => { const ids = athletes.filter((a) => a.champTag === tag).map((a) => a.id); const allOn = ids.length > 0 && ids.every((id) => selected.includes(id)); setSelected((s) => allOn ? s.filter((x) => !ids.includes(x)) : [...new Set([...s, ...ids])]); };
  const selectByField = (field, value) => { const ids = athletes.filter((a) => a[field] === value).map((a) => a.id); const allOn = ids.length > 0 && ids.every((id) => selected.includes(id)); setSelected((s) => allOn ? s.filter((x) => !ids.includes(x)) : [...new Set([...s, ...ids])]); };
  const specialtyGroups = [...STROKES.map((s) => ["stroke", s, "🏊"]), ...DISTANCES.map((d) => ["distance", d, "⏱"])].filter(([f, v]) => athletes.some((a) => a[f] === v));
  const filteredAthletes = athletes.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
  const pctNum = parseFloat(pct);
  const canCreate = movement.trim() && !isNaN(pctNum) && pctNum !== 0 && selected.length > 0;
  const inp = { background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", width: "100%" };

  // Base → target preview for one athlete, same math as getProgressionFill but without a rule yet.
  const previewFor = (athleteId, exName, p) => {
    const hist = getLastSets(exName, athleteId, logs, workouts, null);
    const nums = (hist?.sets || []).map((s) => parseLoadNum(s.load)).filter((n) => n !== null && n > 0);
    if (!nums.length) return null;
    const base = Math.max(...nums);
    return { base, target: roundLoad(base * (1 + p / 100)) };
  };

  const handleCreate = async () => {
    if (!canCreate || saving) return;
    setSaving(true);
    await onSave(selected.map((athleteId) => ({ id: uid(), athleteId, exerciseName: movement.trim(), pct: pctNum, createdAt: Date.now() })));
    setMovement(""); setPct("5"); setSelected([]); setSearch("");
    setSaving(false);
  };

  const pending = [...progressions].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.white }}>Weight bumps</h1>
        <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 13 }}>Pre-fill an athlete's next session of a movement with their last weight bumped by a percentage. One-time: the bump clears once they log it.</p>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 24 }}>
        <datalist id="exbank-prog">{EXERCISE_BANK.map((e) => <option key={e} value={e} label={getMoveTypes(e).join(" · ")} />)}</datalist>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 12, marginBottom: 14 }}>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>MOVEMENT</label><input value={movement} onChange={(e) => setMovement(e.target.value)} list="exbank-prog" placeholder="e.g. Back Squat" style={inp} /></div>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>INCREASE %</label>
            <div style={{ position: "relative" }}>
              <input value={pct} onChange={(e) => setPct(e.target.value)} inputMode="numeric" placeholder="5" style={{ ...inp, paddingRight: 26 }} />
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13 }}>%</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <label style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em" }}>Apply to</label>
          <span style={{ fontSize: 12, color: selected.length > 0 ? C.teal : C.muted, fontWeight: 700 }}>{selected.length} athlete{selected.length !== 1 ? "s" : ""}</span>
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ width: isNarrow ? "100%" : 160, background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden", flexShrink: 0 }}>
            <div style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>Groups</div>
            <div style={{ padding: 6, display: isNarrow ? "grid" : "block", gridTemplateColumns: isNarrow ? "1fr 1fr" : undefined, gap: isNarrow ? 3 : undefined }}>
              {poolGroups.map((g) => { const gIds = athletes.filter((a) => a.event === g).map((a) => a.id); const allOn = gIds.length > 0 && gIds.every((id) => selected.includes(id)); const someOn = gIds.some((id) => selected.includes(id)); return (
                <button key={g} onClick={() => selectGroup(g)} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", background: allOn ? C.tealGlow : "transparent", border: `1px solid ${allOn || someOn ? C.teal : "transparent"}`, borderRadius: 7, padding: "6px 8px", cursor: "pointer", marginBottom: 3, fontFamily: "inherit" }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${allOn ? C.teal : someOn ? C.teal : C.muted}`, background: allOn ? C.teal : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{allOn && <span style={{ color: C.bg, fontSize: 9, fontWeight: 900 }}>✓</span>}{someOn && !allOn && <span style={{ color: C.teal, fontSize: 11, lineHeight: 1 }}>–</span>}</div>
                  <span style={{ fontSize: 12, color: allOn ? C.teal : C.white, flex: 1, textAlign: "left" }}>{g}</span>
                  <span style={{ fontSize: 10, color: C.muted }}>{gIds.length}</span>
                </button>
              ); })}
              {poolGroups.length === 0 && <p style={{ color: C.muted, fontSize: 12, padding: "6px 4px", margin: 0 }}>No groups</p>}
              {champTags.length > 0 && <div style={{ height: 1, background: C.border, margin: "4px 0" }} />}
              {champTags.map((tag) => { const gIds = athletes.filter((a) => a.champTag === tag).map((a) => a.id); const allOn = gIds.length > 0 && gIds.every((id) => selected.includes(id)); const someOn = gIds.some((id) => selected.includes(id)); return (
                <button key={tag} onClick={() => selectTag(tag)} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", background: allOn ? `${C.gold}22` : "transparent", border: `1px solid ${allOn || someOn ? C.gold : "transparent"}`, borderRadius: 7, padding: "6px 8px", cursor: "pointer", marginBottom: 3, fontFamily: "inherit" }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${allOn ? C.gold : someOn ? C.gold : C.muted}`, background: allOn ? C.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{allOn && <span style={{ color: C.bg, fontSize: 9, fontWeight: 900 }}>✓</span>}{someOn && !allOn && <span style={{ color: C.gold, fontSize: 11, lineHeight: 1 }}>–</span>}</div>
                  <span style={{ fontSize: 12, color: allOn ? C.gold : C.white, flex: 1, textAlign: "left" }}>🏆 {tag}</span>
                  <span style={{ fontSize: 10, color: C.muted }}>{gIds.length}</span>
                </button>
              ); })}
              {specialtyGroups.length > 0 && <div style={{ height: 1, background: C.border, margin: "4px 0", gridColumn: "1/-1" }} />}
              {specialtyGroups.map(([field, val, icon]) => { const gIds = athletes.filter((a) => a[field] === val).map((a) => a.id); const allOn = gIds.length > 0 && gIds.every((id) => selected.includes(id)); const someOn = gIds.some((id) => selected.includes(id)); return (
                <button key={field + val} onClick={() => selectByField(field, val)} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", background: allOn ? C.tealGlow : "transparent", border: `1px solid ${allOn || someOn ? C.teal : "transparent"}`, borderRadius: 7, padding: "6px 8px", cursor: "pointer", marginBottom: 3, fontFamily: "inherit" }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${allOn || someOn ? C.teal : C.muted}`, background: allOn ? C.teal : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{allOn && <span style={{ color: C.bg, fontSize: 9, fontWeight: 900 }}>✓</span>}{someOn && !allOn && <span style={{ color: C.teal, fontSize: 11, lineHeight: 1 }}>–</span>}</div>
                  <span style={{ fontSize: 12, color: allOn ? C.teal : C.white, flex: 1, textAlign: "left" }}>{icon} {val}</span>
                  <span style={{ fontSize: 10, color: C.muted }}>{gIds.length}</span>
                </button>
              ); })}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: isNarrow ? "100%" : 260, background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ padding: "6px 10px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", whiteSpace: "nowrap" }}>Athletes</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 6, color: C.white, padding: "3px 8px", fontSize: 12, fontFamily: "inherit", flex: 1 }} />
            </div>
            <div style={{ overflowY: "auto", maxHeight: 200, padding: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
              {filteredAthletes.map((a) => { const on = selected.includes(a.id); return (
                <button key={a.id} onClick={() => toggleAthlete(a.id)} style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, background: on ? C.tealGlow : "transparent", border: `1px solid ${on ? C.teal : "transparent"}`, borderRadius: 7, padding: "5px 8px", cursor: "pointer", fontFamily: "inherit" }}>
                  <div style={{ width: 13, height: 13, borderRadius: 3, border: `2px solid ${on ? C.teal : C.muted}`, background: on ? C.teal : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{on && <span style={{ color: C.bg, fontSize: 8, fontWeight: 900 }}>✓</span>}</div>
                  <span style={{ fontSize: 12, color: on ? C.teal : C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
                </button>
              ); })}
            </div>
          </div>
        </div>
        {movement.trim() && !isNaN(pctNum) && selected.length > 0 && (
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
            <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>Preview</p>
            {selected.map((id) => {
              const a = athletes.find((x) => x.id === id);
              if (!a) return null;
              const pv = previewFor(id, movement, pctNum);
              return (
                <p key={id} style={{ margin: "3px 0", fontSize: 13, color: pv ? C.white : C.muted }}>
                  {a.name}: {pv ? <span style={{ fontWeight: 700 }}>{pv.base} → <span style={{ color: C.teal }}>{pv.target}</span></span> : <span style={{ fontStyle: "italic" }}>no logged weight yet — bump applies once they log this movement with a weight</span>}
                </p>
              );
            })}
          </div>
        )}
        <Btn onClick={handleCreate} disabled={!canCreate || saving}>{saving ? "Creating…" : `Create bump${selected.length > 1 ? "s" : ""}`}</Btn>
      </div>

      <h3 style={{ fontSize: 12, color: C.muted, margin: "0 0 12px", letterSpacing: ".06em", textTransform: "uppercase" }}>Pending bumps</h3>
      {pending.length === 0 && <div style={{ textAlign: "center", padding: "36px 0", color: C.muted }}><p style={{ fontSize: 32, margin: "0 0 8px" }}>⬆</p><p style={{ margin: 0 }}>No pending bumps — create the first one above.</p></div>}
      {pending.map((rule) => {
        const a = athletes.find((x) => x.id === rule.athleteId);
        const pv = a ? previewFor(rule.athleteId, rule.exerciseName, rule.pct) : null;
        return (
          <div key={rule.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={a?.name || "?"} size={38} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, color: C.white, fontSize: 14 }}>{a?.name || "Archived athlete"} <span style={{ color: C.muted, fontWeight: 400 }}>·</span> {rule.exerciseName}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>{pv ? <>{pv.base} → <span style={{ color: C.teal, fontWeight: 700 }}>{pv.target}</span></> : "awaiting first logged weight"}</p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, background: `${C.gold}14`, border: `1px solid ${C.gold}33`, borderRadius: 20, padding: "3px 10px" }}>{rule.pct > 0 ? "+" : ""}{rule.pct}%</span>
            <button onClick={() => onDelete(rule.id)} title="Remove bump" style={{ background: "none", border: "none", color: C.red, fontSize: 20, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>×</button>
          </div>
        );
      })}
    </div>
  );
}

// ─── ASSESSMENT ENTRY MODAL ───────────────────────────────────────────────────
function AssessmentModal({ athletes, onSave, onClose }) {
  const isNarrow = useIsNarrow();
  const [athleteId, setAthleteId] = useState(athletes[0]?.id || "");
  const [date, setDate] = useState(today());
  const [movement, setMovement] = useState({});
  const [performance, setPerformance] = useState({});
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { total, pain, complete } = computeMovementScore(movement);
  const inp = { background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "8px 11px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", width: "100%" };
  const setCell = (k, v) => setMovement((m) => ({ ...m, [k]: v }));

  const ScoreButtons = ({ cellKey, options }) => (
    <div style={{ display: "flex", gap: 4 }}>
      {options.map((o) => { const on = movement[cellKey] === o; return (
        <button key={o} onClick={() => setCell(cellKey, on ? undefined : o)} style={{ width: 30, height: 28, borderRadius: 6, border: `1px solid ${on ? (o === 0 ? C.red : C.teal) : C.border}`, background: on ? (o === 0 ? `${C.red}22` : C.tealGlow) : "transparent", color: on ? (o === 0 ? C.red : C.teal) : C.mutedUp, fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{o}</button>
      ); })}
    </div>
  );

  const handleSave = async () => {
    if (!athleteId) return;
    setSaving(true);
    await onSave({ id: uid(), athleteId, date, movement, performance, notes, createdAt: Date.now() });
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 100, overflowY: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "calc(24px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom))" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 18, width: "100%", maxWidth: 620, padding: isNarrow ? 16 : 26, boxShadow: `0 0 60px ${C.tealGlow}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ margin: 0, color: C.white, fontSize: 19, fontWeight: 800 }}>Movement assessment</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 24, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 150px", gap: 12, marginBottom: 18 }}>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>ATHLETE</label>
            <select value={athleteId} onChange={(e) => setAthleteId(e.target.value)} style={inp}>{athletes.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>DATE</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inp} /></div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <label style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em" }}>Movement screens</label>
          <span style={{ fontSize: 13, fontWeight: 800, color: pain ? C.red : complete ? C.teal : C.muted }}>{total}/{ASSESSMENT_MAX}{pain ? " · pain" : ""}{!complete ? " · incomplete" : ""}</span>
        </div>
        {ASSESSMENT_MOVEMENTS.map((m) => (
          <div key={m.key} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ color: C.white, fontWeight: 700, fontSize: 13 }}>{m.label}</span>
              {m.bilateral ? (
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}><span style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>L</span><ScoreButtons cellKey={m.key + "L"} options={m.options} /></div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}><span style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>R</span><ScoreButtons cellKey={m.key + "R"} options={m.options} /></div>
                </div>
              ) : <ScoreButtons cellKey={m.key} options={m.options} />}
            </div>
            <p style={{ margin: "5px 0 0", fontSize: 11, color: C.muted }}>{m.guide}</p>
          </div>
        ))}

        <label style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em", display: "block", margin: "16px 0 8px" }}>Performance tests</label>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {PERFORMANCE_TESTS.map((t) => (
            <div key={t.key} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ flex: 1, color: C.white, fontSize: 13 }}>{t.label}</span>
              <input value={performance[t.key] || ""} onChange={(e) => setPerformance((p) => ({ ...p, [t.key]: e.target.value }))} placeholder={t.unit} style={{ ...inp, width: 82, padding: "5px 8px", fontSize: 13, textAlign: "center" }} />
            </div>
          ))}
        </div>

        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes — what stood out, follow-ups…" rows={2} style={{ ...inp, resize: "vertical", marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={saving || !athleteId} style={{ flex: 1 }}>{saving ? "Saving…" : "Save assessment"}</Btn>
        </div>
      </div>
    </div>
  );
}

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

// ─── SWIMMER PROFILE MODAL ────────────────────────────────────────────────────
function SwimmerProfileModal({ athlete, onSave, onClose }) {
  const [school, setSchool] = useState(athlete.school || "");
  const [grade, setGrade] = useState(athlete.grade || "");
  const [stroke, setStroke] = useState(athlete.stroke || "");
  const [distance, setDistance] = useState(athlete.distance || "");
  const [saving, setSaving] = useState(false);
  const GRADES = ["6th","7th","8th","9th","10th","11th","12th"];
  const inp = { background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", width: "100%" };
  const handleSave = async () => { setSaving(true); await onSave({ ...athlete, school, grade, stroke, distance }); setSaving(false); onClose(); };
  const chipRow = (label, options, value, setValue) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 8 }}>{label}</label>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {options.map((o) => <button key={o} onClick={() => setValue(value === o ? "" : o)} style={{ border: `1px solid ${value === o ? C.teal : C.border}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: value === o ? C.tealGlow : "transparent", color: value === o ? C.teal : C.mutedUp }}>{o}</button>)}
      </div>
    </div>
  );
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.82)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 18, width: "100%", maxWidth: 380, padding: 26, boxShadow: `0 0 60px ${C.tealGlow}`, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: C.white, fontSize: 18, fontWeight: 800 }}>Your profile</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 24, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>SCHOOL</label>
          <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g. Farmington High School" style={inp} />
        </div>
        {chipRow("GRADE", GRADES, grade, setGrade)}
        {chipRow("MAIN STROKE", STROKES, stroke, setStroke)}
        {chipRow("DISTANCE", DISTANCES, distance, setDistance)}
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={saving} style={{ flex: 1 }}>{saving ? "Saving…" : "Save profile"}</Btn>
        </div>
      </div>
    </div>
  );
}

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

// ─── COACH APP ────────────────────────────────────────────────────────────────
function CoachApp({ athletes, workouts, logs, testScores, progressions, assessments, onSaveAssessment, onDeleteAssessment, onSaveProgressions, onDeleteProgression, onSaveWorkout, onDeleteWorkout, onUpdateAthlete, onDeleteAthlete, onAddAthlete, onSaveTestScore, onLogout }) {
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
  const poolGroups = [...new Set(athletes.map((a) => a.event).filter(Boolean))];
  const schools = [...new Set(athletes.filter((a) => !a.archived).map((a) => a.school).filter(Boolean))].sort();
  const champTags = ["Regional", "State"].filter((tag) => athletes.some((a) => a.champTag === tag && !a.archived));

  const activeAthletes = athletes.filter((a) => !a.archived);
  const rosterSpecialties = [...STROKES.map((s) => ["stroke", s, "🏊"]), ...DISTANCES.map((d) => ["distance", d, "⏱"])].filter(([f, v]) => activeAthletes.some((a) => a[f] === v));
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
              {["workouts","roster","logs","bumps","Assessments","progress"].map((t) => <button key={t} onClick={() => { setTab(t); setSelectedAthlete(null); }} style={{ border: "none", borderRadius: 26, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: tab === t ? C.teal : "transparent", color: tab === t ? C.bg : C.muted, transition: "all .15s", textTransform: "capitalize", whiteSpace: "nowrap", flexShrink: 0 }}>{t}</button>)}
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
            {workouts.length === 0 && <div style={{ textAlign: "center", padding: "56px 0", color: C.muted }}><p style={{ fontSize: 40, margin: "0 0 10px" }}>🏋️</p><p style={{ margin: 0 }}>No workouts yet.</p></div>}
            {[...workouts].sort((a, b) => b.date.localeCompare(a.date)).map((wkt) => {
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
              <button onClick={() => setRosterFilter("All")} style={{ border: `1px solid ${rosterFilter === "All" ? C.teal : C.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: rosterFilter === "All" ? C.tealGlow : "transparent", color: rosterFilter === "All" ? C.teal : C.mutedUp }}>All ({activeAthletes.length})</button>
              {poolGroups.map((g) => <button key={g} onClick={() => setRosterFilter(g)} style={{ border: `1px solid ${rosterFilter === g ? C.teal : C.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: rosterFilter === g ? C.tealGlow : "transparent", color: rosterFilter === g ? C.teal : C.mutedUp }}>{g} ({activeAthletes.filter((a) => a.event === g).length})</button>)}
              {schools.length > 0 && <div style={{ width: 1, background: C.border, margin: "0 3px" }} />}
              {schools.map((s) => <button key={s} onClick={() => setRosterFilter(s)} style={{ border: `1px solid ${rosterFilter === s ? C.teal : C.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: rosterFilter === s ? C.tealGlow : "transparent", color: rosterFilter === s ? C.teal : C.mutedUp }}>{s.replace(" High School","").replace(" Middle School","")} ({activeAthletes.filter((a) => a.school === s).length})</button>)}
              {champTags.length > 0 && <div style={{ width: 1, background: C.border, margin: "0 3px" }} />}
              {champTags.map((tag) => <button key={tag} onClick={() => setRosterFilter(tag)} style={{ border: `1px solid ${rosterFilter === tag ? C.gold : C.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: rosterFilter === tag ? `${C.gold}22` : "transparent", color: rosterFilter === tag ? C.gold : C.mutedUp }}>🏆 {tag} ({activeAthletes.filter((a) => a.champTag === tag).length})</button>)}
              {rosterSpecialties.length > 0 && <div style={{ width: 1, background: C.border, margin: "0 3px" }} />}
              {rosterSpecialties.map(([field, val, icon]) => <button key={field + val} onClick={() => setRosterFilter(val)} style={{ border: `1px solid ${rosterFilter === val ? C.teal : C.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: rosterFilter === val ? C.tealGlow : "transparent", color: rosterFilter === val ? C.teal : C.mutedUp }}>{icon} {val} ({activeAthletes.filter((a) => a[field] === val).length})</button>)}
            </div>
            {filteredAthletes.length === 0 && <p style={{ color: C.muted, textAlign: "center", padding: "32px 0" }}>No athletes match this filter.</p>}
            {filteredAthletes.map((a) => {
              const aWkts = workouts.filter((w) => w.assignees?.includes(a.id));
              const aLogs = logs.filter((l) => l.athleteId === a.id);
              return (
                <div key={a.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
                  <div onClick={() => setSelectedAthlete(a)} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, cursor: "pointer" }}>
                    <Avatar name={a.name} size={42} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                        <p style={{ margin: 0, fontWeight: 700, color: C.white, fontSize: 14 }}>{a.name}</p>
                        {a.champTag && <span style={{ fontSize: 10, fontWeight: 700, color: C.gold, background: `${C.gold}1A`, border: `1px solid ${C.gold}44`, borderRadius: 10, padding: "1px 6px" }}>🏆 {a.champTag}</span>}
                        {a.grade && <span style={{ fontSize: 10, color: C.mutedUp, background: C.surfaceUp, borderRadius: 10, padding: "1px 6px" }}>{a.grade}</span>}
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

      {showBuilder && <BuilderModal athletes={athletes} onSave={async (wkt) => { await onSaveWorkout(wkt); setShowBuilder(false); setEditWkt(null); }} onClose={() => { setShowBuilder(false); setEditWkt(null); }} editWkt={editWkt} />}
      {editAthlete && <EditAthleteModal athlete={editAthlete} onSave={async (updated) => { await onUpdateAthlete(updated); setEditAthlete(null); if (selectedAthlete?.id === updated.id) setSelectedAthlete(updated); }} onArchive={async () => { await onUpdateAthlete({ ...editAthlete, archived: true }); setEditAthlete(null); if (selectedAthlete?.id === editAthlete.id) setSelectedAthlete(null); }} onUnarchive={async () => { await onUpdateAthlete({ ...editAthlete, archived: false }); setEditAthlete(null); }} onDelete={async () => { await onDeleteAthlete(editAthlete.id); setEditAthlete(null); if (selectedAthlete?.id === editAthlete.id) setSelectedAthlete(null); }} onClose={() => setEditAthlete(null)} />}
      {sessionDetail && <SessionDetailModal log={sessionDetail.log} workout={sessionDetail.workout} athlete={sessionDetail.athlete} onClose={() => setSessionDetail(null)} />}
      {showTestEntry && <TestScoreModal athletes={athletes} onSave={async (score) => { await onSaveTestScore(score); setShowTestEntry(false); }} onClose={() => setShowTestEntry(false)} />}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [athletes, setAthletes] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [testScores, setTestScores] = useState([]);
  const [progressions, setProgressions] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      const [{ data: ath }, { data: wkts }, { data: lg }, { data: ts }, { data: prog }, { data: assess }] = await Promise.all([
        supabase.from("athletes").select("*"),
        supabase.from("workouts").select("*"),
        supabase.from("logs").select("*"),
        supabase.from("test_scores").select("*"),
        supabase.from("progressions").select("*"),
        supabase.from("assessments").select("*"),
      ]);
      setAthletes(ath || []);
      setWorkouts((wkts || []).map((w) => ({ ...w, blocks: typeof w.blocks === "string" ? JSON.parse(w.blocks) : w.blocks, assignees: typeof w.assignees === "string" ? JSON.parse(w.assignees) : w.assignees })));
      setLogs((lg || []).map((l) => ({ ...l, sets: typeof l.sets === "string" ? JSON.parse(l.sets) : l.sets, blockNotes: typeof l.blockNotes === "string" && l.blockNotes ? JSON.parse(l.blockNotes) : l.blockNotes })));
      setTestScores(ts || []);
      setProgressions(prog || []);
      setAssessments((assess || []).map((a) => ({ ...a, movement: typeof a.movement === "string" ? JSON.parse(a.movement) : a.movement, performance: typeof a.performance === "string" && a.performance ? JSON.parse(a.performance) : a.performance })));
      setLoading(false);
    }
    fetchAll();
  }, []);

  const saveWorkout = useCallback(async (wkt) => {
    const payload = { ...wkt, blocks: JSON.stringify(wkt.blocks), assignees: JSON.stringify(wkt.assignees) };
    const exists = workouts.find((w) => w.id === wkt.id);
    if (exists) { await supabase.from("workouts").update(payload).eq("id", wkt.id); setWorkouts((ws) => ws.map((w) => w.id === wkt.id ? wkt : w)); }
    else { await supabase.from("workouts").insert(payload); setWorkouts((ws) => [...ws, wkt]); }
  }, [workouts]);

  const deleteWorkout = useCallback(async (id) => {
    await supabase.from("workouts").delete().eq("id", id);
    setWorkouts((ws) => ws.filter((w) => w.id !== id));
  }, []);

  const saveLog = useCallback(async (log) => {
    const payload = {
      ...log,
      sets: JSON.stringify(log.sets),
      blockNotes: log.blockNotes ? JSON.stringify(log.blockNotes) : null,
      loggedAt: Date.now(),
    };
    const exists = logs.find((l) => l.athleteId === log.athleteId && l.workoutId === log.workoutId);
    let error;
    if (exists) {
      // Use the row's primary key id to avoid quoted column name issues in the WHERE clause
      const { error: updateError } = await supabase.from("logs").update(payload).eq("id", exists.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from("logs").insert(payload);
      error = insertError;
    }
    if (error) {
      console.error("Log save error:", error);
      alert("Session failed to save: " + error.message);
      return false;
    }
    const { data } = await supabase.from("logs").select("*");
    setLogs((data || []).map((l) => ({ ...l, sets: typeof l.sets === "string" ? JSON.parse(l.sets) : l.sets, blockNotes: typeof l.blockNotes === "string" ? JSON.parse(l.blockNotes) : l.blockNotes })));
    return true;
  }, [logs]);

  const saveTestScore = useCallback(async (score) => {
    await supabase.from("test_scores").insert(score);
    setTestScores((ts) => [...ts, score]);
  }, []);

  const saveProgressions = useCallback(async (rules) => {
    // One pending rule per (athlete, movement): a new rule replaces any old one.
    const key = (p) => p.athleteId + "|" + p.exerciseName.toLowerCase().trim();
    const newKeys = new Set(rules.map(key));
    const staleIds = progressions.filter((p) => newKeys.has(key(p))).map((p) => p.id);
    if (staleIds.length) await supabase.from("progressions").delete().in("id", staleIds);
    await supabase.from("progressions").insert(rules);
    setProgressions((ps) => [...ps.filter((p) => !staleIds.includes(p.id)), ...rules]);
  }, [progressions]);

  const deleteProgressions = useCallback(async (ids) => {
    if (!ids.length) return;
    await supabase.from("progressions").delete().in("id", ids);
    setProgressions((ps) => ps.filter((p) => !ids.includes(p.id)));
  }, []);

  const saveAssessment = useCallback(async (assessment) => {
    const payload = { ...assessment, movement: JSON.stringify(assessment.movement), performance: JSON.stringify(assessment.performance) };
    await supabase.from("assessments").insert(payload);
    setAssessments((as) => [...as, assessment]);
  }, []);

  const deleteAssessment = useCallback(async (id) => {
    await supabase.from("assessments").delete().eq("id", id);
    setAssessments((as) => as.filter((a) => a.id !== id));
  }, []);

  const addAthlete = useCallback(async (athlete) => {
    await supabase.from("athletes").insert(athlete);
    setAthletes((as) => [...as, athlete]);
  }, []);

  const updateAthlete = useCallback(async (athlete) => {
    await supabase.from("athletes").update(athlete).eq("id", athlete.id);
    setAthletes((as) => as.map((a) => a.id === athlete.id ? athlete : a));
  }, []);

  const deleteAthlete = useCallback(async (id) => {
    await supabase.from("athletes").delete().eq("id", id);
    setAthletes((as) => as.filter((a) => a.id !== id));
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: C.teal, display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.bg} strokeWidth="2.5" strokeLinecap="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg></div>
      <p style={{ color: C.muted, fontSize: 14, margin: 0, fontFamily: "system-ui" }}>Loading Riptide Strength…</p>
    </div>
  );

  if (!session) return <LoginScreen athletes={athletes} onLogin={(a) => setSession({ role: "athlete", athlete: a })} onCoachLogin={() => setSession({ role: "coach" })} />;
  if (session.role === "coach") return <CoachApp athletes={athletes} workouts={workouts} logs={logs} testScores={testScores} progressions={progressions} assessments={assessments} onSaveAssessment={saveAssessment} onDeleteAssessment={deleteAssessment} onSaveProgressions={saveProgressions} onDeleteProgression={(id) => deleteProgressions([id])} onSaveWorkout={saveWorkout} onDeleteWorkout={deleteWorkout} onUpdateAthlete={updateAthlete} onDeleteAthlete={deleteAthlete} onAddAthlete={addAthlete} onSaveTestScore={saveTestScore} onLogout={() => setSession(null)} />;
  return <AthleteApp athlete={session.athlete} workouts={workouts} logs={logs} testScores={testScores} progressions={progressions} onConsumeProgressions={deleteProgressions} onLog={saveLog} onUpdateAthlete={updateAthlete} onLogout={() => setSession(null)} />;
}
