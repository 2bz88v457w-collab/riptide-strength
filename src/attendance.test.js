import { computeSessions, attendanceByAthlete } from './helpers';

// Two workouts share Aug 3 (e.g. a team session and a clinic session).
const WORKOUTS = [
  { id: 'w1', title: 'Team Dryland', date: '2026-08-03', season: '2026 Long Course', assignees: ['a1', 'a2'] },
  { id: 'w2', title: 'Clinic Day 1', date: '2026-08-03', season: '2026 Clinic', assignees: ['a3'] },
  { id: 'w3', title: 'Clinic Day 2', date: '2026-08-05', season: '2026 Clinic', assignees: ['a1', 'a3'] },
];
const LOGS = [
  { athleteId: 'a1', workoutId: 'w1' },   // present Aug 3
  { athleteId: 'a3', workoutId: 'w2' },   // present Aug 3 (clinic)
  { athleteId: 'a3', workoutId: 'w3' },   // present Aug 5
  // a2 never logged; a1 skipped Aug 5
];
const ATHLETES = [{ id: 'a1', name: 'Ann' }, { id: 'a2', name: 'Ben' }, { id: 'a3', name: 'Cara' }];

test('sessions group by date, newest first, merging same-day workouts', () => {
  const s = computeSessions(WORKOUTS, LOGS);
  expect(s.map((x) => x.date)).toEqual(['2026-08-05', '2026-08-03']);
  const aug3 = s.find((x) => x.date === '2026-08-03');
  expect([...aug3.assigned].sort()).toEqual(['a1', 'a2', 'a3']);   // union across both workouts
  expect([...aug3.present].sort()).toEqual(['a1', 'a3']);
});

test('season filter scopes sessions without touching the rest', () => {
  const clinic = computeSessions(WORKOUTS, LOGS, { season: '2026 Clinic' });
  expect(clinic.map((x) => x.date)).toEqual(['2026-08-05', '2026-08-03']);
  expect([...clinic.find((x) => x.date === '2026-08-03').assigned]).toEqual(['a3']); // team workout excluded
  const team = computeSessions(WORKOUTS, LOGS, { season: '2026 Long Course' });
  expect(team).toHaveLength(1);
  expect([...team[0].assigned].sort()).toEqual(['a1', 'a2']);
});

test('a log only counts when the athlete was actually assigned that day', () => {
  const strayLog = [...LOGS, { athleteId: 'a2', workoutId: 'w3' }]; // a2 isn't assigned to w3
  const aug5 = computeSessions(WORKOUTS, strayLog).find((x) => x.date === '2026-08-05');
  expect([...aug5.present].sort()).toEqual(['a3']);
});

test('per-athlete rollup counts attended over assigned and lists misses', () => {
  const rows = attendanceByAthlete(computeSessions(WORKOUTS, LOGS), ATHLETES);
  const byName = Object.fromEntries(rows.map((r) => [r.athlete.name, r]));
  expect(byName.Ann).toMatchObject({ assigned: 2, attended: 1, missedDates: ['2026-08-05'] });
  expect(byName.Ann.rate).toBeCloseTo(0.5);
  expect(byName.Ben).toMatchObject({ assigned: 1, attended: 0, rate: 0 });
  expect(byName.Cara).toMatchObject({ assigned: 2, attended: 2, rate: 1 });
});

test('athletes with no assigned sessions are left out of the rollup', () => {
  const rows = attendanceByAthlete(computeSessions(WORKOUTS, LOGS), [...ATHLETES, { id: 'a9', name: 'Newcomer' }]);
  expect(rows.map((r) => r.athlete.name)).not.toContain('Newcomer');
});
