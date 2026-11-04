import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CoachApp } from './components/CoachApp';
import { SessionDetailModal } from './components/SessionDetailModal';

beforeAll(() => {
  window.matchMedia = () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });
});

const ATHLETES = [{ id: 'a1', name: 'Ann Adams', event: '8 Lane', archived: false }];
const WORKOUT = {
  id: 'w1', title: 'Week 5 - Monday', date: '2026-11-02', season: '26-27 Short Course', assignees: ['a1'],
  blocks: [{ id: 'b1', name: 'Block 1', exercises: [{ id: 'e1', name: 'Back Squat', sets: '2', reps: '5', load: '95' }] }],
};
// A fat-fingered entry: 955 lbs instead of 95.
const LOG = {
  id: 77, athleteId: 'a1', workoutId: 'w1', date: '2026-11-02', loggedAt: 1762100000000, rpe: '7',
  note: 'felt ok', blockNotes: { b1: '' },
  sets: { e1: [{ reps: '5', load: '955', rpe: '', done: true }, { reps: '5', load: '95', rpe: '', done: true }] },
};

describe('the session view', () => {
  const open = (props = {}) => render(
    <SessionDetailModal log={LOG} workout={WORKOUT} athlete={ATHLETES[0]} onClose={() => {}}
      onEdit={jest.fn()} onDelete={jest.fn(async () => true)} {...props} />
  );

  test('offers fixing and clearing alongside Close', () => {
    open();
    expect(screen.getByText('Fix numbers')).toBeInTheDocument();
    expect(screen.getByText('Clear session')).toBeInTheDocument();
  });

  test('clearing asks first, naming the athlete and the session', async () => {
    const onDelete = jest.fn(async () => true);
    const confirm = jest.spyOn(window, 'confirm').mockReturnValue(false);
    open({ onDelete });
    fireEvent.click(screen.getByText('Clear session'));
    expect(confirm.mock.calls[0][0]).toMatch(/Ann Adams.*Week 5 - Monday/s);
    expect(onDelete).not.toHaveBeenCalled();           // they said no

    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByText('Clear session'));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(LOG));
    confirm.mockRestore();
  });

  test('a read-only viewer sees neither action', () => {
    open({ onEdit: undefined, onDelete: undefined });
    expect(screen.queryByText('Fix numbers')).toBeNull();
    expect(screen.queryByText('Clear session')).toBeNull();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });
});

describe('fixing a swimmer\'s entry from the coach view', () => {
  const noop = () => {};
  const renderCoach = (props = {}) => render(
    <CoachApp athletes={ATHLETES} workouts={[WORKOUT]} logs={[LOG]} testScores={[]} progressions={[]} assessments={[]}
      onSaveAssessment={noop} onDeleteAssessment={noop} onSaveProgressions={noop} onDeleteProgression={noop}
      onSaveWorkout={noop} onDeleteWorkout={noop} onUpdateAthlete={noop} onDeleteAthlete={noop}
      onAddAthlete={noop} onImportRoster={noop} onSaveTestScore={noop} onBulkTag={noop} onLogout={noop}
      onSaveLog={jest.fn(async () => true)} onDeleteLog={jest.fn(async () => true)} {...props} />
  );
  const openSession = () => {
    fireEvent.click(screen.getByRole('button', { name: 'logs' }));
    fireEvent.click(screen.getByText('View'));
  };

  test('the logs tab opens the session, which opens the athlete\'s own screen', () => {
    renderCoach();
    openSession();
    fireEvent.click(screen.getByText('Fix numbers'));
    // Their numbers are there to correct, not a blank form.
    const boxes = screen.getAllByDisplayValue('955');
    expect(boxes).toHaveLength(1);
    expect(screen.getByDisplayValue('felt ok')).toBeInTheDocument();
    expect(screen.getByDisplayValue('7')).toBeInTheDocument();
  });

  test('the correction saves against that athlete, not the coach', async () => {
    const onSaveLog = jest.fn(async () => true);
    renderCoach({ onSaveLog });
    openSession();
    fireEvent.click(screen.getByText('Fix numbers'));
    fireEvent.change(screen.getByDisplayValue('955'), { target: { value: '95' } });
    fireEvent.click(screen.getByText('Save session'));
    await waitFor(() => expect(onSaveLog).toHaveBeenCalled());
    const saved = onSaveLog.mock.calls[0][0];
    expect(saved).toMatchObject({ athleteId: 'a1', workoutId: 'w1', date: '2026-11-02' });
    expect(saved.sets.e1[0].load).toBe('95');
    expect(saved.sets.e1[1].load).toBe('95');          // the set that was already right is untouched
  });

  test('a coach correction never autosaves — it waits for the button', async () => {
    const onSaveLog = jest.fn(async () => true);
    renderCoach({ onSaveLog });
    openSession();
    fireEvent.click(screen.getByText('Fix numbers'));
    fireEvent.change(screen.getByDisplayValue('955'), { target: { value: '95' } });
    expect(screen.queryByTestId('autosave-status')).toBeNull();
    await new Promise((r) => setTimeout(r, 50));
    expect(onSaveLog).not.toHaveBeenCalled();
  });

  test('clearing a session from the coach view removes it', async () => {
    const onDeleteLog = jest.fn(async () => true);
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    renderCoach({ onDeleteLog });
    openSession();
    fireEvent.click(screen.getByText('Clear session'));
    await waitFor(() => expect(onDeleteLog).toHaveBeenCalledWith(LOG));
    window.confirm.mockRestore();
  });

  test('the session view also opens from an athlete\'s own profile', () => {
    renderCoach();
    fireEvent.click(screen.getByRole('button', { name: 'roster' }));
    fireEvent.click(screen.getByText('Ann Adams'));
    fireEvent.click(screen.getByText('View session'));
    expect(screen.getByText('Fix numbers')).toBeInTheDocument();      // same modal, same actions
    expect(screen.getByText('Clear session')).toBeInTheDocument();
  });
});
