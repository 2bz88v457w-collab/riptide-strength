import { render, screen } from '@testing-library/react';

// Stub the Supabase client so fetchAll resolves with empty tables instead of
// hitting the network from jsdom.
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({ select: () => Promise.resolve({ data: [] }) }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ error: { message: 'no users in test' } }),
      signOut: () => Promise.resolve({}),
    },
    functions: { invoke: () => Promise.resolve({ data: null, error: { message: 'not available in test' } }) },
  }),
}));

const { default: App } = require('./App');
const {
  roundLoad, getProgressionFill, getMoveTypes, getWorkoutMoveTypes,
  computeMovementScore, movementLevel,
} = require('./helpers');
const {
  EXERCISE_CATEGORIES, EXERCISE_BANK, REQUIRED_MOVE_TYPES,
  ASSESSMENT_MOVEMENTS, ASSESSMENT_MAX,
} = require('./constants');

test('shows the loading screen, then the login screen', async () => {
  render(<App />);
  expect(screen.getByText(/loading riptide strength/i)).toBeInTheDocument();

  // Once fetchAll resolves, the athlete/coach login screen appears.
  expect(await screen.findByText(/i'm an athlete/i)).toBeInTheDocument();
  expect(screen.getByText('Coach')).toBeInTheDocument();
  expect(screen.getByText(/log in/i)).toBeInTheDocument();
});

describe('weight progression (bumps)', () => {
  const workouts = [{
    id: 'w1',
    blocks: [{ id: 'b1', name: 'Block 1', exercises: [{ id: 'ex1', name: 'Back Squat', sets: '3', reps: '8', load: '95' }] }],
  }];
  const logs = [{
    id: 'l1', athleteId: 'a1', workoutId: 'w1', date: '2026-07-01', loggedAt: 1,
    sets: { ex1: [{ reps: '8', load: '95', done: true }, { reps: '8', load: '100', done: true }] },
  }];
  const rule = { id: 'r1', athleteId: 'a1', exerciseName: 'back squat', pct: 5 };

  test('roundLoad rounds to the nearest 2.5', () => {
    expect(roundLoad(99.75)).toBe(100);
    expect(roundLoad(16.5)).toBe(17.5);
    expect(roundLoad(95)).toBe(95);
  });

  test('computes target from heaviest set of last session, case-insensitive', () => {
    const fill = getProgressionFill('Back Squat', 'a1', [rule], logs, workouts, 'w2');
    expect(fill).toEqual({ rule, base: 100, target: 105 });
  });

  test('does not fire without a rule, without history, or for another athlete', () => {
    expect(getProgressionFill('Back Squat', 'a1', [], logs, workouts, 'w2')).toBeNull();
    expect(getProgressionFill('Deadlift', 'a1', [rule], logs, workouts, 'w2')).toBeNull();
    expect(getProgressionFill('Back Squat', 'a2', [rule], logs, workouts, 'w2')).toBeNull();
  });

  test('does not fire when the last session had no numeric loads', () => {
    const bwLogs = [{ ...logs[0], sets: { ex1: [{ reps: '8', load: 'BW', done: true }] } }];
    expect(getProgressionFill('Back Squat', 'a1', [rule], bwLogs, workouts, 'w2')).toBeNull();
  });

  test('negative percentage deloads', () => {
    const deload = { ...rule, pct: -10 };
    const fill = getProgressionFill('Back Squat', 'a1', [deload], logs, workouts, 'w2');
    expect(fill.target).toBe(90);
  });
});

describe('exercise library move types', () => {
  test('bank is deduped and covers all six categories', () => {
    expect(new Set(EXERCISE_BANK.map((e) => e.toLowerCase())).size).toBe(EXERCISE_BANK.length);
    expect(Object.keys(EXERCISE_CATEGORIES)).toEqual(['SQUAT', 'HINGE', 'PUSH', 'PULL', 'BRACE', 'FUNCTION']);
    expect(REQUIRED_MOVE_TYPES).toEqual(['SQUAT', 'HINGE', 'PUSH', 'PULL', 'BRACE']);
  });

  test('getMoveTypes is case-insensitive and supports multi-type moves', () => {
    expect(getMoveTypes('back squat')).toEqual(['SQUAT']);
    expect(getMoveTypes('Renegade Row + DB')).toEqual(expect.arrayContaining(['PUSH', 'PULL', 'BRACE']));
    expect(getMoveTypes('Made Up Move')).toEqual([]);
  });

  test('getWorkoutMoveTypes reports coverage across blocks', () => {
    const blocks = [
      { id: 'b1', name: 'Block 1', exercises: [{ id: 'e1', name: 'Back Squat' }, { id: 'e2', name: 'RDL' }] },
      { id: 'b2', name: 'Block 2', exercises: [{ id: 'e3', name: 'Push ups' }, { id: 'e4', name: 'Bird Dog' }] },
    ];
    const covered = getWorkoutMoveTypes(blocks);
    // Push-up is also a FUNCTION move in the source PDFs
    expect([...covered].sort()).toEqual(['BRACE', 'FUNCTION', 'HINGE', 'PUSH', 'SQUAT']);
    expect(REQUIRED_MOVE_TYPES.filter((t) => covered.has(t)).length).toBe(4); // PULL missing
  });
});

describe('movement assessment scoring', () => {
  // Perfect scores on every screen: 5 bilateral × 2 sides × 2 + 2 single × 2 = 24.
  const perfect = {};
  ASSESSMENT_MOVEMENTS.forEach((m) => {
    if (m.bilateral) { perfect[m.key + 'L'] = 2; perfect[m.key + 'R'] = 2; }
    else perfect[m.key] = 2;
  });

  test('perfect form scores the maximum of 24', () => {
    expect(computeMovementScore(perfect)).toEqual({ total: ASSESSMENT_MAX, pain: false, complete: true });
  });

  test('minimum with no pain is 14 (impingement has no middle score)', () => {
    const min = {};
    ASSESSMENT_MOVEMENTS.forEach((m) => {
      const low = Math.min(...m.options.filter((o) => o !== 0)); // lowest no-pain option
      if (m.bilateral) { min[m.key + 'L'] = low; min[m.key + 'R'] = low; }
      else min[m.key] = low;
    });
    expect(computeMovementScore(min)).toEqual({ total: 14, pain: false, complete: true });
  });

  test('a zero flags pain and unentered cells mark incomplete', () => {
    const withPain = { ...perfect, shoulderImpingementL: 0 };
    expect(computeMovementScore(withPain)).toEqual({ total: 22, pain: true, complete: true });
    const { complete, total } = computeMovementScore({ overheadSquat: 2 });
    expect(complete).toBe(false);
    expect(total).toBe(2);
  });

  test('movement levels bucket by score with pain overriding', () => {
    expect(movementLevel(24, false).label).toBe('Level 3');
    expect(movementLevel(22, false).label).toBe('Level 3');
    expect(movementLevel(21, false).label).toBe('Level 2');
    expect(movementLevel(18, false).label).toBe('Level 2');
    expect(movementLevel(17, false).label).toBe('Level 1');
    expect(movementLevel(23, true).label).toBe('Pain flagged');
  });
});
