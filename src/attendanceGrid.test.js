import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { AttendanceTab } from './components/AttendanceTab';
import { attendanceCsv, attendanceGrid, computeSessions } from './helpers';

beforeAll(() => {
  window.matchMedia = () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });
});

const ATHLETES = [
  { id: 'a1', name: 'Ann Adams', event: '8 Lane', archived: false },
  { id: 'a2', name: 'Ben Brown', event: '7 Lane', archived: false },
  { id: 'a3', name: 'Cara Cole', event: '8 Lane', archived: false },   // never assigned
];
const WORKOUTS = [
  { id: 'w1', title: 'Week 1 - Mon', date: '2026-10-05', season: '26-27 Short Course', assignees: ['a1', 'a2'], blocks: [] },
  { id: 'w2', title: 'Week 1 - Wed', date: '2026-10-07', season: '26-27 Short Course', assignees: ['a1'], blocks: [] },
  { id: 'w3', title: 'Week 2 - Mon', date: '2026-10-12', season: '26-27 Short Course', assignees: ['a1', 'a2'], blocks: [] },
];
const LOGS = [
  { athleteId: 'a1', workoutId: 'w1' },
  { athleteId: 'a2', workoutId: 'w1' },
  { athleteId: 'a1', workoutId: 'w3' },
  // Ann skipped 10/07, Ben skipped 10/12, Ben was never assigned 10/07
];
const sessions = () => computeSessions(WORKOUTS, LOGS);

describe('the grid', () => {
  const g = () => attendanceGrid(sessions(), ATHLETES);

  test('dates run oldest to newest', () => {
    expect(g().dates).toEqual(['2026-10-05', '2026-10-07', '2026-10-12']);
  });

  test('logged, missed, and not-assigned are three different things', () => {
    const ann = g().rows.find((r) => r.athlete.name === 'Ann Adams');
    const ben = g().rows.find((r) => r.athlete.name === 'Ben Brown');
    expect(ann.cells).toEqual({ '2026-10-05': 'present', '2026-10-07': 'absent', '2026-10-12': 'present' });
    expect(ben.cells).toEqual({ '2026-10-05': 'present', '2026-10-07': null, '2026-10-12': 'absent' });
    expect(ben.assigned).toBe(2);                 // the day he wasn't assigned isn't held against him
    expect(ben.rate).toBe(0.5);
  });

  test('athletes with nothing assigned are left out', () => {
    expect(g().rows.map((r) => r.athlete.name)).toEqual(['Ann Adams', 'Ben Brown']);
  });
});

describe('the export text', () => {
  test('header, ticks, Xs, blanks and totals', () => {
    const lines = attendanceCsv(attendanceGrid(sessions(), ATHLETES)).split('\n');
    expect(lines[0]).toBe('Athlete,Group,2026-10-05,2026-10-07,2026-10-12,Attended,Assigned,Rate');
    expect(lines[1]).toBe('Ann Adams,8 Lane,✓,X,✓,2,3,67%');
    expect(lines[2]).toBe('Ben Brown,7 Lane,✓,,X,1,2,50%');
  });

  test('tab separator for pasting into a spreadsheet', () => {
    expect(attendanceCsv(attendanceGrid(sessions(), ATHLETES), { sep: '\t' }).split('\n')[1])
      .toBe('Ann Adams\t8 Lane\t✓\tX\t✓\t2\t3\t67%');
  });

  test('a name with a comma is quoted so the columns still line up', () => {
    const odd = [{ id: 'a1', name: 'Smith, Jr., Ann', event: '8 Lane' }];
    const line = attendanceCsv(attendanceGrid(sessions(), odd)).split('\n')[1];
    expect(line.startsWith('"Smith, Jr., Ann",8 Lane,')).toBe(true);
  });
});

describe('in the app', () => {
  const open = () => {
    render(<AttendanceTab athletes={ATHLETES} workouts={WORKOUTS} logs={LOGS} />);
    fireEvent.click(screen.getByText('Grid'));
  };
  const rows = () => screen.getAllByRole('row').slice(1).map((r) => within(r).getAllByRole('cell').map((c) => c.textContent));

  test('shows a tick, an X, and a dot for not-assigned', () => {
    open();
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Athlete', '10/5', '10/7', '10/12', 'Logged', 'Rate']);
    expect(rows()).toEqual([
      ['Ann Adams', '✓', 'X', '✓', '2/3', '67%'],
      ['Ben Brown', '✓', '·', 'X', '1/2', '50%'],
    ]);
  });

  test('the group filter carries into the grid and the export', () => {
    open();
    fireEvent.click(screen.getByText('7 Lane'));
    expect(rows()).toEqual([['Ben Brown', '✓', 'X', '1/2', '50%']]);   // 10/07 column drops out entirely
  });

  test('Download CSV builds a dated file', () => {
    const createObjectURL = jest.fn(() => 'blob:x');
    const revokeObjectURL = jest.fn();
    Object.defineProperty(window.URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true });
    const clicked = [];
    const realClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { clicked.push(this.download); };

    open();
    fireEvent.click(screen.getByText('Download CSV'));
    expect(createObjectURL).toHaveBeenCalled();
    expect(clicked[0]).toMatch(/^riptide-attendance-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(revokeObjectURL).toHaveBeenCalled();

    HTMLAnchorElement.prototype.click = realClick;
  });

  test('Copy puts the tab-separated grid on the clipboard', async () => {
    const writeText = jest.fn(async () => {});
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    open();
    fireEvent.click(screen.getByText('Copy for spreadsheet'));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(writeText.mock.calls[0][0]).toContain('Ann Adams\t8 Lane\t✓');
    expect(await screen.findByText(/Copied/)).toBeInTheDocument();
  });

  test('a blocked clipboard says to use the download instead', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('denied'); } }, configurable: true });
    open();
    fireEvent.click(screen.getByText('Copy for spreadsheet'));
    expect(await screen.findByText(/use Download CSV instead/)).toBeInTheDocument();
  });
});
