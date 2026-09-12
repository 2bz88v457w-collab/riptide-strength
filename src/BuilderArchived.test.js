import { render, screen, fireEvent } from '@testing-library/react';
import { CoachApp } from './components/CoachApp';
import { BuilderModal } from './components/BuilderModal';

beforeAll(() => {
  window.matchMedia = () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });
});

// Hana is a high school swimmer, archived for the fall — still in 8 Lane.
const ATHLETES = [
  { id: 'a1', name: 'Ann Adams', event: '8 Lane', archived: false },
  { id: 'a2', name: 'Cara Cole', event: '8 Lane', archived: false },
  { id: 'hs', name: 'Hana Hale', event: '8 Lane', archived: true },
];

const noop = () => {};
const openBuilder = () => {
  render(
    <CoachApp athletes={ATHLETES} workouts={[]} logs={[]} testScores={[]} progressions={[]} assessments={[]}
      onSaveAssessment={noop} onDeleteAssessment={noop} onSaveProgressions={noop} onDeleteProgression={noop}
      onSaveWorkout={noop} onDeleteWorkout={noop} onUpdateAthlete={noop} onDeleteAthlete={noop}
      onAddAthlete={noop} onSaveTestScore={noop} onBulkTag={noop} onLogout={noop} />
  );
  fireEvent.click(screen.getByText('+ New workout'));
};

test('archived swimmers are not offered in the builder', () => {
  openBuilder();
  expect(screen.getByText('Ann Adams')).toBeInTheDocument();
  expect(screen.queryByText('Hana Hale')).toBeNull();
});

test('a group button assigns only the active swimmers in that group', () => {
  openBuilder();
  const group = screen.getAllByText('8 Lane').map((el) => el.closest('button')).find(Boolean);
  expect(group).toHaveTextContent('2');                  // group size counts active swimmers only
  fireEvent.click(group);
  expect(screen.getByText('2 athletes')).toBeInTheDocument();
});

test('editing an older workout keeps an assignment to someone since archived', () => {
  const onSave = jest.fn();
  render(
    <BuilderModal athletes={ATHLETES.filter((a) => !a.archived)} defaultSeason=""
      editWkt={{ id: 'w1', title: 'Summer Week 3', date: '2026-07-06', assignees: ['a1', 'hs'], blocks: [] }}
      onSave={onSave} onClose={noop} />
  );
  fireEvent.click(screen.getByText(/^Save workout/));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ assignees: ['a1', 'hs'] }), 1);
});
