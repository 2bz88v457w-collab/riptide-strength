const C = {
  bg: "#050E1C", surface: "#0C1E38", surfaceUp: "#122A4C",
  border: "rgba(46,155,255,0.14)", borderBright: "rgba(46,155,255,0.40)",
  teal: "#2E9BFF", tealGlow: "rgba(46,155,255,0.16)",
  gold: "#C8E64C", red: "#FF5A5A",
  white: "#F0F6FC", muted: "#5D7BA0", mutedUp: "#7E9CC2",
};

// Cycled by index, so workouts can have any number of blocks.
const BLOCK_COLORS = [C.teal, C.gold, "#A78BFA", C.red, C.mutedUp];
const blockColor = (i) => BLOCK_COLORS[i % BLOCK_COLORS.length];
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
    "Pullover + DB", "Push Pull + Cable", "Quadruped Opposite", "Quadruped Med Ball Twist", "Renegade Row + DB",
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
    "Quadruped Opposite", "Quads + Foam Roll", "Quick Feet", "Quick Feet with Slow Arms", "Rear-Foot-Elevated Squat",
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

export { ASSESSMENT_MAX, ASSESSMENT_MOVEMENTS, BLOCKS, BLOCK_COLORS, blockColor, C, DISTANCES, EXERCISE_BANK, EXERCISE_CATEGORIES, EXERCISE_TYPES, PERFORMANCE_TESTS, REQUIRED_MOVE_TYPES, STROKES, TEST_METRICS };
