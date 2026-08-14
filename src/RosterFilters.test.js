import { render, screen, fireEvent } from '@testing-library/react';
import { CoachApp } from './components/CoachApp';

beforeAll(() => {
  window.matchMedia = () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });
});

const ATHLETES = [
  { id: 'a1', name: 'Ann Adams', event: '8 Lane', tags: ['aug-clinic'], archived: false },
  { id: 'a2', name: 'Ben Brown', event: '7 Lane', tags: ['privates'], archived: false },
  { id: 'a3', name: 'Cara Cole', event: '8 Lane', tags: ['aug-clinic', 'privates'], archived: false },
  { id: 'a4', name: 'Dan Dole', event: '8 Lane', archived: false }, // no tags key at all
];

const noop = () => {};
const openRoster = () => {
  render(
    <CoachApp athletes={ATHLETES} workouts={[]} logs={[]} testScores={[]} progressions={[]} assessments={[]}
      onSaveAssessment={noop} onDeleteAssessment={noop} onSaveProgressions={noop} onDeleteProgression={noop}
      onSaveWorkout={noop} onDeleteWorkout={noop} onUpdateAthlete={noop} onDeleteAthlete={noop}
      onAddAthlete={noop} onSaveTestScore={noop} onBulkTag={noop} onLogout={noop} />
  );
  fireEvent.click(screen.getByRole('button', { name: 'roster' }));
};
const shown = () => ATHLETES.map((a) => a.name).filter((n) => screen.queryByText(n));
const clickTag = (t) => fireEvent.click(screen.getByTitle(new RegExp(`^(Add|Remove) "${t}"`)));

test('no tag filter shows everyone, including athletes with no tags field', () => {
  openRoster();
  expect(shown()).toEqual(['Ann Adams', 'Ben Brown', 'Cara Cole', 'Dan Dole']);
});

test('one tag filters to holders of that tag', () => {
  openRoster();
  clickTag('aug-clinic');
  expect(shown()).toEqual(['Ann Adams', 'Cara Cole']);
});

test('two tags use OR semantics — the union, not the intersection', () => {
  openRoster();
  clickTag('aug-clinic');
  clickTag('privates');
  expect(shown()).toEqual(['Ann Adams', 'Ben Brown', 'Cara Cole']); // Cara has both, listed once
  clickTag('aug-clinic');                                          // toggle one back off
  expect(shown()).toEqual(['Ben Brown', 'Cara Cole']);
});

test('tag filters narrow within a pool-group filter (AND across categories)', () => {
  openRoster();
  clickTag('aug-clinic');
  clickTag('privates');
  fireEvent.click(screen.getByRole('button', { name: '8 Lane (3)' }));
  expect(shown()).toEqual(['Ann Adams', 'Cara Cole']); // 8 Lane AND (aug-clinic OR privates)
});

test('All clears both the group filter and every tag filter', () => {
  openRoster();
  clickTag('privates');
  fireEvent.click(screen.getByRole('button', { name: '7 Lane (1)' }));
  expect(shown()).toEqual(['Ben Brown']);
  fireEvent.click(screen.getByRole('button', { name: 'All (4)' }));
  expect(shown()).toEqual(['Ann Adams', 'Ben Brown', 'Cara Cole', 'Dan Dole']);
});

describe('logs tab filters', () => {
  const WORKOUTS = [
    { id: 'w1', title: 'Power Monday', date: '2026-09-09', assignees: ['a1', 'a2'], blocks: [] },
    { id: 'w2', title: 'Clinic Day 1', date: '2026-09-16', assignees: ['a3'], blocks: [] },
  ];
  const LOGS = [
    { id: 1, athleteId: 'a1', workoutId: 'w1', date: '2026-09-09', loggedAt: 100 },
    { id: 2, athleteId: 'a2', workoutId: 'w1', date: '2026-09-09', loggedAt: 200 },
    { id: 3, athleteId: 'a3', workoutId: 'w2', date: '2026-09-16', loggedAt: 300 },
  ];
  const openLogs = () => {
    render(
      <CoachApp athletes={ATHLETES} workouts={WORKOUTS} logs={LOGS} testScores={[]} progressions={[]} assessments={[]}
        onSaveAssessment={noop} onDeleteAssessment={noop} onSaveProgressions={noop} onDeleteProgression={noop}
        onSaveWorkout={noop} onDeleteWorkout={noop} onUpdateAthlete={noop} onDeleteAthlete={noop}
        onAddAthlete={noop} onSaveTestScore={noop} onBulkTag={noop} onLogout={noop} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'logs' }));
  };
  const loggedNames = () => ATHLETES.map((a) => a.name).filter((n) => screen.queryByText((_, el) => el?.tagName === 'P' && el.textContent.startsWith(n + ' logged')));

  test('shows every session by default', () => {
    openLogs();
    expect(loggedNames()).toEqual(['Ann Adams', 'Ben Brown', 'Cara Cole']);
  });

  test('search matches athlete name or workout title', () => {
    openLogs();
    fireEvent.change(screen.getByPlaceholderText('Search athlete or workout…'), { target: { value: 'cara' } });
    expect(loggedNames()).toEqual(['Cara Cole']);
    fireEvent.change(screen.getByPlaceholderText('Search athlete or workout…'), { target: { value: 'Power' } });
    expect(loggedNames()).toEqual(['Ann Adams', 'Ben Brown']);
  });

  test('date range scopes the list, inclusive', () => {
    openLogs();
    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: '2026-09-16' } });
    expect(loggedNames()).toEqual(['Cara Cole']);
    fireEvent.change(dateInputs[0], { target: { value: '2026-09-09' } });
    fireEvent.change(dateInputs[1], { target: { value: '2026-09-09' } });
    expect(loggedNames()).toEqual(['Ann Adams', 'Ben Brown']);
  });

  test('group and tag pills filter by who logged', () => {
    openLogs();
    fireEvent.click(screen.getByRole('button', { name: '🏷 privates' }));
    expect(loggedNames()).toEqual(['Ben Brown', 'Cara Cole']);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(loggedNames()).toEqual(['Ann Adams', 'Ben Brown', 'Cara Cole']);
  });
});

describe('needs attention tab', () => {
  const dayAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
  const WORKOUTS = [
    { id: 'w1', title: 'Monday', date: dayAgo(2), assignees: ['a1', 'a2'], blocks: [] },
    { id: 'w2', title: 'Wednesday', date: dayAgo(4), assignees: ['a1', 'a2'], blocks: [] },
  ];
  const LOGS = [ // Ben logged both, Ann logged neither, Cara had nothing assigned
    { id: 1, athleteId: 'a2', workoutId: 'w1', date: dayAgo(2), loggedAt: 1 },
    { id: 2, athleteId: 'a2', workoutId: 'w2', date: dayAgo(4), loggedAt: 2 },
  ];
  const openAttention = (logs = LOGS) => {
    render(
      <CoachApp athletes={ATHLETES} workouts={WORKOUTS} logs={logs} testScores={[]} progressions={[]} assessments={[]}
        onSaveAssessment={noop} onDeleteAssessment={noop} onSaveProgressions={noop} onDeleteProgression={noop}
        onSaveWorkout={noop} onDeleteWorkout={noop} onUpdateAthlete={noop} onDeleteAthlete={noop}
        onAddAthlete={noop} onSaveTestScore={noop} onBulkTag={noop} onLogout={noop} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'attention' }));
  };

  test('lists only the athlete who missed assigned sessions', () => {
    openAttention();
    expect(screen.getByText('Ann Adams')).toBeInTheDocument();
    expect(screen.queryByText('Ben Brown')).toBeNull();   // logged everything
    expect(screen.queryByText('Cara Cole')).toBeNull();   // nothing assigned
    expect(screen.getByText(/2 assigned sessions not logged/)).toBeInTheDocument();
  });

  test('shows a clean state when everyone is on track', () => {
    openAttention([...LOGS,
      { id: 3, athleteId: 'a1', workoutId: 'w1', date: dayAgo(2), loggedAt: 3 },
      { id: 4, athleteId: 'a1', workoutId: 'w2', date: dayAgo(4), loggedAt: 4 },
    ]);
    expect(screen.getByText('Nobody needs attention right now.')).toBeInTheDocument();
  });
});
