import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SAVE_SLOT_COUNT,
  SAVE_AREAS,
  SAVE_DEBOUNCE_MS,
  SAVE_UNDO_MS,
  ACTIVE_SLOT_KEY,
  GLOBAL_KEYS,
  createSaveStore,
  memoryStorage,
  slotKey,
  backupKey,
  checksum,
  clampSlot,
  areaForLegacyKey,
} from '../src/save.js';

function fakeClock(start = 1_000_000) {
  let t = start;
  const timers = [];
  return {
    now: () => t,
    setTimer: (fn, ms) => { const id = timers.length; timers.push({ fn, at: t + ms, done: false }); return id; },
    clearTimer: (id) => { if (timers[id]) timers[id].done = true; },
    advance(ms) {
      t += ms;
      for (const timer of timers) if (!timer.done && timer.at <= t) { timer.done = true; timer.fn(); }
    },
  };
}

test('three slots, one key scheme, and settings stay global', () => {
  assert.equal(SAVE_SLOT_COUNT, 3);
  assert.equal(slotKey(2, 'progress'), 'ashen-vow-slot2-progress-v1');
  assert.equal(backupKey('progress'), 'ashen-vow-slot-backup-progress-v1');
  assert.deepEqual(GLOBAL_KEYS, ['ashen-vow-settings-v1', 'ashen-vow-voice-v1']);
  assert.ok(!Object.values(SAVE_AREAS).includes('ashen-vow-settings-v1'), 'settings are never per slot');
  assert.equal(areaForLegacyKey('ashen-vow-3dhorror-v1'), 'horror3d');
  assert.equal(areaForLegacyKey('ashen-vow-settings-v1'), null);
  assert.equal(clampSlot(0), 1);
  assert.equal(clampSlot(3), 3);
  assert.equal(clampSlot('9'), 1);
});

test('legacy single-profile keys migrate into slot 1 and stay readable', () => {
  const storage = memoryStorage({
    'ashen-vow-progress-v1': '{"version":1,"cleared":[true]}',
    'ashen-vow-character-v1': '{"characterId":"karn"}',
    'ashen-vow-settings-v1': '{"audio":{}}',
  });
  const store = createSaveStore(storage);
  const result = store.migrateLegacy();
  assert.equal(result.migrated, true);
  assert.deepEqual(result.areas.sort(), ['character', 'progress']);
  assert.equal(store.read('progress'), '{"version":1,"cleared":[true]}');
  assert.equal(storage.getItem('ashen-vow-progress-v1'), '{"version":1,"cleared":[true]}', 'legacy key kept for one release');
  assert.equal(storage.getItem('ashen-vow-slot1-settings-v1'), null, 'settings are not copied into a slot');
  assert.equal(storage.getItem(ACTIVE_SLOT_KEY), '1');
  // A second boot does not overwrite slot 1 with stale legacy data.
  storage.setItem('ashen-vow-progress-v1', '{"stale":true}');
  assert.equal(createSaveStore(storage).migrateLegacy().migrated, false);
  assert.equal(store.read('progress'), '{"version":1,"cleared":[true]}');
});

test('writes are debounced to one per window per key and flush on demand', () => {
  const clock = fakeClock();
  const storage = memoryStorage();
  const store = createSaveStore(storage, clock);
  store.write('progress', 'a');
  assert.equal(storage.getItem(slotKey(1, 'progress')), 'a', 'first write is immediate');
  for (const v of ['b', 'c', 'd']) store.write('progress', v);
  assert.equal(storage.getItem(slotKey(1, 'progress')), 'a', 'burst is held');
  assert.equal(store.read('progress'), 'd', 'reads see the pending value');
  assert.equal(store.writeCount, 1);
  clock.advance(SAVE_DEBOUNCE_MS - 1);
  assert.equal(storage.getItem(slotKey(1, 'progress')), 'a');
  clock.advance(1);
  assert.equal(storage.getItem(slotKey(1, 'progress')), 'd');
  assert.equal(store.writeCount, 2, 'four writes became two');
  store.write('progress', 'e');
  store.write('character', 'x');
  assert.equal(store.pendingCount, 1, 'a different key is not held by another key');
  store.flush();
  assert.equal(storage.getItem(slotKey(1, 'progress')), 'e');
  assert.equal(store.pendingCount, 0);
});

test('switching slots isolates profiles and flushes the old one first', () => {
  const clock = fakeClock();
  const storage = memoryStorage();
  const store = createSaveStore(storage, clock);
  store.write('progress', 'one');
  store.write('progress', 'one-b');
  store.setActiveSlot(2);
  assert.equal(storage.getItem(slotKey(1, 'progress')), 'one-b', 'pending data flushed before the switch');
  assert.equal(store.read('progress'), null, 'slot 2 starts empty');
  store.write('progress', 'two');
  assert.equal(storage.getItem(ACTIVE_SLOT_KEY), '2');
  assert.equal(createSaveStore(storage).activeSlot, 2, 'active slot survives reload');
  assert.deepEqual(store.slots().map((s) => s.empty), [false, false, true]);
});

test('slot summaries read class, clears and furthest arc without throwing on junk', () => {
  const storage = memoryStorage({
    [slotKey(1, 'progress')]: JSON.stringify({ cleared: [true, true, true, true, true, true, true, true], stageTimes: { 'legacy:0': { best: 30, clears: 2 } }, fallen: { ascended: true } }),
    [slotKey(1, 'character')]: JSON.stringify({ characterId: 'lyna' }),
    [slotKey(2, 'progress')]: '{not json',
  });
  const store = createSaveStore(storage);
  const one = store.slotSummary(1);
  assert.equal(one.empty, false);
  assert.equal(one.characterId, 'lyna');
  assert.equal(one.cleared, 8);
  assert.equal(one.furthest, 'Arc II · The Fallen Ones');
  assert.equal(one.playSeconds, 60);
  const two = store.slotSummary(2);
  assert.equal(two.empty, false, 'a corrupt slot still holds data');
  assert.equal(two.cleared, 0, 'corrupt JSON reads as no progress, not as a crash');
  assert.equal(two.furthest, 'Belum mulai');
});

test('export/import round-trips, checks the checksum and runs sanitizers', () => {
  const clock = fakeClock();
  const storage = memoryStorage();
  const store = createSaveStore(storage, clock);
  store.write('progress', JSON.stringify({ version: 1, cleared: [true], extra: 'kept' }));
  store.write('hunter', JSON.stringify({ marks: 5 }));
  const file = store.exportSlot(1);
  const doc = JSON.parse(file);
  assert.equal(doc.format, 'ashen-vow-save');
  assert.equal(doc.slot, 1);
  assert.equal(doc.checksum, checksum(JSON.stringify([['progress', doc.areas.progress], ['hunter', doc.areas.hunter]])));

  const sanitizers = { hunter: (raw) => ({ marks: Math.min(99, Number(raw.marks) || 0), sanitized: true }) };
  const imported = store.importSlot(3, file, sanitizers);
  assert.equal(imported.ok, true);
  assert.equal(JSON.parse(storage.getItem(slotKey(3, 'hunter'))).sanitized, true, 'sanitizer ran on import');
  assert.equal(JSON.parse(storage.getItem(slotKey(3, 'progress'))).extra, 'kept');

  const tampered = JSON.parse(file);
  tampered.areas.hunter = JSON.stringify({ marks: 999999 });
  assert.deepEqual(store.importSlot(3, JSON.stringify(tampered)), { ok: false, error: 'checksum' });
  assert.equal(store.importSlot(3, 'nope').error, 'not-json');
  assert.equal(store.importSlot(3, JSON.stringify({ format: 'other' })).error, 'wrong-format');
  assert.equal(store.importSlot(3, JSON.stringify({ ...doc, version: 99 })).error, 'newer-version');
});

test('import over a slot keeps the previous contents as the backup', () => {
  const storage = memoryStorage({ [slotKey(2, 'progress')]: '"old"' });
  const store = createSaveStore(storage);
  const source = createSaveStore(memoryStorage({ [slotKey(1, 'progress')]: '"new"' }));
  assert.equal(store.importSlot(2, source.exportSlot(1)).ok, true);
  assert.equal(storage.getItem(slotKey(2, 'progress')), '"new"');
  assert.equal(storage.getItem(backupKey('progress')), '"old"');
});

test('delete keeps a 24-hour undo backup', () => {
  const clock = fakeClock();
  const storage = memoryStorage({ [slotKey(2, 'progress')]: '"keep me"', [slotKey(2, 'character')]: '"c"' });
  const store = createSaveStore(storage, clock);
  const deleted = store.deleteSlot(2);
  assert.equal(deleted.ok, true);
  assert.equal(deleted.undoUntil - clock.now(), SAVE_UNDO_MS);
  assert.equal(store.slotHasData(2), false);
  assert.equal(store.undoDelete().ok, true);
  assert.equal(storage.getItem(slotKey(2, 'progress')), '"keep me"');
  store.deleteSlot(2);
  clock.advance(SAVE_UNDO_MS + 1);
  assert.equal(store.undoDelete().error, 'expired');
});

test('a storage that throws never breaks the store', () => {
  const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('full'); }, removeItem() { throw new Error('denied'); } };
  const store = createSaveStore(broken, { debounceMs: 0 });
  assert.equal(store.read('progress'), null);
  store.write('progress', 'x');
  store.flush();
  assert.equal(store.slotSummary(1).empty, true);
  assert.throws(() => store.read('nope'), /unknown save area/);
});

test('lazy values serialize once per landed write and slot 1 mirrors the legacy key', () => {
  const clock = fakeClock();
  const storage = memoryStorage();
  const store = createSaveStore(storage, { ...clock, mirrorLegacy: true });
  let serialized = 0;
  const state = { n: 0 };
  const save = () => store.write('progress', () => { serialized += 1; return JSON.stringify(state); });
  save();
  for (let i = 1; i <= 50; i += 1) { state.n = i; save(); }
  assert.equal(serialized, 1, 'the burst is not serialized yet');
  clock.advance(SAVE_DEBOUNCE_MS);
  assert.equal(serialized, 2, '51 saves cost two JSON.stringify calls');
  assert.equal(JSON.parse(storage.getItem(slotKey(1, 'progress'))).n, 50);
  assert.equal(storage.getItem('ashen-vow-progress-v1'), storage.getItem(slotKey(1, 'progress')), 'slot 1 mirrors the legacy key');
  assert.ok(JSON.parse(storage.getItem(slotKey(1, 'meta'))).updatedAt > 0, 'progress writes stamp the slot');
  store.setActiveSlot(2);
  store.write('progress', '"two"');
  assert.notEqual(storage.getItem('ashen-vow-progress-v1'), '"two"', 'other slots never touch the legacy key');
});
