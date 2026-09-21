import { activeNoteFlags, buildNoteFeed, highlightParts, scanNote } from './notes';

describe('scanning a note', () => {
  test.each([
    ['my shoulder hurt on the last set', 'pain'],
    ['knee hurts', 'pain'],
    ['sharp pain in my lower back', 'pain'],
    ['it was painful', 'pain'],
    ['old injury flared up', 'pain'],
    ['I think I injured my wrist', 'pain'],
    ['achy hamstring', 'pain'],
    ['tweaked my back', 'pain'],
    ['pulled something in my groin', 'pain'],
    ['felt a strain', 'pain'],
    ['ankle is swollen', 'pain'],
    ['fingers went numb', 'pain'],
    ['heard my knee popped', 'pain'],
    ['legs are sore from yesterday', 'sore'],
    ['a lot of soreness', 'sore'],
    ['Pain AND sore', 'pain'],                  // pain outranks soreness
  ])('"%s" → %s', (text, level) => expect(scanNote(text).level).toBe(level));

  test.each([
    'felt strong, hit 135 for 5',
    'pull-ups were hard today',                 // "pull" is an exercise, only "pulled" flags
    'painless, easy session',
    'sorority event after practice',
  ])('"%s" is not flagged', (text) => expect(scanNote(text).level).toBeNull());

  test('"no pain" still flags — a false alarm costs one tap', () => {
    expect(scanNote('no pain today').level).toBe('pain');
  });

  test('matched words come back for the UI', () => {
    expect(scanNote('Knee HURTS and my back is sore').terms).toEqual(['HURTS', 'sore']);
  });
});

test('highlightParts splits text around the flagged words', () => {
  expect(highlightParts('left knee hurts a bit')).toEqual([
    { text: 'left knee ', hit: false }, { text: 'hurts', hit: true }, { text: ' a bit', hit: false },
  ]);
  expect(highlightParts('all good')).toEqual([{ text: 'all good', hit: false }]);
});

describe('the notes feed', () => {
  const NOW = new Date('2026-09-21T12:00:00').getTime();
  const DAY = 86400000;
  const ATHLETES = [{ id: 'a1', name: 'Ann Adams', event: '8 Lane' }, { id: 'a2', name: 'Ben Brown', event: '7 Lane' }];
  const WORKOUTS = [
    { id: 'w1', title: 'Week 2 - Monday', date: '2026-09-14', blocks: [{ id: 'b1', name: 'Block 1' }, { id: 'b2', name: 'Cool Down' }] },
    { id: 'w2', title: 'Week 3 - Monday', date: '2026-09-21', blocks: [{ id: 'b3', name: 'Block 1' }] },
    { id: 'w0', title: 'Summer', date: '2026-07-06', blocks: [] },
  ];
  const LOGS = [
    { id: 1, athleteId: 'a1', workoutId: 'w1', loggedAt: NOW - 7 * DAY, note: 'Good session', blockNotes: { b1: '', b2: 'shoulder hurt on the stretch' } },
    { id: 2, athleteId: 'a2', workoutId: 'w1', loggedAt: NOW - 7 * DAY - 1000, note: 'legs sore', blockNotes: {} },
    { id: 3, athleteId: 'a1', workoutId: 'w2', loggedAt: NOW - DAY, note: 'quads sore', blockNotes: null },
    { id: 4, athleteId: 'a2', workoutId: 'w2', loggedAt: NOW - DAY, note: '', blockNotes: { b3: '  ' } },   // nothing written
    { id: 5, athleteId: 'a1', workoutId: 'w0', loggedAt: NOW - 70 * DAY, note: 'wrist pain', blockNotes: {} },  // summer
    { id: 6, athleteId: 'gone', workoutId: 'w1', loggedAt: NOW, note: 'pain', blockNotes: {} },             // not on roster
  ];
  const feed = (reviews = []) => buildNoteFeed(LOGS, WORKOUTS, ATHLETES, reviews, { now: NOW });
  const card = (f, id) => f.find((c) => c.log.id === id);

  test('one card per session with writing, newest first, block notes labelled by block', () => {
    const f = feed();
    expect(f.map((c) => c.log.id)).toEqual([3, 1, 2, 5]);
    expect(card(f, 1).entries.map((e) => [e.label, e.text])).toEqual([
      ['Session note', 'Good session'],
      ['Cool Down', 'shoulder hurt on the stretch'],   // the easy one to miss before the feed existed
    ]);
  });

  test('a pain note is an alert until the coach marks it addressed', () => {
    expect(card(feed(), 1)).toMatchObject({ level: 'pain', active: true, addressed: false });
    const reviewed = feed([{ log_id: 1, reviewed_logged_at: NOW - 7 * DAY, reviewed_at: '2026-09-15T10:00:00Z' }]);
    expect(card(reviewed, 1)).toMatchObject({ active: false, addressed: true });
  });

  test('a pain note never expires on its own', () => {
    const later = buildNoteFeed(LOGS, WORKOUTS, ATHLETES, [], { now: NOW + 60 * DAY });
    expect(card(later, 1).active).toBe(true);
  });

  test('if the athlete edits the notes after review, the alert comes back', () => {
    const stale = feed([{ log_id: 1, reviewed_logged_at: NOW - 8 * DAY, reviewed_at: '2026-09-13T10:00:00Z' }]);
    expect(card(stale, 1)).toMatchObject({ active: true, addressed: false });
  });

  test('soreness alerts for 7 days, then clears on its own', () => {
    const f = feed();
    expect(card(f, 3)).toMatchObject({ level: 'sore', active: true });     // 1 day old
    expect(card(f, 2)).toMatchObject({ level: 'sore', active: false });    // just past 7 days
  });

  test('soreness can also be marked addressed early', () => {
    expect(card(feed([{ log_id: 3, reviewed_logged_at: NOW - DAY, reviewed_at: 'x' }]), 3).active).toBe(false);
  });

  test('notes from before short course started show in the feed but never alert', () => {
    expect(card(feed(), 5)).toMatchObject({ level: 'pain', active: false });
  });

  test('live alerts list pain first, then soreness', () => {
    expect(activeNoteFlags(feed()).map((c) => c.log.id)).toEqual([1, 3]);
  });
});
