import { render, screen, fireEvent } from '@testing-library/react';
import { BuilderModal } from './components/BuilderModal';

// useIsNarrow needs matchMedia, which jsdom doesn't implement.
beforeAll(() => {
  window.matchMedia = () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });
});

const blockInputs = () => screen.getAllByPlaceholderText('Block name');
const renderBuilder = () => render(
  <BuilderModal athletes={[]} defaultSeason="" editWkt={null} onSave={() => {}} onClose={() => {}} />
);

test('starts with the five standard blocks', () => {
  renderBuilder();
  expect(blockInputs().map((i) => i.value)).toEqual(['Warm-up', 'Block 1', 'Block 2', 'Block 3', 'Cool Down']);
});

test('add block appends, continuing the Block N numbering', () => {
  renderBuilder();
  fireEvent.click(screen.getByText('+ Add block'));
  expect(blockInputs().map((i) => i.value)).toEqual(['Warm-up', 'Block 1', 'Block 2', 'Block 3', 'Cool Down', 'Block 4']);
  fireEvent.click(screen.getByText('+ Add block'));
  fireEvent.click(screen.getByText('+ Add block'));
  const names = blockInputs().map((i) => i.value);
  expect(names).toHaveLength(8);            // more blocks than there are colors
  expect(names.slice(-2)).toEqual(['Block 5', 'Block 6']);
});

test('blocks can be renamed freely', () => {
  renderBuilder();
  fireEvent.change(blockInputs()[0], { target: { value: 'Activation' } });
  fireEvent.change(blockInputs()[4], { target: { value: 'Recovery + Mobility' } });
  expect(blockInputs().map((i) => i.value)).toEqual(['Activation', 'Block 1', 'Block 2', 'Block 3', 'Recovery + Mobility']);
});

test('empty blocks remove without a prompt', () => {
  renderBuilder();
  fireEvent.click(screen.getAllByTitle('Remove block')[1]); // "Block 1", no exercises
  expect(blockInputs().map((i) => i.value)).toEqual(['Warm-up', 'Block 2', 'Block 3', 'Cool Down']);
});

test('blocks move up and down, and the ends are not movable past the edge', () => {
  renderBuilder();
  fireEvent.click(screen.getAllByTitle('Move block down')[0]);   // Warm-up ↓
  expect(blockInputs().map((i) => i.value)).toEqual(['Block 1', 'Warm-up', 'Block 2', 'Block 3', 'Cool Down']);
  fireEvent.click(screen.getAllByTitle('Move block up')[1]);     // Warm-up back ↑
  expect(blockInputs().map((i) => i.value)).toEqual(['Warm-up', 'Block 1', 'Block 2', 'Block 3', 'Cool Down']);

  expect(screen.getAllByTitle('Move block up')[0]).toBeDisabled();
  expect(screen.getAllByTitle('Move block down')[4]).toBeDisabled();
});

test('a block keeps its exercises when moved — the reason reorder exists', () => {
  renderBuilder();
  // Put "Back Squat" in the last block (Cool Down), then move that block to the top.
  fireEvent.click(screen.getAllByText('+ Add exercise')[4]);
  fireEvent.click(screen.getByText('Back Squat'));
  fireEvent.click(screen.getByText(/^Add 1 move$/));
  const exerciseValue = () => screen.getAllByPlaceholderText('Exercise').map((i) => i.value);
  expect(exerciseValue()).toEqual(['Back Squat']);

  for (let i = 4; i > 0; i--) fireEvent.click(screen.getAllByTitle('Move block up')[i]);
  expect(blockInputs().map((i) => i.value)).toEqual(['Cool Down', 'Warm-up', 'Block 1', 'Block 2', 'Block 3']);
  expect(exerciseValue()).toEqual(['Back Squat']);               // still exactly one, carried along
});

test('removing a block with exercises asks first and respects Cancel', () => {
  renderBuilder();
  // put one exercise into Block 1 via the move picker
  fireEvent.click(screen.getAllByText('+ Add exercise')[1]);
  fireEvent.click(screen.getByText('Back Squat'));
  fireEvent.click(screen.getByText(/^Add 1 move$/));

  window.confirm = () => false;                              // coach clicks Cancel
  fireEvent.click(screen.getAllByTitle('Remove block')[1]);
  expect(blockInputs()).toHaveLength(5);                     // nothing removed

  window.confirm = () => true;                               // coach confirms
  fireEvent.click(screen.getAllByTitle('Remove block')[1]);
  expect(blockInputs().map((i) => i.value)).toEqual(['Warm-up', 'Block 2', 'Block 3', 'Cool Down']);
});

test('blocks carry optional coach instructions that survive add and reorder', () => {
  renderBuilder();
  const noteBoxes = () => screen.getAllByPlaceholderText(/Optional instructions for this block/);
  expect(noteBoxes()).toHaveLength(5);                       // one per block, all empty
  expect(noteBoxes()[1].value).toBe('');

  fireEvent.change(noteBoxes()[1], { target: { value: 'AMRAP 10 min — log rounds finished' } });
  expect(noteBoxes()[1].value).toBe('AMRAP 10 min — log rounds finished');

  // The note belongs to the block, so it travels when the block moves.
  fireEvent.click(screen.getAllByTitle('Move block up')[1]);
  expect(blockInputs().map((i) => i.value)).toEqual(['Block 1', 'Warm-up', 'Block 2', 'Block 3', 'Cool Down']);
  expect(noteBoxes()[0].value).toBe('AMRAP 10 min — log rounds finished');
  expect(noteBoxes()[1].value).toBe('');

  fireEvent.click(screen.getByText('+ Add block'));
  expect(noteBoxes()).toHaveLength(6);
  expect(noteBoxes()[5].value).toBe('');                     // new blocks start with no note
});
