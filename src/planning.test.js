import { buildPlannedWorkouts, titleTemplateFrom, addDays } from './helpers';

// A stand-in for the coach's real Monday: warm-up plus two working lifts.
const SOURCE = {
  id: 'src', title: 'Strength - Week 1 - Monday', date: '2026-09-07',
  season: '2026 Short Course', assignees: ['a1', 'a2'],
  blocks: [
    { id: 'b1', name: 'Warm-up', note: 'Move well before you load', exercises: [
      { id: 'e0', name: 'Inchworm', sets: '3', reps: '8', load: 'BW', note: 'slow', pairId: null },
    ] },
    { id: 'b2', name: 'Block 1', openSets: true, exercises: [
      { id: 'e1', name: 'Deadlift + BB', sets: '4', reps: '8', load: 'RPE 7', note: 'brace', pairId: 'p1' },
      { id: 'e2', name: 'Bench Press + BB', sets: '3', reps: '8', load: 'RPE 7', note: '', pairId: 'p1' },
    ] },
  ],
};
// Deterministic ids keep assertions readable.
let n = 0;
const ids = () => `id${++n}`;
beforeEach(() => { n = 0; });

test('week titles continue the numbering found in the source title', () => {
  expect(titleTemplateFrom('Strength - Week 1 - Monday')).toBe('Strength - Week {n} - Monday');
  expect(titleTemplateFrom('Power 5-3 - Friday TAPER')).toBe('Power 5-3 - Friday TAPER — Week {n}');
  expect(titleTemplateFrom('')).toBe('Week {n}');
});

test('dates land on the same weekday, one week apart', () => {
  const out = buildPlannedWorkouts(SOURCE, { weeks: 4, startDate: '2026-09-07', titleTemplate: 'W{n}' }, {}, ids);
  expect(out.map((w) => w.date)).toEqual(['2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28']);
  const weekdays = out.map((w) => new Date(w.date + 'T12:00:00').getDay());
  expect(new Set(weekdays).size).toBe(1);           // every one a Monday
  expect(addDays('2026-02-26', 7)).toBe('2026-03-05'); // month rollover
});

test('unedited cells inherit the source prescription', () => {
  const [w1] = buildPlannedWorkouts(SOURCE, { weeks: 1, startDate: '2026-09-07', titleTemplate: 'W{n}' }, {}, ids);
  const lift = w1.blocks[1].exercises[0];
  expect(lift).toMatchObject({ name: 'Deadlift + BB', sets: '4', reps: '8', load: 'RPE 7' });
});

test('the grid overrides sets, reps and load per week, independently', () => {
  const grid = {
    1: { e1: { reps: '8', load: 'RPE 8' } },                    // week 2: same reps, harder
    2: { e1: { sets: '4', reps: '6', load: 'RPE 8' }, e2: { reps: '6', load: 'RPE 8' } }, // week 3: drop reps
  };
  const out = buildPlannedWorkouts(SOURCE, { weeks: 3, startDate: '2026-09-07', titleTemplate: 'W{n}' }, grid, ids);
  const dl = (w) => w.blocks[1].exercises[0];
  expect(dl(out[0])).toMatchObject({ sets: '4', reps: '8', load: 'RPE 7' }); // untouched week 1
  expect(dl(out[1])).toMatchObject({ sets: '4', reps: '8', load: 'RPE 8' }); // sets inherited
  expect(dl(out[2])).toMatchObject({ sets: '4', reps: '6', load: 'RPE 8' });
  expect(out[2].blocks[1].exercises[1]).toMatchObject({ name: 'Bench Press + BB', reps: '6', load: 'RPE 8' });
});

test('everything not being planned is carried across untouched', () => {
  const [w] = buildPlannedWorkouts(SOURCE, { weeks: 1, startDate: '2026-09-07', titleTemplate: 'W{n}' }, {}, ids);
  expect(w.season).toBe('2026 Short Course');
  expect(w.assignees).toEqual(['a1', 'a2']);
  expect(w.blocks.map((b) => b.name)).toEqual(['Warm-up', 'Block 1']);
  expect(w.blocks[0].note).toBe('Move well before you load');   // block instructions
  expect(w.blocks[1].openSets).toBe(true);                      // athlete-add-sets toggle
  expect(w.blocks[1].exercises[0].note).toBe('brace');          // coaching cue
  expect(w.blocks[1].exercises[0].pairId).toBe('p1');           // superset pairing
});

test('generated workouts are independent — fresh ids everywhere', () => {
  const out = buildPlannedWorkouts(SOURCE, { weeks: 2, startDate: '2026-09-07', titleTemplate: 'W{n}' }, {}, ids);
  const allIds = out.flatMap((w) => [w.id, ...w.blocks.flatMap((b) => [b.id, ...b.exercises.map((e) => e.id)])]);
  expect(new Set(allIds).size).toBe(allIds.length);             // no duplicates across weeks
  expect(allIds).not.toContain('src');
  expect(allIds).not.toContain('e1');
  // mutating a generated workout cannot reach the source
  out[0].blocks[1].exercises[0].reps = '99';
  expect(SOURCE.blocks[1].exercises[0].reps).toBe('8');
});

test('the starting week number can be offset to continue a block', () => {
  const out = buildPlannedWorkouts(SOURCE, { weeks: 2, startDate: '2026-09-07', titleTemplate: 'Strength - Week {n} - Monday', startWeekNumber: 5 }, {}, ids);
  expect(out.map((w) => w.title)).toEqual(['Strength - Week 5 - Monday', 'Strength - Week 6 - Monday']);
});

// ── the modal itself ─────────────────────────────────────────────────────────
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
const { PlanWeeksModal } = require('./components/PlanWeeksModal');
beforeAll(() => { window.matchMedia = () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }); });

const openPlanner = (onSaveWorkout = jest.fn().mockResolvedValue(true)) => {
  render(<PlanWeeksModal source={SOURCE} athletes={[]} onSaveWorkout={onSaveWorkout} onClose={() => {}} />);
  return onSaveWorkout;
};

test('defaults follow on from the source week and date', () => {
  openPlanner();
  expect(screen.getByDisplayValue('Strength - Week {n} - Monday')).toBeInTheDocument();
  expect(screen.getByDisplayValue('2026-09-14')).toBeInTheDocument();   // week after the source
  expect(screen.getByDisplayValue('2')).toBeInTheDocument();            // source was Week 1
  expect(screen.getByText(/Create 4 workouts/)).toBeInTheDocument();
});

test('creating saves one workout per week with the planned numbers', async () => {
  const save = openPlanner();
  // every cell starts pre-filled; change Deadlift reps in the last week only
  const repsBoxes = screen.getAllByTitle('Reps');
  fireEvent.change(repsBoxes[repsBoxes.length - 2], { target: { value: '6' } });
  fireEvent.click(screen.getByText('Create 4 workouts'));

  await waitFor(() => expect(save).toHaveBeenCalledTimes(4));
  const titles = save.mock.calls.map(([w]) => w.title);
  expect(titles).toEqual([
    'Strength - Week 2 - Monday', 'Strength - Week 3 - Monday',
    'Strength - Week 4 - Monday', 'Strength - Week 5 - Monday',
  ]);
  expect(save.mock.calls.map(([w]) => w.date)).toEqual(['2026-09-14', '2026-09-21', '2026-09-28', '2026-10-05']);
  // assignees and season ride along on every week
  save.mock.calls.forEach(([w]) => {
    expect(w.assignees).toEqual(['a1', 'a2']);
    expect(w.season).toBe('2026 Short Course');
  });
});

test('a failed save stops the run rather than pressing on', async () => {
  const save = jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
  openPlanner(save);
  fireEvent.click(screen.getByText('Create 4 workouts'));
  await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
  expect(save).toHaveBeenCalledTimes(2);   // stopped after the failure, not 4
});
