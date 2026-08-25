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
];
const ATHLETES = [{ id: 'a1', name: 'Ann', event: '8 Lane' }, { id: 'a2', name: 'Ben', event: '6 Lane' }];

const renderProgress = (props = {}) => render(
  <ProgressDashboard athletes={ATHLETES} testScores={[]} workouts={WORKOUTS} logs={LOGS}
    seasons={['26-27 Short Course', '2026 Long Course']} defaultSeason="26-27 Short Course"
    onEnterScores={() => {}} {...props} />
);
const rowFor = (name) => screen.getByText(name).closest('div').parentElement;

test('progress opens on log-derived baselines, not the empty test days', () => {
  renderProgress();
  expect(screen.getByText(/Baselines from what they log/)).toBeInTheDocument();
  expect(screen.queryByText('+ Enter scores')).toBeNull();          // test-day action is on the other view
  expect(within(rowFor('Ann')).getByText(/95 → 115/)).toBeInTheDocument();
});

test('an athlete with one session reads as a baseline, not a gain', () => {
  renderProgress();
  const ben = rowFor('Ben');
  expect(within(ben).getByText('baseline only')).toBeInTheDocument();
  expect(within(ben).getByText(/baseline 65 lbs/)).toBeInTheDocument();
});

test('the season pills rescope the baseline', () => {
  renderProgress();
  expect(within(rowFor('Ann')).getByText(/95 → 115/)).toBeInTheDocument();

  fireEvent.click(screen.getByText('2026 Long Course'));            // last season's 155 stands alone
  expect(within(rowFor('Ann')).getByText(/baseline 155 lbs/)).toBeInTheDocument();
  expect(screen.queryByText('Ben')).toBeNull();                     // he has no long-course logs
});

test('bodyweight movements are offered in reps', () => {
  renderProgress();
  fireEvent.change(screen.getByLabelText('Movement'), { target: { value: 'pull-up' } });
  expect(within(rowFor('Ann')).getByText(/4 → 6 reps/)).toBeInTheDocument();
});

test('Test days still opens the three-metric view', () => {
  renderProgress();
  fireEvent.click(screen.getByText('Test days'));
  expect(screen.getByText('+ Enter scores')).toBeInTheDocument();
  expect(screen.getByText('Deadlift + BB')).toBeInTheDocument();
  expect(screen.getByText(/No test scores yet/)).toBeInTheDocument();
});

test('nothing logged yet says so instead of showing an empty table', () => {
  renderProgress({ logs: [] });
  expect(screen.getByText(/Nothing logged with a weight or rep count yet/)).toBeInTheDocument();
});
