import { render, screen, fireEvent, within } from '@testing-library/react';
import { BuilderModal } from './components/BuilderModal';

beforeAll(() => {
  window.matchMedia = () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });
});

const WORKOUT = {
  id: 'w1', title: 'Strength - Week 1 - Monday', date: '2026-09-14', assignees: ['a1'],
  blocks: [{
    id: 'b1', name: 'Block 1', note: 'AMRAP 8 min', openSets: false,
    exercises: [
      { id: 'e1', name: 'Back Squat', sets: '3', reps: '8', load: 'RPE 8', note: '', pairId: null },
      { id: 'e2', name: 'Push-up', sets: '2', reps: '10', load: 'BW', note: '', pairId: null },
    ],
  }],
};

const openPreview = (onSave = jest.fn()) => {
  render(<BuilderModal athletes={[{ id: 'a1', name: 'Ann', event: '8 Lane' }]} defaultSeason="" editWkt={WORKOUT} onSave={onSave} onClose={() => {}} />);
  fireEvent.click(screen.getByText('Preview'));
  return onSave;
};
const previewPane = () => screen.getByRole('note').parentElement;

test('Preview opens the athlete logging screen for the workout being built', () => {
  openPreview();
  expect(screen.getByText(/Athlete preview/)).toBeInTheDocument();
  const pane = previewPane();
  expect(within(pane).getByText('AMRAP 8 min')).toBeInTheDocument();   // block instruction as swimmers see it
  expect(within(pane).getAllByText('Back Squat')).toHaveLength(1);
});

test('RPE in the load shows once in the header and as its own box per set, not in the weight box', () => {
  openPreview();
  const pane = previewPane();
  expect(within(pane).getAllByText(/@ RPE 8/)).toHaveLength(1);        // "3×8 @ RPE 8", once
  const rpeBoxes = within(pane).getAllByTitle(/Coach prescribed RPE 8/);
  expect(rpeBoxes).toHaveLength(3);                                    // one per set
  rpeBoxes.forEach((b) => expect(b.value).toBe('8'));
  expect(within(pane).getAllByPlaceholderText('lbs')).toHaveLength(3); // weight boxes stay free
});

test('the preview reflects unsaved edits in the builder', () => {
  render(<BuilderModal athletes={[]} defaultSeason="" editWkt={WORKOUT} onSave={() => {}} onClose={() => {}} />);
  fireEvent.change(screen.getAllByPlaceholderText('Block name')[0], { target: { value: 'Main Lift' } });
  fireEvent.click(screen.getByText('Preview'));
  expect(within(previewPane()).getByText('Main Lift')).toBeInTheDocument();
});

test('nothing can be saved from the preview', () => {
  const onSave = openPreview();
  const pane = previewPane();
  expect(within(pane).queryByText('Save session')).toBeNull();
  expect(within(pane).getByText('Preview — not saved')).toBeInTheDocument();
  fireEvent.change(within(pane).getAllByPlaceholderText('lbs')[0], { target: { value: '135' } });
  fireEvent.click(within(pane).getByText('Back to builder'));
  expect(screen.queryByText(/Athlete preview/)).toBeNull();
  expect(onSave).not.toHaveBeenCalled();                               // and the builder didn't save either
});
