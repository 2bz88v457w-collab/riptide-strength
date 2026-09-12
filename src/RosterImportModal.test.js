import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { RosterImportModal } from './components/RosterImportModal';

beforeAll(() => {
  window.matchMedia = () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });
});

const ROSTER = [
  { id: 'r1', name: 'Bryan Stone', event: '7 Lane', archived: false },
  { id: 'r2', name: 'Ann Adams', event: '8 Lane', archived: false },
];
const PASTE = 'Pool Group\tFirst Name\tLast Name\n7 Lane\tBrian\tStone\n8 Lane\tAnn\tAdams\n7 Lane\tIvan\tKircher';

const openAndCheck = (onImport = jest.fn(async (actions) => actions.map(() => ({ ok: true })))) => {
  render(<RosterImportModal athletes={ROSTER} onImport={onImport} onClose={() => {}} />);
  fireEvent.change(screen.getByLabelText('Roster rows'), { target: { value: PASTE } });
  fireEvent.click(screen.getByText('Check against roster'));
  return onImport;
};
const row = (i) => screen.getByTestId(`import-row-${i}`);

test('preview shows every row with its status and the PIN for new swimmers', () => {
  openAndCheck();
  expect(within(row(0)).getByText('Close match')).toBeInTheDocument();
  expect(within(row(0)).getByText('Bryan Stone')).toBeInTheDocument();
  expect(within(row(1)).getByText('Already on roster')).toBeInTheDocument();
  expect(within(row(2)).getByText('KIRC')).toBeInTheDocument();
});

test('nothing is saved until Apply, and close matches are held back by default', async () => {
  const onImport = openAndCheck();
  expect(onImport).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Apply 1 change'));             // only Ivan
  await waitFor(() => expect(onImport).toHaveBeenCalledTimes(1));
  expect(onImport.mock.calls[0][0]).toEqual([
    expect.objectContaining({ kind: 'create', athlete: expect.objectContaining({ name: 'Ivan Kircher' }), pin: 'KIRC' }),
  ]);
});

test('choosing "same swimmer" renames the existing one instead of adding a twin', async () => {
  const onImport = openAndCheck();
  fireEvent.change(screen.getByLabelText('What to do with Brian Stone'), { target: { value: 'rename:r1' } });
  fireEvent.click(screen.getByText('Apply 2 changes'));
  await waitFor(() => expect(onImport).toHaveBeenCalled());
  expect(onImport.mock.calls[0][0][0]).toEqual({ kind: 'update', row: 0, athlete: { ...ROSTER[0], name: 'Brian Stone', event: '7 Lane' } });
});

test('failures are reported per row, not hidden', async () => {
  openAndCheck(async () => [{ ok: false, error: 'A user with this email address has already been registered' }]);
  fireEvent.click(screen.getByText('Apply 1 change'));
  expect(await within(row(2)).findByText(/already been registered/)).toBeInTheDocument();
  expect(screen.getByText(/0 applied · 1 failed/)).toBeInTheDocument();
});

test('editing the paste clears a stale preview', () => {
  openAndCheck();
  fireEvent.change(screen.getByLabelText('Roster rows'), { target: { value: '8 Lane\tPascal\tZeruhn' } });
  expect(screen.queryByTestId('import-row-0')).toBeNull();
});
