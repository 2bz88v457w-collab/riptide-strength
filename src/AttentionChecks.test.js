import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AttentionTab } from './components/AttentionTab';
import { computeAttention } from './helpers';

beforeAll(() => {
  window.matchMedia = () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });
});

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const ATHLETES = [{ id: 'a1', name: 'Ann Adams', event: '8 Lane', archived: false }];
const WORKOUTS = [
  { id: 'w1', title: 'Week 2 - Monday', date: daysAgo(3), assignees: ['a1'], blocks: [] },
  { id: 'w2', title: 'Week 1 - Friday', date: daysAgo(6), assignees: ['a1'], blocks: [] },
];
const quietState = () => computeAttention(ATHLETES, WORKOUTS, []).at(0).flags.find((f) => f.kind === 'quiet').state;

const renderTab = (props = {}) => render(
  <AttentionTab athletes={ATHLETES} workouts={WORKOUTS} logs={[]} checksReady onCheck={jest.fn()} onUncheck={jest.fn()} {...props} />
);

test('an unchecked flag is listed with a Checked button', () => {
  renderTab();
  expect(screen.getByText('Ann Adams')).toBeInTheDocument();
  expect(screen.getByText('Checked')).toBeInTheDocument();
  expect(screen.queryByText(/^▸ Checked/)).toBeNull();
});

test('Checked records the flag as it looks right now', async () => {
  const onCheck = jest.fn(async () => true);
  renderTab({ onCheck });
  fireEvent.click(screen.getByText('Checked'));
  await waitFor(() => expect(onCheck).toHaveBeenCalledWith('a1', 'quiet', quietState()));
});

test('a checked flag leaves the list and sits under Checked, with a way back', async () => {
  const onUncheck = jest.fn(async () => true);
  const checks = [{ athlete_id: 'a1', kind: 'quiet', state: quietState(), checked_at: new Date().toISOString() }];
  renderTab({ checks, onUncheck });

  expect(screen.getByText('Nobody needs attention right now.')).toBeInTheDocument();
  fireEvent.click(screen.getByText(/Checked \(1\)/));
  expect(screen.getByText('Ann Adams')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Bring back'));
  await waitFor(() => expect(onUncheck).toHaveBeenCalledWith('a1', 'quiet'));
});

test('missing another session brings the flag back on its own', () => {
  const checks = [{ athlete_id: 'a1', kind: 'quiet', state: quietState(), checked_at: new Date().toISOString() }];
  const extra = [...WORKOUTS, { id: 'w3', title: 'Week 2 - Wednesday', date: daysAgo(1), assignees: ['a1'], blocks: [] }];
  render(<AttentionTab athletes={ATHLETES} workouts={extra} logs={[]} checks={checks} checksReady onCheck={jest.fn()} onUncheck={jest.fn()} />);
  expect(screen.getByText(/3 assigned sessions not logged/)).toBeInTheDocument();
  expect(screen.queryByText('Nobody needs attention right now.')).toBeNull();
});

test('before the SQL is run the button is disabled and says why', () => {
  renderTab({ checksReady: false });
  expect(screen.getByText('Checked')).toBeDisabled();
  expect(screen.getByText(/turns on once/)).toBeInTheDocument();
});
