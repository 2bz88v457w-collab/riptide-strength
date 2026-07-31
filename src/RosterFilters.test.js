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
