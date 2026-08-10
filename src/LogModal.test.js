import { render, screen, fireEvent } from '@testing-library/react';
import { LogModal } from './components/LogModal';

const WORKOUT = {
  id: 'w1', title: 'Power Monday', date: '2026-09-09',
  blocks: [{ id: 'b1', name: 'Block 1', exercises: [
    { id: 'ex1', name: 'Alt DB Snatch', sets: '2', reps: '8', load: 'RPE 8' }, // intensity prescription
    { id: 'ex2', name: 'Back Squat', sets: '1', reps: '5', load: '95' },       // weight prescription
  ] }],
};
const open = () => render(
  <LogModal workout={WORKOUT} athleteId="a1" existingLog={null} allLogs={[]} allWorkouts={[WORKOUT]}
    progressions={[]} onConsumeProgressions={() => {}} onSave={() => {}} onClose={() => {}} />
);
// Weight inputs are the ones whose placeholder is a prescription or "lbs".
const rpeBoxes = () => screen.queryAllByTitle(/Coach prescribed RPE/);

test('an RPE-prescribed move gets its own RPE box, pre-filled and editable', () => {
  open();
  expect(rpeBoxes()).toHaveLength(2);              // one per set of ex1 only
  expect(rpeBoxes()[0].value).toBe('8');           // pre-filled from "RPE 8"
  fireEvent.change(rpeBoxes()[0], { target: { value: '9' } });
  expect(rpeBoxes()[0].value).toBe('9');
});

test('the weight box is free for weight — the prescription no longer sits in it', () => {
  open();
  const weightBoxes = screen.getAllByPlaceholderText('lbs');
  expect(weightBoxes).toHaveLength(2);             // ex1's two sets
  expect(weightBoxes[0].value).toBe('');           // empty, not "RPE 8"
});

test('entering weight marks the set complete; changing RPE alone does not', () => {
  open();
  const doneToggles = () => screen.getAllByText((t, el) => el?.tagName === 'BUTTON' && (t === '○' || t === '✓'));
  expect(doneToggles().filter((b) => b.textContent === '✓')).toHaveLength(0);

  fireEvent.change(rpeBoxes()[0], { target: { value: '9' } });
  expect(doneToggles().filter((b) => b.textContent === '✓')).toHaveLength(0); // RPE alone: still not done

  fireEvent.change(screen.getAllByPlaceholderText('lbs')[0], { target: { value: '40' } });
  expect(doneToggles().filter((b) => b.textContent === '✓')).toHaveLength(1); // weight completes it
});

test('a weight-prescribed move keeps the simple two-box row', () => {
  open();
  expect(screen.getAllByPlaceholderText('95')).toHaveLength(1); // ex2 still shows its prescription
  expect(rpeBoxes().every((b) => b.title.includes('RPE 8'))).toBe(true); // no RPE box added for ex2
});
