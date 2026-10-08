import { render, screen, fireEvent, within } from '@testing-library/react';
import { ProgressDashboard } from './components/ProgressDashboard';

beforeAll(() => {
  window.matchMedia = () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });
});

const WORKOUTS = [
  { id: 'w1', date: '2026-09-14', season: '26-27 Short Course', title: 'Week 1', assignees: ['a1', 'a2'],
    blocks: [{ id: 'b1', name: 'Block 1', exercises: [{ id: 'e1', name: 'Back Squat' }, { id: 'e2', name: 'Pull-up' }] }] },
  { id: 'w2', date: '2026-09-21', season: '26-27 Short Course', title: 'Week 2', assignees: ['a1', 'a2'],
    blocks: [{ id: 'b2', name: 'Block 1', exercises: [{ id: 'e3', name: 'Back Squat' }, { id: 'e4', name: 'Pull-up' }] }] },
  { id: 'w0', date: '2026-06-02', season: '2026 Long Course', title: 'Old', assignees: ['a1'],
    blocks: [{ id: 'b0', name: 'Block 1', exercises: [{ id: 'e0', name: 'Back Squat' }] }] },
];
const LOGS = [
  { athleteId: 'a1', workoutId: 'w0', sets: { e0: [{ load: '155' }] } },
  { athleteId: 'a1', workoutId: 'w1', sets: { e1: [{ load: '95' }], e2: [{ reps: '4' }] } },
  { athleteId: 'a1', workoutId: 'w2', sets: { e3: [{ load: '115' }], e4: [{ reps: '6' }] } },
  { athleteId: 'a2', workoutId: 'w1', sets: { e1: [{ load: '65' }] } },
  // Cara lifts the heaviest but gained the least — so "biggest gain" and
  // "heaviest" have to order the rows differently.
  { athleteId: 'a3', workoutId: 'w1', sets: { e1: [{ load: '150' }] } },
  { athleteId: 'a3', workoutId: 'w2', sets: { e3: [{ load: '155' }] } },
];
const ATHLETES = [{ id: 'a1', name: 'Ann', event: '8 Lane' }, { id: 'a2', name: 'Ben', event: '6 Lane' }, { id: 'a3', name: 'Cara', event: '8 Lane' }];

const renderProgress = (props = {}) => render(
  <ProgressDashboard athletes={ATHLETES} testScores={[]} workouts={WORKOUTS} logs={LOGS}
    seasons={['26-27 Short Course', '2026 Long Course']} defaultSeason="26-27 Short Course"
    onEnterScores={() => {}} {...props} />
);
// Body rows of the grid, as arrays of cell text.
const grid = () => screen.getAllByRole('row').slice(1).map((r) => within(r).getAllByRole('cell').map((c) => c.textContent));
const rowFor = (name) => grid().find((cells) => cells[0] === name);
const openPicker = () => fireEvent.click(screen.getByRole('button', { name: /Back Squat|Pull-up/ }));

test('progress opens on log-derived baselines, not the empty test days', () => {
  renderProgress();
  expect(screen.getByText(/Baselines from what they log/)).toBeInTheDocument();
  expect(screen.queryByText('+ Enter scores')).toBeNull();
});

test('the grid puts each session in its own column, with first, best and change', () => {
  renderProgress();
  expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Athlete', '9/14', '9/21', 'First', 'Best', 'Change']);
  expect(rowFor('Ann')).toEqual(['Ann', '95', '115', '95', '115', '+20 (21%)']);
  expect(rowFor('Ben')).toEqual(['Ben', '65', '–', '65', '65', 'baseline']);   // one session, no gain claimed
});

test('the movement picker lists only movements with data, searchable and type-filtered', () => {
  renderProgress();
  openPicker();
  expect(screen.getByPlaceholderText('Search moves…')).toBeInTheDocument();
  const dialogButtons = screen.getAllByRole('button').map((b) => b.textContent);
  expect(dialogButtons.some((t) => t.includes('Pull-up'))).toBe(true);
  expect(dialogButtons.some((t) => t.includes('Box Jump'))).toBe(false);      // library move nobody logged
  expect(screen.getByText(/2 movements logged this season/)).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText('Search moves…'), { target: { value: 'squat' } });
  expect(screen.queryByRole('button', { name: /^Pull-up/ })).toBeNull();      // search narrows the list
});

test('picking a bodyweight movement switches the grid to reps', () => {
  renderProgress();
  openPicker();
  fireEvent.click(screen.getByRole('button', { name: /^Pull-up/ }));
  expect(rowFor('Ann')).toEqual(['Ann', '4', '6', '4', '6', '+2 (50%)']);
  expect(screen.getByRole('button', { name: /Pull-up · 1 athlete · reps/ })).toBeInTheDocument();
});

test('sorting reorders the rows', () => {
  renderProgress();
  const order = () => grid().map((c) => c[0]);
  expect(order()).toEqual(['Ann', 'Cara', 'Ben']);                            // +20, +5, baseline
  fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'best' } });
  expect(order()).toEqual(['Cara', 'Ann', 'Ben']);                            // 155, 115, 65
  fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'name' } });
  expect(order()).toEqual(['Ann', 'Ben', 'Cara']);
  fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'recent' } });
  expect(order()).toEqual(['Ann', 'Cara', 'Ben']);                            // Ben's only session was 9/14
});

test('the group pills narrow the grid', () => {
  renderProgress();
  fireEvent.click(screen.getByText('6 Lane'));
  expect(grid().map((c) => c[0])).toEqual(['Ben']);
});

test('searching narrows to one athlete', () => {
  renderProgress();
  fireEvent.change(screen.getByLabelText('Search athlete'), { target: { value: 'ben' } });
  expect(grid().map((c) => c[0])).toEqual(['Ben']);
});

test('season pills rescope the baseline and the columns', () => {
  renderProgress();
  fireEvent.click(screen.getByText('2026 Long Course'));
  expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Athlete', '6/2', 'First', 'Best', 'Change']);
  expect(rowFor('Ann')).toEqual(['Ann', '155', '155', '155', 'baseline']);
  expect(rowFor('Ben')).toBeUndefined();                                      // no long-course logs
});

test('Test days still opens the three-metric view', () => {
  renderProgress();
  fireEvent.click(screen.getByText('Test days'));
  expect(screen.getByText('+ Enter scores')).toBeInTheDocument();
  expect(screen.getByText('Deadlift + BB')).toBeInTheDocument();
});

test('nothing logged yet says so instead of showing an empty grid', () => {
  renderProgress({ logs: [] });
  expect(screen.getByText(/Nothing logged with a weight or rep count yet/)).toBeInTheDocument();
  expect(screen.queryByRole('table')).toBeNull();
});
