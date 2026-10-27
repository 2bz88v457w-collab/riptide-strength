import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { LogModal } from './components/LogModal';
import { BenchmarkTab } from './components/BenchmarkTab';

beforeAll(() => {
  window.matchMedia = () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });
});

// Max-out week: Ann hit 2×115 (3RM estimate 110), Ben logged 8×65 (70).
const HISTORY = {
  id: 'w1', title: 'Max week', date: '2026-10-21', season: '26-27 Short Course',
  blocks: [{ id: 'b1', name: 'Block 1', exercises: [{ id: 'e1', name: 'Back Squat', sets: '1', reps: '2', load: '' }] }],
};
const TODAY = {
  id: 'w2', title: 'Week 1 - Monday', date: '2026-10-26', season: '26-27 Short Course',
  blocks: [{ id: 'b2', name: 'Block 1', exercises: [
    { id: 'e2', name: 'Back Squat', sets: '3', reps: '5', load: '75% 3RM' },
    { id: 'e3', name: 'Split Squat', sets: '3', reps: '8', load: '70% 3RM' },   // nobody has a benchmark
  ] }],
};
const LOGS = [
  { athleteId: 'a1', workoutId: 'w1', sets: { e1: [{ reps: '2', load: '115' }] } },
  { athleteId: 'a2', workoutId: 'w1', sets: { e1: [{ reps: '8', load: '65' }] } },
];
const ATHLETES = [{ id: 'a1', name: 'Ann Adams', event: '8 Lane' }, { id: 'a2', name: 'Ben Brown', event: '8 Lane' }];
const ALL = [HISTORY, TODAY];

describe('logging against a % of 3RM', () => {
  const open = (athleteId = 'a1', benchmarks = []) => render(
    <LogModal workout={TODAY} athleteId={athleteId} existingLog={null} allLogs={LOGS} allWorkouts={ALL}
      progressions={[]} benchmarks={benchmarks} onConsumeProgressions={() => {}} onSave={() => {}} onClose={() => {}} />
  );
  const squatBox = () => screen.getAllByPlaceholderText('lbs')[0];

  test('the weight box starts filled with this athlete\'s own number', () => {
    open();
    expect(screen.getByText(/75% of 3RM 110 → 82.5 lbs \(est\.\)/)).toBeInTheDocument();
    expect(squatBox().value).toBe('82.5');
  });

  test('a different athlete gets a different weight from the same prescription', () => {
    open('a2');
    expect(screen.getByText(/75% of 3RM 70 → 52.5 lbs/)).toBeInTheDocument();
    expect(squatBox().value).toBe('52.5');
  });

  test('a coach correction replaces the estimate, and drops the "est." marker', () => {
    open('a1', [{ athlete_id: 'a1', movement: 'back squat', value: 125 }]);
    expect(screen.getByText('75% of 3RM 125 → 95 lbs')).toBeInTheDocument();
    expect(squatBox().value).toBe('95');
  });

  test('a pre-filled weight is not counted as done until the athlete confirms', () => {
    open();
    const done = screen.getAllByText((t, el) => el?.tagName === 'BUTTON' && (t === '○' || t === '✓'));
    expect(done.filter((b) => b.textContent === '✓')).toHaveLength(0);
  });

  test('no benchmark yet says so instead of guessing', () => {
    open();
    expect(screen.getByText(/70% of 3RM — no benchmark yet/)).toBeInTheDocument();
    const splitSquatBoxes = screen.getAllByPlaceholderText('lbs').slice(3);   // the second exercise
    splitSquatBoxes.forEach((b) => expect(b.value).toBe(''));
  });

  test('the athlete can still type over it', () => {
    open();
    fireEvent.change(squatBox(), { target: { value: '90' } });
    expect(squatBox().value).toBe('90');
  });
});

describe('the 3RM tab', () => {
  const open = (props = {}) => render(
    <BenchmarkTab athletes={ATHLETES} workouts={ALL} logs={LOGS} seasons={['26-27 Short Course']}
      defaultSeason="26-27 Short Course" benchmarks={[]} ready onSave={jest.fn()} {...props} />
  );
  const rowFor = (name) => screen.getByText(name).closest('tr');

  test('lists the estimate, the set behind it, and the common percentages', () => {
    open();
    const ann = within(rowFor('Ann Adams'));
    expect(ann.getByText(/2×115 on .* → 110/)).toBeInTheDocument();
    expect(ann.getByLabelText('3RM for Ann Adams').placeholder).toBe('110');
    expect(ann.getAllByRole('cell').slice(-3).map((c) => c.textContent)).toEqual(['77.5', '87.5', '100']);
  });

  test('typing a correction saves it against that movement', async () => {
    const onSave = jest.fn(async () => true);
    open({ onSave });
    const box = screen.getByLabelText('3RM for Ann Adams');
    fireEvent.change(box, { target: { value: '125' } });
    fireEvent.blur(box);
    await waitFor(() => expect(onSave).toHaveBeenCalledWith('a1', 'back squat', 125));
  });

  test('clearing the box puts them back on the estimate', async () => {
    const onSave = jest.fn(async () => true);
    open({ onSave, benchmarks: [{ athlete_id: 'a1', movement: 'back squat', value: 125 }] });
    const box = screen.getByLabelText('3RM for Ann Adams');
    expect(box.value).toBe('125');
    fireEvent.change(box, { target: { value: '' } });
    fireEvent.blur(box);
    await waitFor(() => expect(onSave).toHaveBeenCalledWith('a1', 'back squat', null));
  });

  test('nonsense is not saved', async () => {
    const onSave = jest.fn(async () => true);
    open({ onSave });
    const box = screen.getByLabelText('3RM for Ann Adams');
    fireEvent.change(box, { target: { value: 'heavy' } });
    fireEvent.blur(box);
    await waitFor(() => expect(onSave).not.toHaveBeenCalled());
  });

  test('before the SQL is run the boxes are disabled and say why', () => {
    open({ ready: false });
    expect(screen.getByLabelText('3RM for Ann Adams')).toBeDisabled();
    expect(screen.getByText(/09-benchmarks\.sql/)).toBeInTheDocument();
  });
});
