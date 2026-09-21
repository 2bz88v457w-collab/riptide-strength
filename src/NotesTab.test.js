import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { NotesTab } from './components/NotesTab';
import { AttentionTab } from './components/AttentionTab';
import { CoachApp } from './components/CoachApp';
import { buildNoteFeed, activeNoteFlags } from './notes';

beforeAll(() => {
  window.matchMedia = () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });
});

const NOW = Date.now();
const ATHLETES = [
  { id: 'a1', name: 'Ann Adams', event: '8 Lane', archived: false },
  { id: 'a2', name: 'Ben Brown', event: '7 Lane', archived: false },
];
const WORKOUTS = [{ id: 'w1', title: 'Week 2 - Monday', date: '2026-09-14', assignees: ['a1', 'a2'], blocks: [{ id: 'b1', name: 'Cool Down', exercises: [] }] }];
const LOGS = [
  { id: 11, athleteId: 'a1', workoutId: 'w1', date: '2026-09-14', loggedAt: NOW - 3600000, note: '', blockNotes: { b1: 'left shoulder hurts' } },
  { id: 12, athleteId: 'a2', workoutId: 'w1', date: '2026-09-14', loggedAt: NOW - 7200000, note: 'felt great', blockNotes: {} },
];
const feed = buildNoteFeed(LOGS, WORKOUTS, ATHLETES, []);
const cards = () => screen.getAllByTestId('note-card');
const cardFor = (name) => cards().find((c) => within(c).queryByText(name));

describe('Notes tab', () => {
  test('shows every note, with block notes labelled and pain words highlighted', () => {
    render(<NotesTab feed={feed} athletes={ATHLETES} reviewsReady onMarkAddressed={jest.fn()} />);
    expect(cards()).toHaveLength(2);
    const ann = cardFor('Ann Adams');
    expect(within(ann).getByText('Cool Down')).toBeInTheDocument();
    expect(within(ann).getByText('hurts').tagName).toBe('MARK');
    expect(within(ann).getByText('⚠ Pain / injury')).toBeInTheDocument();
  });

  test('"Pain or soreness" narrows to flagged notes, and search finds note text', () => {
    render(<NotesTab feed={feed} athletes={ATHLETES} reviewsReady onMarkAddressed={jest.fn()} />);
    fireEvent.click(screen.getByText(/Pain or soreness \(1\)/));
    expect(cards()).toHaveLength(1);
    fireEvent.click(screen.getByText(/Pain or soreness/));
    fireEvent.change(screen.getByLabelText('Search notes'), { target: { value: 'great' } });
    expect(cards()).toHaveLength(1);
    expect(cardFor('Ben Brown')).toBeTruthy();
  });

  test('Mark addressed hands the session back to be recorded', async () => {
    const onMark = jest.fn(async () => true);
    render(<NotesTab feed={feed} athletes={ATHLETES} reviewsReady onMarkAddressed={onMark} />);
    fireEvent.click(within(cardFor('Ann Adams')).getByText('Mark addressed'));
    await waitFor(() => expect(onMark).toHaveBeenCalledWith(LOGS[0]));
  });

  test('before the SQL is run, Mark addressed is visible but disabled', () => {
    render(<NotesTab feed={feed} athletes={ATHLETES} reviewsReady={false} onMarkAddressed={jest.fn()} />);
    const btn = within(cardFor('Ann Adams')).getByText('Mark addressed');
    expect(btn).toBeDisabled();
    expect(btn.title).toMatch(/07-note-reviews\.sql/);
  });
});

describe('Needs attention', () => {
  const flags = activeNoteFlags(feed);

  test('pain notes lead the page, with their own count', () => {
    render(<AttentionTab athletes={ATHLETES} workouts={WORKOUTS} logs={LOGS} noteFlags={flags} reviewsReady onMarkAddressed={jest.fn()} />);
    expect(screen.getByText('Notes to look at')).toBeInTheDocument();
    expect(within(screen.getByText('Pain / injury notes').parentElement).getByText('1')).toBeInTheDocument();
    expect(cards()).toHaveLength(1);
    expect(screen.queryByText('Nobody needs attention right now.')).toBeNull();
  });

  test('the group filter applies to notes too', () => {
    render(<AttentionTab athletes={ATHLETES} workouts={WORKOUTS} logs={LOGS} noteFlags={flags} reviewsReady onMarkAddressed={jest.fn()} />);
    fireEvent.click(screen.getByText('7 Lane'));                   // Ann is 8 Lane
    expect(screen.queryByText('Notes to look at')).toBeNull();
  });

  test('says how to turn on Mark addressed until the SQL is run', () => {
    render(<AttentionTab athletes={ATHLETES} workouts={WORKOUTS} logs={LOGS} noteFlags={flags} reviewsReady={false} onMarkAddressed={jest.fn()} />);
    expect(screen.getByText(/turns on once/)).toBeInTheDocument();
  });
});

describe('coach dashboard', () => {
  const noop = () => {};
  const renderCoach = (logs) => render(
    <CoachApp athletes={ATHLETES} workouts={WORKOUTS} logs={logs} testScores={[]} progressions={[]} assessments={[]}
      onSaveAssessment={noop} onDeleteAssessment={noop} onSaveProgressions={noop} onDeleteProgression={noop}
      onSaveWorkout={noop} onDeleteWorkout={noop} onUpdateAthlete={noop} onDeleteAthlete={noop}
      onAddAthlete={noop} onImportRoster={noop} onSaveTestScore={noop} onBulkTag={noop} onLogout={noop}
      noteReviews={[]} reviewsReady onMarkNoteAddressed={noop} />
  );

  test('the Needs attention tab shows a badge as soon as the coach opens the app', () => {
    renderCoach(LOGS);
    expect(screen.getByLabelText('1 note alert')).toBeInTheDocument();
  });

  test('no badge when nothing is flagged', () => {
    renderCoach([LOGS[1]]);
    expect(screen.queryByLabelText(/note alert/)).toBeNull();
  });

  test('the Notes tab opens the feed', () => {
    renderCoach(LOGS);
    fireEvent.click(screen.getByRole('button', { name: 'notes' }));
    expect(screen.getByRole('heading', { name: 'Notes' })).toBeInTheDocument();
    expect(cards()).toHaveLength(2);
  });
});
