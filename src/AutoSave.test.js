import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { LogModal } from './components/LogModal';

beforeAll(() => {
  window.matchMedia = () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });
});
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

const WORKOUT = {
  id: 'w1', title: 'Week 3 - Monday', date: '2026-10-28',
  blocks: [{ id: 'b1', name: 'Block 1', exercises: [
    { id: 'e1', name: 'Back Squat', sets: '2', reps: '5', load: 'RPE 8' },   // pre-fills an RPE box
    { id: 'e2', name: 'Push-up', sets: '1', reps: '10', load: 'BW' },        // pre-fills "BW"
  ] }],
};
const open = (props = {}) => {
  const onAutoSave = props.onAutoSave || jest.fn(async () => true);
  const view = render(
    <LogModal workout={WORKOUT} athleteId="a1" existingLog={null} allLogs={[]} allWorkouts={[WORKOUT]}
      progressions={[]} onConsumeProgressions={() => {}} onSave={async () => true} onClose={() => {}}
      {...props} onAutoSave={onAutoSave} />
  );
  return { ...view, onAutoSave };
};
const settle = async (ms = 2600) => { await act(async () => { jest.advanceTimersByTime(ms); }); };
const weightBox = () => screen.getAllByPlaceholderText('lbs')[0];
const status = () => screen.getByTestId('autosave-status').textContent;

test('opening a workout saves nothing — pre-filled RPE and BW are not their work', async () => {
  const { onAutoSave } = open();
  expect(status()).toMatch(/Saves itself as you log/);
  await settle(10000);
  expect(onAutoSave).not.toHaveBeenCalled();
});

test('typing a weight saves the session a few seconds later, without the button', async () => {
  const { onAutoSave } = open();
  fireEvent.change(weightBox(), { target: { value: '95' } });
  expect(onAutoSave).not.toHaveBeenCalled();           // not on every keystroke
  await settle();
  expect(onAutoSave).toHaveBeenCalledTimes(1);
  expect(onAutoSave.mock.calls[0][0]).toMatchObject({ athleteId: 'a1', workoutId: 'w1', date: '2026-10-28' });
  expect(onAutoSave.mock.calls[0][0].sets.e1[0]).toMatchObject({ load: '95', reps: '5', done: true });
  await waitFor(() => expect(status()).toMatch(/Saved automatically at/));
});

test('a session note alone is enough to save', async () => {
  const { onAutoSave } = open();
  fireEvent.change(screen.getByPlaceholderText(/How did it feel/), { target: { value: 'legs cooked' } });
  await settle();
  expect(onAutoSave.mock.calls[0][0].note).toBe('legs cooked');
});

test('keystrokes are batched into one save', async () => {
  const { onAutoSave } = open();
  fireEvent.change(weightBox(), { target: { value: '9' } });
  await act(async () => { jest.advanceTimersByTime(1000); });
  fireEvent.change(weightBox(), { target: { value: '95' } });
  await act(async () => { jest.advanceTimersByTime(1000); });
  fireEvent.change(weightBox(), { target: { value: '105' } });
  expect(onAutoSave).not.toHaveBeenCalled();
  await settle();
  expect(onAutoSave).toHaveBeenCalledTimes(1);
  expect(onAutoSave.mock.calls[0][0].sets.e1[0].load).toBe('105');
});

test('locking the phone mid-workout saves immediately', async () => {
  const { onAutoSave } = open();
  fireEvent.change(weightBox(), { target: { value: '95' } });
  Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
  await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
  expect(onAutoSave).toHaveBeenCalledTimes(1);          // no waiting for the timer
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
});

test('closing the tab saves what is there', async () => {
  const { onAutoSave } = open();
  fireEvent.change(weightBox(), { target: { value: '95' } });
  await act(async () => { window.dispatchEvent(new Event('pagehide')); });
  expect(onAutoSave).toHaveBeenCalled();
});

test('a failed save says so and keeps the session on screen', async () => {
  const onAutoSave = jest.fn(async () => false);
  open({ onAutoSave });
  fireEvent.change(weightBox(), { target: { value: '95' } });
  await settle();
  await waitFor(() => expect(status()).toMatch(/Couldn't save yet/));
  expect(weightBox().value).toBe('95');                 // nothing thrown away
});

test('a coach bump is spent on the first autosave, not re-applied later', async () => {
  const onConsumeProgressions = jest.fn(async () => true);
  const WK = { ...WORKOUT, blocks: [{ id: 'b1', name: 'Block 1', exercises: [{ id: 'e1', name: 'Back Squat', sets: '1', reps: '5', load: '' }] }] };
  const history = { id: 'w0', date: '2026-10-21', blocks: [{ id: 'b0', name: 'Block 1', exercises: [{ id: 'e0', name: 'Back Squat' }] }] };
  const onAutoSave = jest.fn(async () => true);
  render(
    <LogModal workout={WK} athleteId="a1" existingLog={null}
      allLogs={[{ athleteId: 'a1', workoutId: 'w0', sets: { e0: [{ reps: '5', load: '95', done: true }] } }]}
      allWorkouts={[WK, history]}
      progressions={[{ id: 'p1', athleteId: 'a1', exerciseName: 'Back Squat', pct: 5 }]}
      onConsumeProgressions={onConsumeProgressions} onSave={async () => true} onAutoSave={onAutoSave} onClose={() => {}} />
  );
  // The box already shows the bumped 100, so log something else to make a change.
  expect(screen.getByPlaceholderText('—').value).toBe('100');
  fireEvent.change(screen.getByPlaceholderText('—'), { target: { value: '90' } });
  await settle();
  expect(onConsumeProgressions).toHaveBeenCalledWith(['p1']);

  fireEvent.change(screen.getByPlaceholderText('—'), { target: { value: '105' } });
  await settle();
  expect(onAutoSave).toHaveBeenCalledTimes(2);
  expect(onConsumeProgressions).toHaveBeenCalledTimes(1);   // spent once, not twice
});

test('the exit is called Close, since the work is already saved', () => {
  open();
  expect(screen.getByText('Close')).toBeInTheDocument();
  expect(screen.queryByText('Cancel')).toBeNull();
  expect(screen.getByText('Save session')).toBeInTheDocument();
});

test('the coach preview never saves anything', async () => {
  const onAutoSave = jest.fn(async () => true);
  render(
    <LogModal preview workout={WORKOUT} athleteId={null} allLogs={[]} allWorkouts={[WORKOUT]}
      progressions={[]} onSave={() => false} onAutoSave={onAutoSave} onClose={() => {}} />
  );
  fireEvent.change(screen.getAllByPlaceholderText('lbs')[0], { target: { value: '95' } });
  await settle(10000);
  expect(onAutoSave).not.toHaveBeenCalled();
  expect(screen.queryByTestId('autosave-status')).toBeNull();
});
