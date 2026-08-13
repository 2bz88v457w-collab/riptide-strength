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

describe('coach block instructions', () => {
  const withNote = {
    id: 'w2', title: 'Conditioning', date: '2026-09-09',
    blocks: [
      { id: 'b1', name: 'Block 1', note: 'AMRAP 10 min — log how many rounds you finished', exercises: [{ id: 'e1', name: 'Burpees', sets: '1', reps: '10', load: 'BW' }] },
      { id: 'b2', name: 'Cool Down', exercises: [{ id: 'e2', name: 'Toe Touch', sets: '1', reps: '10', load: 'BW' }] },
    ],
  };
  const openIt = () => render(
    <LogModal workout={withNote} athleteId="a1" existingLog={null} allLogs={[]} allWorkouts={[withNote]}
      progressions={[]} onConsumeProgressions={() => {}} onSave={() => {}} onClose={() => {}} />
  );

  test('the instruction is shown to the athlete while logging', () => {
    openIt();
    expect(screen.getByText('AMRAP 10 min — log how many rounds you finished')).toBeInTheDocument();
  });

  test('a block with an instruction invites an answer; one without keeps the plain prompt', () => {
    openIt();
    expect(screen.getByPlaceholderText('Your answer / notes for Block 1…')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Notes for Cool Down…')).toBeInTheDocument();
  });
});

describe('adding and removing sets while logging (AMRAP rounds)', () => {
  const amrap = {
    id: 'w3', title: 'Conditioning', date: '2026-09-09',
    blocks: [{ id: 'b1', name: 'Block 1', note: 'AMRAP 10 min — add a set for each round', openSets: true, exercises: [
      { id: 'e1', name: 'Burpees', sets: '2', reps: '10', load: 'RPE 8' },
    ] }],
  };
  const openIt = () => render(
    <LogModal workout={amrap} athleteId="a1" existingLog={null} allLogs={[]} allWorkouts={[amrap]}
      progressions={[]} onConsumeProgressions={() => {}} onSave={() => {}} onClose={() => {}} />
  );
  const setRows = () => screen.getAllByPlaceholderText('10');   // one reps box per set row

  test('starts at the prescribed number of sets', () => {
    openIt();
    expect(setRows()).toHaveLength(2);
  });

  test('+ Set appends a round, carrying the prescribed RPE', () => {
    openIt();
    fireEvent.click(screen.getByText('+ Set'));
    fireEvent.click(screen.getByText('+ Set'));
    expect(setRows()).toHaveLength(4);                                  // logged 4 rounds
    const rpeBoxes = screen.getAllByTitle(/Coach prescribed RPE/);
    expect(rpeBoxes).toHaveLength(4);
    expect(rpeBoxes[3].value).toBe('8');                                // new rows keep the prescription
  });

  test('− removes the last set, and asks first when it holds data', () => {
    openIt();
    fireEvent.click(screen.getByText('+ Set'));
    expect(setRows()).toHaveLength(3);

    fireEvent.click(screen.getByText('−'));                             // empty row goes quietly
    expect(setRows()).toHaveLength(2);

    fireEvent.change(setRows()[1], { target: { value: '9' } });
    window.confirm = () => false;
    fireEvent.click(screen.getByText('−'));
    expect(setRows()).toHaveLength(2);                                  // cancelled, kept

    window.confirm = () => true;
    fireEvent.click(screen.getByText('−'));
    expect(setRows()).toHaveLength(1);
  });

  test('the last remaining set cannot be removed', () => {
    openIt();
    window.confirm = () => true;
    fireEvent.click(screen.getByText('−'));
    expect(setRows()).toHaveLength(1);
    expect(screen.queryByText('−')).toBeNull();                         // control disappears at one set
  });
});

test('blocks without the toggle keep a fixed set count — no + Set control', () => {
  const fixed = {
    id: 'w4', title: 'Strength', date: '2026-09-09',
    blocks: [{ id: 'b1', name: 'Block 1', exercises: [{ id: 'e1', name: 'Back Squat', sets: '3', reps: '5', load: '95' }] }],
  };
  render(
    <LogModal workout={fixed} athleteId="a1" existingLog={null} allLogs={[]} allWorkouts={[fixed]}
      progressions={[]} onConsumeProgressions={() => {}} onSave={() => {}} onClose={() => {}} />
  );
  expect(screen.queryByText('+ Set')).toBeNull();
  expect(screen.getAllByPlaceholderText('5')).toHaveLength(3); // still the prescribed three
});
