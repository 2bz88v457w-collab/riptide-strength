import { computeMovementProgress } from './helpers';

// Two seasons of Back Squat plus a bodyweight movement, so both metrics are covered.
const wkt = (id, date, season, exercises) => ({
  id, date, season, title: id, assignees: ['a1', 'a2'],
  blocks: [{ id: id + 'b', name: 'Block 1', exercises }],
});
const WORKOUTS = [
  wkt('w1', '2026-06-01', '2026 Long Course', [{ id: 'e1', name: 'Back Squat' }]),
  wkt('w2', '2026-09-14', '26-27 Short Course', [{ id: 'e2', name: 'Back Squat' }, { id: 'e3', name: 'Pull-up' }]),
  wkt('w3', '2026-09-21', '26-27 Short Course', [{ id: 'e4', name: 'back squat' }, { id: 'e5', name: 'Pull-up' }]),
  wkt('w4', '2026-09-28', '26-27 Short Course', [{ id: 'e6', name: 'Back Squat' }]),
];
const LOGS = [
  { athleteId: 'a1', workoutId: 'w1', sets: { e1: [{ load: '155' }] } },              // last season
  { athleteId: 'a1', workoutId: 'w2', sets: { e2: [{ load: '95' }, { load: '105' }], e3: [{ reps: '4' }] } },
  { athleteId: 'a1', workoutId: 'w3', sets: { e4: [{ load: '115' }], e5: [{ reps: '6' }] } },
  { athleteId: 'a1', workoutId: 'w4', sets: { e6: [{ load: '110' }] } },              // best is not the latest
  { athleteId: 'a2', workoutId: 'w2', sets: { e2: [{ load: '65' }] } },               // one session only
];
const ATHLETES = [{ id: 'a1', name: 'Ann', event: '8 Lane' }, { id: 'a2', name: 'Ben', event: '6 Lane' }];

const find = (out, movement) => out.find((m) => m.movement.toLowerCase() === movement.toLowerCase());
const rowFor = (out, movement, name) => find(out, movement).rows.find((r) => r.athlete.name === name);

test('the first logged number is the baseline and the best is the current mark', () => {
  const ann = rowFor(computeMovementProgress(ATHLETES, WORKOUTS, LOGS, { season: '26-27 Short Course' }), 'Back Squat', 'Ann');
  expect(ann.first).toMatchObject({ value: 105, date: '2026-09-14' });  // heaviest set of the first session
  expect(ann.best).toMatchObject({ value: 115, date: '2026-09-21' });
  expect(ann.latest).toMatchObject({ value: 110, date: '2026-09-28' }); // best ≠ latest
  expect(ann.sessions).toBe(3);
  expect(ann.delta).toBe(10);
  expect(ann.pct).toBeCloseTo(9.52);
});

test('season scoping keeps short course from measuring against long-course numbers', () => {
  const scoped = rowFor(computeMovementProgress(ATHLETES, WORKOUTS, LOGS, { season: '26-27 Short Course' }), 'Back Squat', 'Ann');
  expect(scoped.first.value).toBe(105);

  // Unscoped, last season's 155 becomes the baseline and nothing since has beaten it.
  const all = rowFor(computeMovementProgress(ATHLETES, WORKOUTS, LOGS), 'Back Squat', 'Ann');
  expect(all.first).toMatchObject({ value: 155, date: '2026-06-01' });
  expect(all.best.value).toBe(155);
  expect(all.delta).toBe(0);
  expect(all.sessions).toBe(4);
});

test('a single logged session is a baseline, not a gain', () => {
  const ben = rowFor(computeMovementProgress(ATHLETES, WORKOUTS, LOGS, { season: '26-27 Short Course' }), 'Back Squat', 'Ben');
  expect(ben).toMatchObject({ sessions: 1, delta: 0 });
  expect(ben.first.value).toBe(65);
  expect(ben.best.value).toBe(65);
});

test('bodyweight movements fall back to reps — what the old test day measured', () => {
  const out = computeMovementProgress(ATHLETES, WORKOUTS, LOGS, { season: '26-27 Short Course' });
  expect(find(out, 'Back Squat').metric).toBe('load');
  const pullup = find(out, 'Pull-up');
  expect(pullup.metric).toBe('reps');
  expect(rowFor(out, 'Pull-up', 'Ann')).toMatchObject({ delta: 2, sessions: 2 });
});

test('movement names match case-insensitively but display as first written', () => {
  const out = computeMovementProgress(ATHLETES, WORKOUTS, LOGS, { season: '26-27 Short Course' });
  expect(out.map((m) => m.movement)).toEqual(['Back Squat', 'Pull-up']);  // "back squat" folded in
});

test('movements sort by how many athletes have logged them, rows by gain', () => {
  const out = computeMovementProgress(ATHLETES, WORKOUTS, LOGS, { season: '26-27 Short Course' });
  expect(out[0].movement).toBe('Back Squat');            // 2 athletes vs 1
  expect(out[0].rows.map((r) => r.athlete.name)).toEqual(['Ann', 'Ben']);  // +10 above +0
});

test('blank, non-numeric, and zero loads are not baselines', () => {
  const logs = [
    { athleteId: 'a1', workoutId: 'w2', sets: { e2: [{ load: 'BW' }, { load: '' }, { load: '0' }] } },
    { athleteId: 'a1', workoutId: 'w3', sets: { e4: [{ load: '95 lbs' }] } },
  ];
  const out = computeMovementProgress(ATHLETES, WORKOUTS, logs, { season: '26-27 Short Course' });
  const ann = rowFor(out, 'Back Squat', 'Ann');
  expect(ann.sessions).toBe(1);                          // only the session with a real number
  expect(ann.first.value).toBe(95);                      // units stripped
});

test('the same movement twice in one session counts once, at its best', () => {
  const twice = [wkt('w9', '2026-09-14', '26-27 Short Course', [{ id: 'x1', name: 'Back Squat' }, { id: 'x2', name: 'Back Squat' }])];
  const logs = [{ athleteId: 'a1', workoutId: 'w9', sets: { x1: [{ load: '95' }], x2: [{ load: '135' }] } }];
  const ann = rowFor(computeMovementProgress(ATHLETES, twice, logs), 'Back Squat', 'Ann');
  expect(ann).toMatchObject({ sessions: 1, delta: 0 });
  expect(ann.best.value).toBe(135);
});

test('a date range narrows the window the same way attendance does', () => {
  const out = computeMovementProgress(ATHLETES, WORKOUTS, LOGS, { from: '2026-09-21' });
  const ann = rowFor(out, 'Back Squat', 'Ann');
  expect(ann.sessions).toBe(2);
  expect(ann.first).toMatchObject({ value: 115, date: '2026-09-21' });
});

test('logs from athletes no longer on the roster are ignored', () => {
  const logs = [...LOGS, { athleteId: 'gone', workoutId: 'w2', sets: { e2: [{ load: '500' }] } }];
  const out = computeMovementProgress(ATHLETES, WORKOUTS, logs, { season: '26-27 Short Course' });
  expect(find(out, 'Back Squat').rows.map((r) => r.athlete.name).sort()).toEqual(['Ann', 'Ben']);
});

test('no usable logs yields nothing rather than empty rows', () => {
  expect(computeMovementProgress(ATHLETES, WORKOUTS, [])).toEqual([]);
  expect(computeMovementProgress(ATHLETES, WORKOUTS, LOGS, { season: '2027 Nothing Yet' })).toEqual([]);
});
