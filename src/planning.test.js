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

test('week 1 is the source workout — same ids, so saving updates it', () => {
  const out = buildPlannedWorkouts(SOURCE, { weeks: 3, startDate: '2026-09-07', titleTemplate: 'W{n}' }, {}, ids);
  expect(out[0].id).toBe('src');                                 // updates, never a twin
  expect(out[0].blocks[1].exercises[0].id).toBe('e1');            // logs key sets by exercise id
  expect(out[0].blocks[1].id).toBe('b2');
});

test('later weeks are new workouts with fresh ids throughout', () => {
  const out = buildPlannedWorkouts(SOURCE, { weeks: 3, startDate: '2026-09-07', titleTemplate: 'W{n}' }, {}, ids);
  const laterIds = out.slice(1).flatMap((w) => [w.id, ...w.blocks.flatMap((b) => [b.id, ...b.exercises.map((e) => e.id)])]);
  expect(new Set(laterIds).size).toBe(laterIds.length);          // no duplicates between weeks
  expect(laterIds).not.toContain('src');
  expect(laterIds).not.toContain('e1');
  // editing a generated week cannot reach back into the source object
  out[1].blocks[1].exercises[0].reps = '99';
  expect(SOURCE.blocks[1].exercises[0].reps).toBe('8');
});

test('week 1 edits are applied to the source workout too', () => {
  const grid = { 0: { e1: { sets: '5', reps: '5', load: 'RPE 6' } } };
  const [w1] = buildPlannedWorkouts(SOURCE, { weeks: 2, startDate: '2026-09-07', titleTemplate: 'W{n}' }, grid, ids);
  expect(w1.id).toBe('src');
  expect(w1.blocks[1].exercises[0]).toMatchObject({ sets: '5', reps: '5', load: 'RPE 6' });
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

test('the block starts at the source week and date, with no separate week-number box', () => {
  openPlanner();
  expect(screen.getByDisplayValue('Strength - Week {n} - Monday')).toBeInTheDocument();
  expect(screen.getByDisplayValue('2026-09-07')).toBeInTheDocument();   // the source's own date
  expect(screen.queryByTitle(/number the first planned week/)).toBeNull();
  expect(screen.getByText(/Save 4 workouts/)).toBeInTheDocument();
  // week 1 is shown as the existing workout, later weeks as new
  expect(screen.getByText('this workout')).toBeInTheDocument();
  expect(screen.getAllByText('new')).toHaveLength(3);
});

test('one week means just this workout, nothing extra created', async () => {
  const save = openPlanner();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
  expect(screen.getByText(/Save 1 workout$/)).toBeInTheDocument();
  fireEvent.click(screen.getByText(/Save 1 workout$/));
  await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  expect(save.mock.calls[0][0].id).toBe('src');
});

test('saving covers the whole block, source week included', async () => {
  const save = openPlanner();
  const repsBoxes = screen.getAllByTitle('Reps');
  fireEvent.change(repsBoxes[repsBoxes.length - 2], { target: { value: '6' } });
  fireEvent.click(screen.getByText(/Save 4 workouts/));

  await waitFor(() => expect(save).toHaveBeenCalledTimes(4));
  const titles = save.mock.calls.map(([w]) => w.title);
  expect(titles).toEqual([
    'Strength - Week 1 - Monday', 'Strength - Week 2 - Monday',
    'Strength - Week 3 - Monday', 'Strength - Week 4 - Monday',
  ]);
  expect(save.mock.calls.map(([w]) => w.date)).toEqual(['2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28']);
  // assignees and season ride along on every week
  save.mock.calls.forEach(([w]) => {
    expect(w.assignees).toEqual(['a1', 'a2']);
    expect(w.season).toBe('2026 Short Course');
  });
});

test('a failed save stops the run rather than pressing on', async () => {
  const save = jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
  openPlanner(save);
  fireEvent.click(screen.getByText(/Save 4 workouts/));
  await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
  expect(save).toHaveBeenCalledTimes(2);   // stopped after the failure, not 4
});

test('dates that already hold another workout are flagged before committing', () => {
  const clash = { id: 'other', title: 'Core Stretch - Friday', date: '2026-09-21' };
  render(<PlanWeeksModal source={SOURCE} workouts={[SOURCE, clash]} onSaveWorkout={jest.fn()} onClose={() => {}} />);
  expect(screen.getByText(/already has: Core Stretch - Friday/)).toBeInTheDocument();
  expect(screen.getByText(/Creating anyway will leave both/)).toBeInTheDocument();
});

test('the source workout itself is not reported as a clash', () => {
  render(<PlanWeeksModal source={SOURCE} workouts={[SOURCE]} onSaveWorkout={jest.fn()} onClose={() => {}} />);
  expect(screen.queryByText(/already has:/)).toBeNull();
});
