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

describe('the count cards as filters', () => {
  const HISTORY = { id: 'h1', title: 'Week 1', date: daysAgo(9), season: '26-27 Short Course', assignees: ['a1'], blocks: [{ id: 'hb', name: 'Block 1', exercises: [{ id: 'he', name: 'Farmer Carry' }] }] };
  const TODAY = { id: 't1', title: 'Week 2', date: daysAgo(1), season: '26-27 Short Course', assignees: ['a1', 'a2'], blocks: [{ id: 'tb', name: 'Block 1', exercises: [{ id: 'te', name: 'Farmer Carry' }] }] };
  // Ann: a suspect entry AND a pain note. Ben: assigned, never logged.
  const LOGS = [
    { id: 1, athleteId: 'a1', workoutId: 'h1', sets: { he: [{ reps: '20', load: '40', done: true }] } },
    { id: 2, athleteId: 'a1', workoutId: 't1', note: 'shoulder hurts', blockNotes: {}, sets: { te: [{ reps: '20', load: '9000', done: true }] } },
  ];
  const painNote = {
    log: LOGS[1], athlete: ATHLETES[0], workout: TODAY, date: TODAY.date, loggedAt: Date.now(), level: 'pain', active: true,
    entries: [{ label: 'Session note', text: 'shoulder hurts', scan: { level: 'pain', terms: ['hurts'] } }],
  };
  const open = () => render(
    <AttentionTab athletes={ATHLETES} workouts={[HISTORY, TODAY]} logs={LOGS} noteFlags={[painNote]} reviewsReady
      checksReady onCheck={jest.fn()} onUncheck={jest.fn()} onMarkAddressed={jest.fn()} onFixEntry={jest.fn()} />
  );
  const card = (label) => screen.getByTitle(new RegExp(`only ${label}|everything again`, 'i'));

  test('everything shows until a card is clicked', () => {
    open();
    expect(screen.getByTestId('entry-flag')).toBeInTheDocument();
    expect(screen.getByTestId('note-card')).toBeInTheDocument();
    expect(screen.getByText('Ben Brown')).toBeInTheDocument();          // not logging
  });

  test('Pain / injury shows the note and hides the rest', () => {
    open();
    fireEvent.click(card('pain / injury notes'));
    expect(screen.getByTestId('note-card')).toBeInTheDocument();
    expect(screen.queryByTestId('entry-flag')).toBeNull();
    expect(screen.queryByText('Ben Brown')).toBeNull();
    expect(screen.getByText(/Showing only pain \/ injury notes/)).toBeInTheDocument();
  });

  test('Entries to check shows only those', () => {
    open();
    fireEvent.click(card('entries to check'));
    expect(screen.getByTestId('entry-flag')).toBeInTheDocument();
    expect(screen.queryByTestId('note-card')).toBeNull();
  });

  test('Not logging shows only the athletes who went quiet', () => {
    open();
    fireEvent.click(card('not logging'));
    expect(screen.getByText('Ben Brown')).toBeInTheDocument();
    expect(screen.queryByTestId('entry-flag')).toBeNull();
    expect(screen.queryByTestId('note-card')).toBeNull();
  });

  test('clicking the same card again, or the link, shows everything', () => {
    open();
    fireEvent.click(card('entries to check'));
    fireEvent.click(card('entries to check'));                          // toggles off
    expect(screen.getByTestId('note-card')).toBeInTheDocument();

    fireEvent.click(card('pain / injury notes'));
    fireEvent.click(screen.getByText(/show everything/));
    expect(screen.getByTestId('entry-flag')).toBeInTheDocument();
    expect(screen.getByTestId('note-card')).toBeInTheDocument();
  });

  test('a card with nothing in it cannot be clicked', () => {
    open();
    expect(screen.getByTitle(/Nothing to show for rpe climbing/)).toBeDisabled();
  });
});
