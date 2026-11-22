// Update XV archive performance measurements (Node, no browser).
import { performance } from 'node:perf_hooks';
import { ArchiveController } from '../src/archive.js';
import { ARCHIVE_STAGES } from '../src/archive_data.js';
import { GhostIndex, defaultVeilSave } from '../src/veil.js';

const index = new GhostIndex({});
const veil = {
  save: { ...defaultVeilSave(), campaign: { ...defaultVeilSave().campaign, completedStages: ARCHIVE_STAGES.slice(0, 35).map((s) => s.id), bossClears: ['pale_mayor'] } },
  index,
};
const eternal = { save: { campaign: { unlocked: true, completedStages: [], bossClears: [] }, workshop: { tiers: {}, purchased: [], loadout: [] } } };
const archive = new ArchiveController({ veil, eternal, index });

function measure(label, iterations, fn) {
  for (let i = 0; i < Math.min(iterations, 50); i += 1) fn(i);
  const start = performance.now();
  for (let i = 0; i < iterations; i += 1) fn(i);
  const ms = performance.now() - start;
  console.log(`${label}: ${ms.toFixed(2)} ms total · ${(ms / iterations * 1000).toFixed(1)} µs/op · ${iterations} ops`);
}

measure('stage status (65 stages)', 2000, () => ARCHIVE_STAGES.forEach((s) => archive.stageStatus(s.id)));
measure('Level Checker one stage', 1000, () => archive.checkStage('vesper_hollow_1'));
measure('Level Checker one chapter', 300, () => archive.checkChapter('vesper_hollow'));
measure('Ghost Index query (72 records)', 1000, () => archive.ghostQuery({ missing: true }));
measure('Jumpscare query (30 records)', 1000, () => archive.jumpscareQuery({ category: 'audio' }));
measure('Stage preview generation', 1000, () => archive.preview('vesper_hollow_3'));
