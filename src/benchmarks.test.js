import { athlete3RM, estimate3RM, estimatedBenchmarks, parsePrescribedPct, pctTargetLoad } from './helpers';

describe('estimating a 3RM from a set', () => {
  test('a real 3-rep set comes out as itself', () => {
    expect(estimate3RM('105', '3')).toBe(105);
  });

  test('heavier-for-fewer and lighter-for-more both convert', () => {
    expect(estimate3RM('115', '1')).toBe(105);       // 108.0 floored to the nearest 5
    expect(estimate3RM('95', '5')).toBe(100);
    expect(estimate3RM('135', '2')).toBe(130);
  });

  test('estimates round down, never up — percentages are programmed off these', () => {
    expect(estimate3RM('100', '4')).toBe(100);       // 103.0 → 100
    expect(estimate3RM('65', '8')).toBe(70);         // 74.8 → 70
  });

  test('units and blanks are handled like everywhere else', () => {
    expect(estimate3RM('95 lbs', '5')).toBe(100);
    expect(estimate3RM('BW', '5')).toBeNull();
    expect(estimate3RM('', '3')).toBeNull();
    expect(estimate3RM('95', '')).toBeNull();
    expect(estimate3RM('0', '3')).toBeNull();
  });

  test('long sets are not guessed from — the formula drifts', () => {
    expect(estimate3RM('45', '10')).not.toBeNull();
    expect(estimate3RM('45', '11')).toBeNull();
    expect(estimate3RM('45', '20')).toBeNull();
  });
});

describe('benchmarks from a max-out week', () => {
  const WORKOUTS = [
    { id: 'w1', date: '2026-10-19', season: '26-27 Short Course', blocks: [{ id: 'b1', name: 'Block 1', exercises: [{ id: 'e1', name: 'Back Squat' }, { id: 'e2', name: 'Bench Press' }] }] },
    { id: 'w2', date: '2026-10-21', season: '26-27 Short Course', blocks: [{ id: 'b2', name: 'Block 1', exercises: [{ id: 'e3', name: 'back squat' }] }] },
    { id: 'w0', date: '2026-06-01', season: '2026 Long Course', blocks: [{ id: 'b0', name: 'Block 1', exercises: [{ id: 'e0', name: 'Back Squat' }] }] },
  ];
  const LOGS = [
    { athleteId: 'a1', workoutId: 'w1', sets: { e1: [{ reps: '5', load: '95' }, { reps: '3', load: '105' }], e2: [{ reps: '5', load: '65' }] } },
    { athleteId: 'a1', workoutId: 'w2', sets: { e3: [{ reps: '2', load: '115' }] } },          // best: 112.5
    { athleteId: 'a2', workoutId: 'w1', sets: { e1: [{ reps: '8', load: '65' }] } },
    { athleteId: 'a1', workoutId: 'w0', sets: { e0: [{ reps: '3', load: '155' }] } },          // last season
  ];

  test('takes each athlete\'s best set, and says which set it was', () => {
    const b = estimatedBenchmarks('Back Squat', WORKOUTS, LOGS, { season: '26-27 Short Course' });
    expect(b.get('a1')).toMatchObject({ value: 110, date: '2026-10-21', reps: 2, load: 115 });
    expect(b.get('a2').value).toBe(70);                                    // 8 × 65
  });

  test('matches the movement by name across workouts, case-insensitively', () => {
    const b = estimatedBenchmarks('BACK squat', WORKOUTS, LOGS, { season: '26-27 Short Course' });
    expect(b.get('a1').value).toBe(110);
    expect(estimatedBenchmarks('Bench Press', WORKOUTS, LOGS).get('a1').value).toBe(65);
  });

  test('season scoping keeps last season out of it', () => {
    expect(estimatedBenchmarks('Back Squat', WORKOUTS, LOGS).get('a1').value).toBe(155);        // unscoped
    expect(estimatedBenchmarks('Back Squat', WORKOUTS, LOGS, { season: '26-27 Short Course' }).get('a1').value).toBe(110);
  });

  test('a movement nobody has logged gives nothing', () => {
    expect(estimatedBenchmarks('Pull-up', WORKOUTS, LOGS).size).toBe(0);
  });

  describe('the coach\'s correction wins', () => {
    const overrides = [{ athlete_id: 'a1', movement: 'back squat', value: 125 }];

    test('an override replaces the estimate', () => {
      expect(athlete3RM('a1', 'Back Squat', overrides, WORKOUTS, LOGS)).toEqual({ value: 125, source: 'coach' });
    });

    test('everyone else still gets the estimate', () => {
      const a2 = athlete3RM('a2', 'Back Squat', overrides, WORKOUTS, LOGS);
      expect(a2).toMatchObject({ value: 70, source: 'estimated' });
      expect(a2.from.reps).toBe(8);
    });

    test('no logs and no override means no benchmark', () => {
      expect(athlete3RM('a9', 'Back Squat', overrides, WORKOUTS, LOGS)).toBeNull();
      expect(athlete3RM('a1', 'Back Squat', [], [], [])).toBeNull();
    });
  });
});

describe('reading a % prescription', () => {
  test.each([
    ['75% 3RM', 75],
    ['75% of 3RM', 75],
    ['80%3RM', 80],
    ['3RM at 85%', 85],
    ['3rm 90%', 90],
    ['62.5% 3RM', 62.5],
  ])('"%s" → %s%%', (text, pct) => expect(parsePrescribedPct(text)).toBe(pct));

  test.each(['RPE 8', '95', '', 'bodyweight', '75%', '200% 3RM'])('"%s" is not a %% prescription', (text) => {
    expect(parsePrescribedPct(text)).toBeNull();
  });

  test('the target is their own 3RM, rounded to the plate', () => {
    expect(pctTargetLoad(75, { value: 105 })).toBe(80);      // 78.75 → 80
    expect(pctTargetLoad(90, { value: 110 })).toBe(100);     // the % itself still lands on a 2.5 plate
    expect(pctTargetLoad(75, null)).toBeNull();
    expect(pctTargetLoad(null, { value: 105 })).toBeNull();
  });
});
