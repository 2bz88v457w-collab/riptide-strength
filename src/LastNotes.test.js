import { render, screen, fireEvent } from '@testing-library/react';
import { LogModal } from './components/LogModal';
import { lastSessionNotes } from './notes';

// Each week is its own workout row with fresh block ids, so last week's notes
// can only be matched to this week's blocks by block NAME.
const THIS_WEEK = {
  id: 'w3', title: 'Strength - Week 3 - Monday', date: '2026-10-05',
  blocks: [
    { id: 'c1', name: 'Block 1', exercises: [{ id: 'e9', name: 'Back Squat', sets: '3', reps: '5', load: '95' }] },
    { id: 'c2', name: 'Cool Down', exercises: [] },
  ],
};
const LAST_WEEK = {
  id: 'w2', title: 'Strength - Week 2 - Monday', date: '2026-09-28',
  blocks: [{ id: 'b1', name: 'Block 1', exercises: [{ id: 'e5', name: 'Back Squat' }] }, { id: 'b2', name: 'Cool Down', exercises: [] }],
};
const TWO_WEEKS_AGO = {
  id: 'w1', title: 'Strength - Week 1 - Monday', date: '2026-09-21',
  blocks: [{ id: 'a1b', name: 'Block 1', exercises: [] }],
};
const LOGS = [
  { id: 1, athleteId: 'a1', workoutId: 'w1', loggedAt: 1, note: 'first week, felt fine', blockNotes: {}, rpe: '5' },
  { id: 2, athleteId: 'a1', workoutId: 'w2', loggedAt: 2, note: 'legs heavy', blockNotes: { b1: 'shoulder felt off on squats', b2: '' }, rpe: '8' },
  { id: 3, athleteId: 'a2', workoutId: 'w2', loggedAt: 3, note: 'someone else entirely', blockNotes: {}, rpe: '6' },
];
const ALL_WORKOUTS = [THIS_WEEK, LAST_WEEK, TWO_WEEKS_AGO];

beforeEach(() => { try { localStorage.clear(); } catch { /* ignore */ } });

describe('finding the notes', () => {
  test('returns the athlete\'s own most recent session that had notes', () => {
    const last = lastSessionNotes('a1', LOGS, ALL_WORKOUTS, 'w3');
    expect(last).toMatchObject({ date: '2026-09-28', sessionNote: 'legs heavy', rpe: '8' });
    expect(last.byBlockName).toEqual({ 'Block 1': 'shoulder felt off on squats' });
  });

  test('another athlete\'s notes are never returned', () => {
    expect(lastSessionNotes('a2', LOGS, ALL_WORKOUTS, 'w3').sessionNote).toBe('someone else entirely');
  });

  test('the session being logged is excluded, and so are sessions with nothing written', () => {
    expect(lastSessionNotes('a1', LOGS, ALL_WORKOUTS, 'w2').date).toBe('2026-09-21');  // skips back a week
    const blank = [{ id: 9, athleteId: 'a1', workoutId: 'w2', loggedAt: 9, note: '  ', blockNotes: { b1: '' } }];
    expect(lastSessionNotes('a1', blank, ALL_WORKOUTS, 'w3')).toBeNull();
  });

  test('no athlete (the coach previewing a workout) gets nothing', () => {
    expect(lastSessionNotes(null, LOGS, ALL_WORKOUTS, 'w3')).toBeNull();
  });
});

describe('while logging', () => {
  const open = (props = {}) => render(
    <LogModal workout={THIS_WEEK} athleteId="a1" existingLog={null} allLogs={LOGS} allWorkouts={ALL_WORKOUTS}
      progressions={[]} onConsumeProgressions={() => {}} onSave={() => {}} onClose={() => {}} {...props} />
  );
  const expander = () => screen.getByText(/Your notes from/);

  test('starts collapsed — one line, nothing to scroll past', () => {
    open();
    expect(expander()).toHaveTextContent('Sep 28');
    expect(screen.queryByTestId('last-session-note')).toBeNull();
    expect(screen.queryByTestId('last-block-note')).toBeNull();
  });

  test('expanding shows the session note and each block note, labelled by block', () => {
    open();
    fireEvent.click(expander());
    expect(screen.getByTestId('last-session-note')).toHaveTextContent('legs heavy');
    expect(screen.getByTestId('last-session-note')).toHaveTextContent('RPE 8');
    const blockNote = screen.getByTestId('last-block-note');
    expect(blockNote).toHaveTextContent('Block 1:');
    expect(blockNote).toHaveTextContent('shoulder felt off on squats');
  });

  test('expanded or collapsed is remembered next time they log', () => {
    const first = open();
    fireEvent.click(expander());                                         // opened
    expect(screen.getByTestId('last-session-note')).toBeInTheDocument();
    first.unmount();

    const second = open();                                               // reopened later, still open
    expect(screen.getByTestId('last-session-note')).toBeInTheDocument();
    fireEvent.click(expander());                                         // closed again
    second.unmount();

    open();
    expect(screen.queryByTestId('last-session-note')).toBeNull();
  });

  test('their own new notes start empty — last week\'s text is never pre-filled', () => {
    open();
    fireEvent.click(expander());
    expect(screen.getByPlaceholderText(/How did it feel/).value).toBe('');
    expect(screen.getByPlaceholderText(/Notes for Block 1/).value).toBe('');
  });

  test('no panel at all when there is nothing from last time', () => {
    open({ allLogs: [], allWorkouts: [THIS_WEEK] });
    expect(screen.queryByText(/Your notes from/)).toBeNull();
  });
});
