import { render, screen, fireEvent } from '@testing-library/react';
import { AttentionTab } from './components/AttentionTab';

beforeAll(() => {
  window.matchMedia = () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });
});

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const ATHLETES = [
  { id: 'a1', name: 'Ann Adams', event: '8 Lane', archived: false },
  { id: 'a2', name: 'Ben Brown', event: '7 Lane', archived: false },
];
const WORKOUTS = [
  { id: 'sc1', title: 'SC Week 3', date: daysAgo(2), season: '26-27 Short Course', assignees: ['a1'], blocks: [] },
  { id: 'lc1', title: 'LC Summer', date: daysAgo(4), season: '2026 Long Course', assignees: ['a2'], blocks: [] },
];
const renderTab = (props = {}) => render(
  <AttentionTab athletes={ATHLETES} workouts={WORKOUTS} logs={[]} checksReady onCheck={jest.fn()} onUncheck={jest.fn()} {...props} />
);

test('both swimmers are flagged before any filtering', () => {
  renderTab();
  expect(screen.getByText('Ann Adams')).toBeInTheDocument();
  expect(screen.getByText('Ben Brown')).toBeInTheDocument();
});

test('season pills scope the flags to that season', () => {
  renderTab();
  fireEvent.click(screen.getByText('26-27 Short Course'));
  expect(screen.getByText('Ann Adams')).toBeInTheDocument();
  expect(screen.queryByText('Ben Brown')).toBeNull();          // his session was long course
  expect(screen.getByText(/Counting 26-27 Short Course sessions/)).toBeInTheDocument();
});

test('a from-date drops sessions before it', () => {
  renderTab();
  fireEvent.change(screen.getByLabelText('From date'), { target: { value: daysAgo(3) } });
  expect(screen.getByText('Ann Adams')).toBeInTheDocument();   // 2 days ago, still in range
  expect(screen.queryByText('Ben Brown')).toBeNull();          // 4 days ago, out of range
});

test('an end date is treated as "as of" that date, so nothing counts as missed yet', () => {
  renderTab();
  fireEvent.change(screen.getByLabelText('To date'), { target: { value: daysAgo(10) } });
  expect(screen.getByText('Nobody needs attention right now.')).toBeInTheDocument();
  expect(screen.getByText(/as of that date/)).toBeInTheDocument();
});

test('Clear dates puts everyone back', () => {
  renderTab();
  fireEvent.change(screen.getByLabelText('From date'), { target: { value: daysAgo(3) } });
  expect(screen.queryByText('Ben Brown')).toBeNull();
  fireEvent.click(screen.getByText('Clear dates'));
  expect(screen.getByText('Ben Brown')).toBeInTheDocument();
});

test('season and group filters narrow together', () => {
  renderTab();
  fireEvent.click(screen.getByText('26-27 Short Course'));
  fireEvent.click(screen.getByText('7 Lane'));                 // Ann is 8 Lane
  expect(screen.getByText('Nobody needs attention right now.')).toBeInTheDocument();
});
