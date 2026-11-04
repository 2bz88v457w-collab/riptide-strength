import { computeEntryFlags, suspectSetEntry } from './helpers';

const ATHLETES = [
  { id: 'a1', name: 'Ann Adams', event: '8 Lane' },
  { id: 'a2', name: 'Ben Brown', event: '8 Lane' },
  { id: 'a3', name: 'Cara Cole', event: '7 Lane' },   // brand new, no history
];
const wkt = (id, date, season, exercises) => ({ id, date, season, title: id, blocks: [{ id: id + 'b', name: 'Block 1', exercises }] });
const WORKOUTS = [
  wkt('w1', '2026-10-26', '26-27 Short Course', [{ id: 'e1', name: 'Farmer Carry' }, { id: 'e2', name: 'Back Squat' }]),
  wkt('w2', '2026-11-02', '26-27 Short Course', [{ id: 'e3', name: 'Farmer Carry' }, { id: 'e4', name: 'Back Squat' }]),
];
const LOGS = [
  // Week 1: everyone sensible.
  { id: 1, athleteId: 'a1', workoutId: 'w1', sets: { e1: [{ reps: '20', load: '40' }], e2: [{ reps: '5', load: '95' }] } },
  { id: 2, athleteId: 'a2', workoutId: 'w1', sets: { e1: [{ reps: '20', load: '50' }] } },
  // Week 2: the farmer carry typo, and a squat that just looks strong.
  { id: 3, athleteId: 'a1', workoutId: 'w2', sets: { e3: [{ reps: '20', load: '10000' }], e4: [{ reps: '5', load: '105' }] } },
  { id: 4, athleteId: 'a2', workoutId: 'w2', sets: { e3: [{ reps: '20', load: '150' }] } },            // 3× their 50
  { id: 5, athleteId: 'a3', workoutId: 'w2', sets: { e3: [{ reps: '20', load: '200' }] } },            // no history; squad best is 50
];
const run = (checks = [], opts) => computeEntryFlags(ATHLETES, WORKOUTS, LOGS, checks, opts);
const flagFor = (name) => run().filter((f) => f.athlete.name === name);

describe('spotting mistyped entries', () => {
  test('the 10,000 lb farmer carry is caught by the ceiling, and leads the list', () => {
    const flags = run();
    expect(flags[0]).toMatchObject({ reason: 'ceiling', value: 10000, movement: 'Farmer Carry' });
    expect(flags[0].athlete.name).toBe('Ann Adams');
    expect(flags[0].detail).toMatch(/over 400/);
  });

  test('an in-range number far above their own best is caught too', () => {
    const ben = flagFor('Ben Brown');
    expect(ben).toHaveLength(1);
    expect(ben[0]).toMatchObject({ reason: 'jump', value: 150, ownBest: 50 });
    expect(ben[0].detail).toMatch(/their best before this was 50/);
  });

  test('a swimmer with no history is judged against the squad', () => {
    const cara = flagFor('Cara Cole');
    expect(cara[0]).toMatchObject({ reason: 'squad', value: 200 });
    expect(cara[0].detail).toMatch(/a typical best for this movement is/);
  });

  test('one swimmer\'s typo does not become the yardstick that hides the rest', () => {
    // Ann's 10,000 is in the data; Cara's 200 must still be flagged.
    expect(flagFor('Cara Cole')).toHaveLength(1);
    expect(flagFor('Cara Cole')[0].squadBest).toBeLessThanOrEqual(400);
  });

  test('normal progress is not flagged', () => {
    expect(flagFor('Ann Adams').some((f) => f.movement === 'Back Squat')).toBe(false);   // 95 → 105
  });

  test('impossible reps and RPE are caught', () => {
    const logs = [{ id: 9, athleteId: 'a1', workoutId: 'w2', sets: { e3: [{ reps: '500', load: '40' }], e4: [{ reps: '5', load: '95', rpe: '77' }] } }];
    const flags = computeEntryFlags(ATHLETES, WORKOUTS, logs);
    expect(flags.map((f) => f.reason).sort()).toEqual(['reps', 'rpe']);
  });

  test('one flag per exercise per session, at its worst value', () => {
    const logs = [{ id: 9, athleteId: 'a1', workoutId: 'w2', sets: { e3: [{ reps: '20', load: '900' }, { reps: '20', load: '10000' }] } }];
    const flags = computeEntryFlags(ATHLETES, WORKOUTS, logs);
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({ value: 10000, setIndex: 1 });
  });

  test('"looks right" stops the flag, until the number changes', () => {
    const key = 'entry:3:e3';
    const dismissed = run([{ athlete_id: 'a1', kind: key, state: '10000' }]);
    expect(dismissed.find((f) => f.checkKind === key).dismissed).toBe(true);
    // Edited to something else, still suspect → flagged again.
    const stale = run([{ athlete_id: 'a1', kind: key, state: '9000' }]);
    expect(stale.find((f) => f.checkKind === key).dismissed).toBe(false);
  });

  test('filters narrow what is flagged, but history still informs the check', () => {
    const weekTwoOnly = run([], { scopeWorkoutIds: new Set(['w2']) });
    expect(weekTwoOnly.every((f) => f.workout.id === 'w2')).toBe(true);
    expect(weekTwoOnly.find((f) => f.athlete.name === 'Ben Brown').ownBest).toBe(50);   // from week 1
  });

  test('a one-off squad best too small to reason from is ignored', () => {
    const tiny = [
      { id: 1, athleteId: 'a2', workoutId: 'w1', sets: { e1: [{ reps: '20', load: '5' }] } },
      { id: 2, athleteId: 'a3', workoutId: 'w2', sets: { e3: [{ reps: '20', load: '15' }] } },
    ];
    expect(computeEntryFlags(ATHLETES, WORKOUTS, tiny)).toEqual([]);
  });
});

describe('what the swimmer is told', () => {
  test.each([
    [{ load: '10000' }, null, /over 400/],
    [{ load: '150' }, 50, /more than your best of 50/],
    [{ reps: '500', load: '40' }, 40, /500 reps/],
    [{ load: '40', rpe: '77' }, 40, /RPE only goes up to 10/],
  ])('%p warns', (row, best, pattern) => {
    expect(suspectSetEntry(row, best)).toMatch(pattern);
  });

  test.each([
    [{ load: '95' }, 90],
    [{ load: '105', reps: '5', rpe: '8' }, 95],
    [{ load: 'BW', reps: '10' }, null],
    [{ load: '', reps: '' }, 40],
    [{ load: '45' }, null],            // first time ever on a movement
  ])('%p is left alone', (row, best) => {
    expect(suspectSetEntry(row, best)).toBeNull();
  });
});
