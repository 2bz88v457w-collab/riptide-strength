import { computeAttention, sessionRpe } from './helpers';

const TODAY = new Date('2026-09-30T12:00:00');
const day = (n) => new Date(TODAY.getTime() - n * 86400000).toISOString().slice(0, 10); // n days ago
const ATHLETES = [{ id: 'a1', name: 'Ann' }, { id: 'a2', name: 'Ben' }, { id: 'a3', name: 'Cara' }];
const run = (workouts, logs, athletes = ATHLETES) => computeAttention(athletes, workouts, logs, { today: TODAY });
const flagKinds = (rows, name) => (rows.find((r) => r.athlete.name === name)?.flags ?? []).map((f) => f.kind);

describe('quiet flag', () => {
  test('fires only when assigned sessions went unlogged', () => {
    const workouts = [
      { id: 'w1', date: day(3), assignees: ['a1', 'a2'] },
      { id: 'w2', date: day(5), assignees: ['a1', 'a2'] },
    ];
    const logs = [{ athleteId: 'a2', workoutId: 'w1' }, { athleteId: 'a2', workoutId: 'w2' }];
    const rows = run(workouts, logs);
    expect(flagKinds(rows, 'Ann')).toEqual(['quiet']);   // assigned twice, logged neither
    expect(flagKinds(rows, 'Ben')).toEqual([]);          // logged both
    expect(flagKinds(rows, 'Cara')).toEqual([]);         // nothing assigned — silent, not flagged
  });

  test('stays silent in an off-season gap when nothing was assigned', () => {
    const workouts = [{ id: 'w1', date: day(40), assignees: ['a1', 'a2', 'a3'] }];
    expect(run(workouts, [])).toEqual([]);               // old work, none inside the window
  });

  test('does not fire while the athlete is still logging recently', () => {
    const workouts = [
      { id: 'w1', date: day(2), assignees: ['a1'] },
      { id: 'w2', date: day(6), assignees: ['a1'] },
    ];
    const logs = [{ athleteId: 'a1', workoutId: 'w1' }]; // missed w2 but logged 2 days ago
    expect(flagKinds(run(workouts, logs), 'Ann')).toEqual([]);
  });

  test('severity rises with the number of missed sessions', () => {
    const many = [1, 2, 3, 4].map((n) => ({ id: 'w' + n, date: day(n), assignees: ['a1'] }));
    const one = [{ id: 'x1', date: day(1), assignees: ['a2'] }];
    const rows = run([...many, ...one], []);
    expect(rows[0].athlete.name).toBe('Ann');            // 4 missed sorts above 1 missed
    expect(rows[0].severity).toBeGreaterThan(rows[1].severity);
  });
});

describe('RPE trend flags', () => {
  // Six sessions, all assigned and logged, so the quiet flag stays out of the way.
  const build = (rpes) => {
    const workouts = rpes.map((_, i) => ({ id: 'w' + i, date: day(rpes.length - i), assignees: ['a1'] }));
    const logs = rpes.map((rpe, i) => ({ athleteId: 'a1', workoutId: 'w' + i, rpe }));
    return run(workouts, logs, [ATHLETES[0]]);
  };

  test('ramping RPE flags a climb into hard territory', () => {
    expect(flagKinds(build([5, 5, 6, 8, 8, 9]), 'Ann')).toContain('ramp');
  });

  test('a climb that stays easy is not overreach', () => {
    expect(flagKinds(build([2, 2, 2, 4, 4, 5]), 'Ann')).not.toContain('ramp');
  });

  test('steady hard work is not flagged as ramping', () => {
    expect(flagKinds(build([8, 8, 8, 8, 8, 8]), 'Ann')).not.toContain('ramp');
  });

  test('flat and low flags a possibly under-challenged athlete', () => {
    expect(flagKinds(build([4, 4, 5, 4, 5, 4]), 'Ann')).toContain('flat');
  });

  test('sparse RPE data is never judged', () => {
    expect(flagKinds(build([9, 3, 9]), 'Ann')).toEqual([]);          // 3 sessions < minimum of 4
    const rows = build([9, 3, 9]);
    expect(rows.length).toBe(0);
  });

  test('blank RPE boxes are not treated as zeros', () => {
    expect(sessionRpe({ rpe: '' })).toBeNull();
    expect(sessionRpe({ rpe: null })).toBeNull();
    expect(sessionRpe({})).toBeNull();
    expect(sessionRpe({ rpe: '7' })).toBe(7);
    // four logs but only two with RPE — not enough to judge
    expect(flagKinds(build(['', 8, '', 9]), 'Ann')).toEqual([]);
  });
});

test('athletes needing nothing are left out entirely', () => {
  const workouts = [{ id: 'w1', date: day(2), assignees: ['a1'] }];
  expect(run(workouts, [{ athleteId: 'a1', workoutId: 'w1' }])).toEqual([]);
});
