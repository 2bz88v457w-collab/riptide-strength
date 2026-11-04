import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LogModal } from './components/LogModal';
import { AttentionTab } from './components/AttentionTab';

beforeAll(() => {
  window.matchMedia = () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });
});

const HISTORY = { id: 'w1', title: 'Week 1', date: '2026-10-26', season: 'SC', blocks: [{ id: 'b1', name: 'Block 1', exercises: [{ id: 'e1', name: 'Farmer Carry' }] }] };
const TODAY = { id: 'w2', title: 'Week 2', date: '2026-11-02', season: 'SC', assignees: ['a1'], blocks: [{ id: 'b2', name: 'Block 1', exercises: [{ id: 'e2', name: 'Farmer Carry', sets: '1', reps: '20', load: '40' }] }] };
const LOGS = [{ id: 1, athleteId: 'a1', workoutId: 'w1', sets: { e1: [{ reps: '20', load: '40', done: true }] } }];
const ATHLETES = [{ id: 'a1', name: 'Ann Adams', event: '8 Lane', archived: false }];

describe('warning the swimmer as they type', () => {
  const open = (onSave = jest.fn(async () => true)) => {
    render(<LogModal workout={TODAY} athleteId="a1" existingLog={null} allLogs={LOGS} allWorkouts={[HISTORY, TODAY]}
      progressions={[]} onConsumeProgressions={() => {}} onSave={onSave} onClose={() => {}} />);
    return onSave;
  };
  const weight = () => screen.getByPlaceholderText('40');

  test('a sensible weight says nothing', () => {
    open();
    fireEvent.change(weight(), { target: { value: '45' } });
    expect(screen.queryByTestId('entry-warning')).toBeNull();
  });

  test('10,000 lbs is called out immediately, naming the set', () => {
    open();
    fireEvent.change(weight(), { target: { value: '10000' } });
    expect(screen.getByTestId('entry-warning')).toHaveTextContent('S1: 10000 lbs is over 400');
  });

  test('a number well above their own best is called out too', () => {
    open();
    fireEvent.change(weight(), { target: { value: '150' } });
    expect(screen.getByTestId('entry-warning')).toHaveTextContent('more than your best of 40');
  });

  test('saving asks "are you sure" and respects no', async () => {
    const onSave = open();
    const confirm = jest.spyOn(window, 'confirm').mockReturnValue(false);
    fireEvent.change(weight(), { target: { value: '10000' } });
    fireEvent.click(screen.getByText('Save session'));
    expect(confirm.mock.calls[0][0]).toMatch(/these look off[\s\S]*Farmer Carry set 1[\s\S]*Save anyway/);
    expect(onSave).not.toHaveBeenCalled();
    expect(weight().value).toBe('10000');          // still there to correct

    confirm.mockReturnValue(true);                  // a genuine heavy single
    fireEvent.click(screen.getByText('Save session'));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    confirm.mockRestore();
  });

  test('a clean session saves without any question', async () => {
    const onSave = open();
    const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.change(weight(), { target: { value: '45' } });
    fireEvent.click(screen.getByText('Save session'));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(confirm).not.toHaveBeenCalled();
    confirm.mockRestore();
  });
});

describe('the coach\'s list of entries to check', () => {
  const BAD = [...LOGS, { id: 2, athleteId: 'a1', workoutId: 'w2', sets: { e2: [{ reps: '20', load: '10000', done: true }] } }];
  const open = (props = {}) => render(
    <AttentionTab athletes={ATHLETES} workouts={[HISTORY, TODAY]} logs={BAD} checksReady
      onCheck={jest.fn()} onUncheck={jest.fn()} onFixEntry={jest.fn()} {...props} />
  );

  test('the suspect entry is listed with the athlete, movement and session', () => {
    open();
    const flag = screen.getByTestId('entry-flag');
    expect(flag).toHaveTextContent('Ann Adams · Farmer Carry');
    expect(flag).toHaveTextContent('10000 lbs — over 400');
    expect(flag).toHaveTextContent('Week 2');
  });

  test('"Open session" hands the coach the session to fix', () => {
    const onFixEntry = jest.fn();
    open({ onFixEntry });
    fireEvent.click(screen.getByText('Open session'));
    expect(onFixEntry.mock.calls[0][0]).toMatchObject({ value: 10000, movement: 'Farmer Carry' });
    expect(onFixEntry.mock.calls[0][0].log.id).toBe(2);
  });

  test('"Looks right" records the number so it stops being flagged', () => {
    const onCheck = jest.fn();
    open({ onCheck });
    fireEvent.click(screen.getByText('Looks right'));
    expect(onCheck).toHaveBeenCalledWith('a1', 'entry:2:e2', '10000');
  });

  test('once dismissed it drops off the list', () => {
    open({ checks: [{ athlete_id: 'a1', kind: 'entry:2:e2', state: '10000' }] });
    expect(screen.queryByTestId('entry-flag')).toBeNull();
  });

  test('a clean week leaves the tab quiet', () => {
    open({ logs: LOGS });
    expect(screen.queryByTestId('entry-flag')).toBeNull();
  });
});
