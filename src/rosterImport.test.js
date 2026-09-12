import { buildImportActions, classifyRosterImport, isCloseName, parseRosterPaste, pinFromLastName } from './rosterImport';

// Made-up roster — shaped like the real cases from the Sept 2026 roster check.
const ROSTER = [
  { id: 'r1', name: 'Bryan Stone', event: '7 Lane', archived: false },   // sheet will say "Brian"
  { id: 'r2', name: 'Filip Norberg', event: '7 Lane', archived: false }, // sibling Freja is new; he moves lanes
  { id: 'r3', name: 'Ann Adams', event: '8 Lane', archived: false },
  { id: 'r4', name: 'Hana Hale', event: '8 Lane', archived: true },      // HS swimmer coming back
  { id: 'r5', name: 'Gus Grant', event: '8 Lane', archived: false },     // not on the new sheet
  { id: 'r6', name: 'Anh-na Le', event: '8 Lane', archived: false },
];

describe('PIN convention', () => {
  test('first four letters of the last name, in capitals', () => {
    expect(pinFromLastName('Kircher')).toBe('KIRC');
    expect(pinFromLastName('Deeb')).toBe('DEEB');
  });
  test('punctuation and spaces are ignored', () => {
    expect(pinFromLastName("O'Connell")).toBe('OCON');
    expect(pinFromLastName('Van Dyke')).toBe('VAND');
  });
  test('short last names give a short PIN rather than inventing letters', () => {
    expect(pinFromLastName('Le')).toBe('LE');
  });
});

describe('reading a paste', () => {
  test('tab-separated rows straight from Excel, header skipped', () => {
    const rows = parseRosterPaste('Pool Group\tFirst Name\tLast Name\n7 Lane\tIvan\tKircher\n\n8 Lane\tPascal\tZeruhn\n');
    expect(rows.map((r) => [r.group, r.name, r.pin])).toEqual([['7 Lane', 'Ivan Kircher', 'KIRC'], ['8 Lane', 'Pascal Zeruhn', 'ZERU']]);
  });
  test('typed commas work too, and a fourth column overrides the PIN', () => {
    const [r] = parseRosterPaste('7 Lane, Ivan, Kircher, 4821');
    expect(r).toMatchObject({ name: 'Ivan Kircher', pin: '4821', pinDerived: false });
  });
  test('two columns read as group and full name, keeping multi-word last names', () => {
    const [r] = parseRosterPaste('8 Lane, Maria de la Cruz');
    expect(r).toMatchObject({ first: 'Maria', last: 'de la Cruz', pin: 'DELA' });
  });
  test('rows missing a piece are reported with their line number, not dropped', () => {
    const rows = parseRosterPaste('7 Lane\tIvan\tKircher\n\tMia\n');
    expect(rows[1]).toMatchObject({ line: 2, error: expect.stringMatching(/pool group, first name, and last name/) });
  });
  test('a short PIN is flagged', () => {
    expect(parseRosterPaste('8 Lane\tAnh-na\tLe')[0].pinWarning).toBe('PIN is only 2 letters');
  });
});

describe('close names', () => {
  test.each([
    ['Brian Stone', 'Bryan Stone'],
    ['Ben Johnson', 'Benjamin Johnson'],
    ['Madeline Jennings', 'Madelyn Jennings'],
    ['Mia Pierskala', 'Mia Pierskalla'],
  ])('%s ≈ %s', (a, b) => expect(isCloseName(a, b)).toBe(true));

  test.each([
    ['Freja Norberg', 'Filip Norberg'],   // siblings
    ['Ivan Kircher', 'Vivian Kohler'],     // similar letters, different people
    ['Mia Barton', 'Mia Pierskalla'],      // same first name only
    ['Aiden Sahlin', 'Aidan Fitch'],
  ])('%s is not %s', (a, b) => expect(isCloseName(a, b)).toBe(false));
});

describe('checking a paste against the roster', () => {
  const paste = [
    '7 Lane\tBrian\tStone',     // close to Bryan
    '8 Lane\tFilip\tNorberg',   // exact, lane change
    '7 Lane\tFreja\tNorberg',   // new sibling
    '8 Lane\tAnn\tAdams',       // exact, unchanged
    '8 Lane\tHana\tHale',       // archived, returning
    '8 Lane\tanh-na\tle',       // exact despite case and hyphen
    '7 Lane\tIvan\tKircher',    // new
    '7 Lane\tIvan\tKircher',    // repeated
  ].join('\n');
  const { rows, untouched } = classifyRosterImport(parseRosterPaste(paste), ROSTER);

  test('each row gets the right status', () => {
    expect(rows.map((r) => [r.name, r.status])).toEqual([
      ['Brian Stone', 'close'],
      ['Filip Norberg', 'move'],
      ['Freja Norberg', 'new'],
      ['Ann Adams', 'unchanged'],
      ['Hana Hale', 'unarchive'],
      ['anh-na le', 'unchanged'],
      ['Ivan Kircher', 'new'],
      ['Ivan Kircher', 'duplicate'],
    ]);
    expect(rows[0].matches.map((m) => m.name)).toEqual(['Bryan Stone']);
  });

  test('active swimmers missing from the paste are listed and left alone', () => {
    expect(untouched.map((a) => a.name)).toEqual(['Gus Grant']);   // Bryan counts as matched; archived Hana is not listed
  });

  test('defaults: add new, apply moves and unarchives, hold close matches', () => {
    let n = 0;
    const actions = buildImportActions(rows, {}, () => `new${++n}`);
    expect(actions).toEqual([
      { kind: 'update', row: 1, athlete: { ...ROSTER[1], event: '8 Lane' } },
      { kind: 'create', row: 2, athlete: { id: 'new1', name: 'Freja Norberg', event: '7 Lane' }, pin: 'NORB' },
      { kind: 'update', row: 4, athlete: { ...ROSTER[3], event: '8 Lane', archived: false } },
      { kind: 'create', row: 6, athlete: { id: 'new2', name: 'Ivan Kircher', event: '7 Lane' }, pin: 'KIRC' },
    ]);
  });

  test('a close match can be resolved as a rename, which keeps the existing swimmer', () => {
    const actions = buildImportActions(rows, { 0: 'rename:r1' }, () => 'x');
    expect(actions[0]).toEqual({ kind: 'update', row: 0, athlete: { ...ROSTER[0], name: 'Brian Stone', event: '7 Lane' } });
  });

  test('or added as a genuinely different swimmer', () => {
    const actions = buildImportActions(rows, { 0: 'add' }, () => 'x');
    expect(actions[0]).toMatchObject({ kind: 'create', athlete: { name: 'Brian Stone' }, pin: 'STON' });
  });

  test('unticking a row skips it', () => {
    const actions = buildImportActions(rows, { 2: 'skip', 6: 'skip' }, () => 'x');
    expect(actions.filter((a) => a.kind === 'create')).toEqual([]);
  });
});
