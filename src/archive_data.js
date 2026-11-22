// Update XV — Stage Archive & Supernatural Research Database: static catalogue.
// Every record is derived from the existing Arc IX / Arc X data. Names are never
// primary keys; stages, bosses, ghosts, tools and scare events all keep stable IDs.
import {
  VEIL_CHAPTERS, VEIL_STAGES, VEIL_BOSSES,
  GHOSTS, GHOSTS_BY_ID, GHOST_CLASSIFICATIONS, GHOST_RARITIES, EVIDENCE_TYPE_IDS,
} from './veil_data.js';
import {
  ETERNAL_CHAPTERS, ETERNAL_STAGES, ETERNAL_BOSSES,
  ETERNAL_EQUIPMENT,
} from './eternal_data.js';

// Re-export the shared entity catalogue for archive consumers without making
// them import two data modules just to render one index screen.
export { GHOSTS, GHOSTS_BY_ID, GHOST_CLASSIFICATIONS, GHOST_RARITIES };

export const ARCHIVE_SCHEMA_VERSION = 1;
export const ARCHIVE_SAVE_KEY = 'ashen-vow-archive-v1';
export const ARCHIVE_MAX_PREVIEWS = 4000;
export const ARCHIVE_DISCOVERY_STATES = ['undiscovered', 'rumored', 'encountered', 'identified', 'investigated', 'documented', 'mastered'];
export const ARCHIVE_STAGE_STATUSES = ['cleared', 'unlocked', 'uncleared', 'locked', 'perfect'];

const unique = (values) => [...new Set(values.filter(Boolean))];

// ---------------------------------------------------------------------------
// Arcs and chapters
// ---------------------------------------------------------------------------
export const ARCHIVE_ARCS = [
  { id: 'arc9', label: 'Arc IX — The Veil of the Forgotten', short: 'ARC IX', entry: 'veil' },
  { id: 'arc10', label: 'Arc X — The Eternal Night', short: 'ARC X', entry: 'eternal' },
];

export const ARCHIVE_CHAPTERS = [
  ...VEIL_CHAPTERS.map((chapter, index) => ({
    id: chapter.id, arcId: 'arc9', index, name: chapter.name, subtitle: chapter.subtitle,
    mechanic: chapter.mechanic, bossId: chapter.boss, secret: chapter.secret,
    palette: chapter.palette, zone: chapter.zone, stageCount: chapter.stages.length,
  })),
  ...ETERNAL_CHAPTERS.map((chapter, index) => ({
    id: chapter.id, arcId: 'arc10', index, name: chapter.name, subtitle: chapter.subtitle,
    mechanic: chapter.mechanic, bossId: chapter.boss, secret: chapter.secret,
    palette: chapter.palette, zone: chapter.zone, stageCount: chapter.stages.length,
  })),
];
export const ARCHIVE_CHAPTERS_BY_ID = Object.fromEntries(ARCHIVE_CHAPTERS.map((c) => [c.id, c]));
export const archiveChaptersForArc = (arcId) => ARCHIVE_CHAPTERS.filter((c) => c.arcId === arcId);

// ---------------------------------------------------------------------------
// Jumpscare Index — 38 events across 13 categories.
// ---------------------------------------------------------------------------
export const JUMPSCARE_CATEGORIES = [
  { id: 'entity_appearance', label: 'Entity Appearance', icon: '◉' },
  { id: 'environmental', label: 'Environmental', icon: '▣' },
  { id: 'audio', label: 'Audio', icon: '♪' },
  { id: 'reflection', label: 'Reflection', icon: '▤' },
  { id: 'pursuit', label: 'Pursuit', icon: '➤' },
  { id: 'disappearance', label: 'Disappearance', icon: '◌' },
  { id: 'temporal', label: 'Temporal', icon: '◷' },
  { id: 'boss_intro', label: 'Boss Introduction', icon: '♛' },
  { id: 'interactive', label: 'Interactive', icon: '✦' },
  { id: 'multiplayer', label: 'Multiplayer', icon: '⚭' },
  { id: 'visual_distortion', label: 'Visual Distortion', icon: '◈' },
  { id: 'spatial_shift', label: 'Spatial Shift', icon: '⤢' },
  { id: 'psychic', label: 'Psychic', icon: '◎' },
];

const scare = (id, name, category, ghostId, stageId, trigger, detection, tools, evidenceType, lore, extra = {}) => ({
  id, name, category, ghostId, stageId, trigger, detection,
  requiredTools: tools, evidenceType, lore,
  repeatable: true, antiJumpscare: 'atmospheric-alternative',
  reward: { archiveXp: 20 }, ...extra,
});

export const JUMPSCARE_EVENTS = [
  scare('js_distant_hallway', 'Figure at the End of the Hall', 'entity_appearance', 'hollow_walker', 'vesper_hollow_1', 'Look down the bell corridor after the first clue.', 'Visual line of sight for 2 seconds.', ['spirit_camera', 'spectral_detector'], 'visual', 'The figure never advances while observed.'),
  scare('js_doorway_visitor', 'Visitor in the Doorway', 'entity_appearance', 'window_watcher', 'vesper_hollow_2', 'Turn away from the widow house window.', 'Return within ten seconds.', ['spirit_camera'], 'visual', 'The shape uses the width of the doorframe as a scale.'),
  scare('js_bedside_patient', 'Patient at the Bedside', 'entity_appearance', 'empty_patient', 'mourning_hospital_1', 'Inspect the third waiting-room bed.', 'Approach without the emergency light.', ['spectral_detector', 'echo_recorder'], 'environmental', 'The chart lists a patient admitted after the building closed.'),
  scare('js_room_rearranged', 'The Room Rearranged', 'environmental', 'crooked_room', 'endless_rooms_3', 'Leave and re-enter the repeated room.', 'Compare the wall angles on return.', ['veil_lens', 'temporal_recorder'], 'environmental', 'The room preserves one impossible angle in every iteration.'),
  scare('js_lights_out', 'The Lights Go Out', 'environmental', 'corridor_shade', 'mourning_hospital_2', 'Pass under the broken emergency lamp.', 'Record the light level before and after.', ['resonance_scanner'], 'environmental', 'The darkness has a measurable edge.'),
  scare('js_cold_spot', 'Cold Spot in the Nave', 'environmental', 'sunken_choir', 'sunken_cathedral_2', 'Stand in the flooded choir stalls.', 'Measure the temperature drop.', ['phase_thermometer', 'echo_recorder'], 'environmental', 'The cold moves against the water current.'),
  scare('js_recorded_name', 'Your Name on the Recording', 'audio', 'pale_resident', 'vesper_hollow_3', 'Play the well recorder backwards.', 'Isolate the second voice.', ['echo_recorder', 'spirit_microphone'], 'audio', 'The voice pronounces a name the investigator has not spoken.'),
  scare('js_static_choir', 'Static Choir', 'audio', 'static_choir', 'blackwater_depths_3', 'Tune the signal room to an empty frequency.', 'Hold the frequency for six seconds.', ['spirit_microphone', 'signal_relay'], 'audio', 'The choir answers only when the channel is empty.'),
  scare('js_bell_underwater', 'Bell Beneath the Water', 'audio', 'drowned_bell_apparition', 'sunken_cathedral_4', 'Ring the dry bell beside the flooded tower.', 'Capture both the strike and its underwater answer.', ['echo_recorder', 'spirit_microphone'], 'audio', 'The response arrives before the strike decays.'),
  scare('js_mirror_delay', 'Mirror Delay', 'reflection', 'mirror_guest', 'house_beyond_time_4', 'Raise a hand in front of the attic mirror.', 'Compare the reflection after two seconds.', ['spirit_camera', 'memory_camera'], 'visual', 'The reflection keeps the previous pose.'),
  scare('js_wrong_reflection', 'Wrong Reflection', 'reflection', 'first_veil_walker', 'veil_citadel_5', 'Look into the black glass at the summit.', 'Confirm the reflection is not reversed.', ['veil_lens', 'spirit_camera'], 'visual', 'The reflected hall predates the citadel.'),
  scare('js_borrowed_face', 'Borrowed Face', 'reflection', 'mannequin_guest', 'carnival_lost_souls_2', 'Inspect the mirror maze after the lights dim.', 'Count the reflections twice.', ['memory_camera', 'veil_lens'], 'visual', 'One reflection has no matching body.'),
  scare('js_footsteps_behind', 'Footsteps Behind', 'pursuit', 'hound_of_night', 'midnight_city_1', 'Walk past the stopped clock twice.', 'Record the third set of footsteps.', ['footprint_scanner', 'echo_recorder'], 'trace', 'The tracks begin where the investigator first stopped.'),
  scare('js_corridor_chase', 'Corridor Chase', 'pursuit', 'hollow_walker', 'veil_citadel_1', 'Open the gate without closing the previous door.', 'Maintain line of sight for five seconds.', ['spectral_detector', 'spirit_camera'], 'behavior', 'The pursuer never crosses a threshold first.'),
  scare('js_endless_pursuit', 'The Endless Pursuit', 'pursuit', 'last_warden', 'blackwater_depths_2', 'Activate both pump valves.', 'Track the route through the flooded station.', ['footprint_scanner', 'temporal_recorder'], 'trace', 'The route repeats without consuming time.'),
  scare('js_vanishing_witness', 'Vanishing Witness', 'disappearance', 'lost_trail_spirit', 'blackwood_1', 'Ask the witness to point toward the camp.', 'Photograph the witness and the path.', ['spirit_camera', 'evidence_analyzer'], 'visual', 'Only the pointing hand appears in the photograph.'),
  scare('js_missing_object', 'The Missing Object', 'disappearance', 'false_door', 'endless_rooms_1', 'Mark the first door and turn around.', 'Compare the mark with the door count.', ['veil_lens', 'artifact_scanner'], 'trace', 'The door leaves a keyhole-shaped absence.'),
  scare('js_empty_room', 'The Empty Room', 'disappearance', 'unremembered', 'house_beyond_time_1', 'Sit in the repeated living room.', 'Record the room after the clock ticks.', ['memory_camera', 'temporal_recorder'], 'environmental', 'The furniture keeps the imprint of a guest who was never there.'),
  scare('js_repeated_minute', 'The Repeated Minute', 'temporal', 'clockbound_spirit', 'house_beyond_time_2', 'Set the handless clock to any hour.', 'Count the chimes against the journal clock.', ['temporal_recorder', 'echo_recorder'], 'trace', 'The same minute is logged twice with different events.'),
  scare('js_yesterday_echo', 'Yesterday Echo', 'temporal', 'memory_mote', 'endless_rooms_2', 'Cross the upside-down corridor.', 'Record the conversation from the other side.', ['temporal_recorder', 'spirit_microphone'], 'audio', 'The echo describes a future action as a memory.'),
  scare('js_clock_reverse', 'Clock Reverse', 'temporal', 'unstitched_hour', 'midnight_city_2', 'Wait at the last stop after midnight.', 'Compare the station clock with the recorder.', ['temporal_recorder', 'veil_compass'], 'trace', 'The second hand moves only while unobserved.'),
  scare('js_mayor_arrival', 'The Mayor Arrives', 'boss_intro', 'pale_courtier', 'vesper_hollow_5', 'Enter the buried town hall.', 'Record the bell before the boss appears.', ['spirit_camera', 'resonance_scanner'], 'boss_record', 'The mayor bows to an empty chair.'),
  scare('js_surgeon_entrance', 'The Surgeon Enters', 'boss_intro', 'silent_physician', 'mourning_hospital_5', 'Open the isolation room.', 'Capture the operating light turning on.', ['memory_camera', 'spectral_detector'], 'boss_record', 'The surgical tools are already warm.'),
  scare('js_first_forgotten', 'The First Forgotten', 'boss_intro', 'first_night', 'eternal_nightfall_5', 'Enter the threshold of dawn.', 'Record the name before it is erased.', ['oath_ledger', 'rune_reader', 'spirit_camera'], 'boss_record', 'The title card is written in a language older than the archive.'),
  scare('js_relic_touch', 'Touched Relic', 'interactive', 'altar_wraith', 'sunken_cathedral_3', 'Move the relic from the dry altar.', 'Compare the altar before and after.', ['artifact_scanner', 'veil_lens'], 'trace', 'The relic leaves a dry handprint on wet stone.'),
  scare('js_journal_page', 'The Journal Writes Back', 'interactive', 'veil_archivist', 'veil_citadel_3', 'Open the investigator journal in the lost archive.', 'Compare handwriting with the archived entries.', ['investigator_journal', 'evidence_analyzer'], 'document', 'A page records the investigator reading it.'),
  scare('js_bell_ring', 'Ring the Wrong Bell', 'interactive', 'tolling_sentinel', 'midnight_city_4', 'Ring the bell tower sequence out of order.', 'Capture the third strike.', ['spirit_microphone', 'echo_beacon'], 'audio', 'The sentinel answers the incorrect pattern.'),
  scare('js_shared_sighting', 'Shared Sighting', 'multiplayer', 'borrowed_voice', 'forgotten_kingdom_4', 'Compare two investigators’ camera feeds.', 'Confirm both saw the same figure.', ['signal_relay', 'ghost_archive_scanner'], 'witness', 'Each feed records a different face on the same body.'),
  scare('js_sync_whisper', 'Synchronized Whisper', 'multiplayer', 'borrowed_voice', 'blackwater_depths_4', 'Record the signal room with two investigators.', 'Align both audio tracks.', ['spirit_microphone', 'signal_relay'], 'audio', 'The whisper completes a sentence across both recordings.'),
  scare('js_team_reflection', 'Team Reflection', 'multiplayer', 'forgotten_twin', 'house_beyond_time_3', 'Gather the team in front of the locked bedroom mirror.', 'Count each investigator in the reflection.', ['memory_camera', 'signal_relay'], 'visual', 'The reflection includes one investigator who already left.'),
  // Update XVI — three new categories in The Unwritten Wing.
  scare('js_ink_bleed', 'Ink Bleed', 'visual_distortion', 'ink_scholar', 'unwritten_wing_1', 'Read the first blank page under the archive lamp.', 'Record the ink before the page dries.', ['memory_loom', 'spirit_camera'], 'visual', 'The ink forms a name before it is absorbed.'),
  scare('js_page_rewrite', 'The Page Rewrites Itself', 'visual_distortion', 'erased_reader', 'unwritten_wing_2', 'Turn away from the breathing shelf.', 'Compare two photographs of the same page.', ['memory_loom', 'evidence_analyzer'], 'document', 'The second photograph contains a paragraph that was never written.'),
  scare('js_margin_crawl', 'Margin Crawl', 'visual_distortion', 'margin_stalker', 'unwritten_wing_3', 'Follow the moving ink along the page edge.', 'Measure the margin after each step.', ['veil_lens', 'footprint_scanner'], 'trace', 'The margin narrows without the page moving.'),
  scare('js_corridor_stretch', 'Corridor Stretch', 'spatial_shift', 'margin_stalker', 'unwritten_wing_2', 'Walk the shelf aisle twice.', 'Compare the distance to the same shelf.', ['veil_compass', 'resonance_scanner'], 'environmental', 'The aisle adds one shelf each time it is crossed.'),
  scare('js_wrong_shelf', 'The Shelf That Was Not There', 'spatial_shift', 'blank_archivist', 'unwritten_wing_3', 'Ask the catalog for a missing volume.', 'Mark the shelf before opening it.', ['temporal_recorder', 'veil_lens'], 'trace', 'The shelf leaves a rectangular absence in the dust.'),
  scare('js_name_erased', 'Your Name, Erased', 'psychic', 'erased_reader', 'unwritten_wing_4', 'Read the list of erased investigators.', 'Check your own signature afterwards.', ['oath_ledger', 'memory_loom'], 'document', 'The signature remains, but the name above it does not.'),
  scare('js_shared_dream', 'Shared Dream', 'psychic', 'seventh_draft', 'unwritten_wing_5', 'Compare the team’s notes after the blank door closes.', 'Match the same dream detail in two records.', ['memory_loom', 'signal_relay'], 'witness', 'Each investigator remembers writing a different ending.'),
  scare('js_unwritten_boss', 'The Unwritten Arrives', 'boss_intro', 'unwritten_choir', 'unwritten_wing_5', 'Open the door with no page.', 'Record the silent title before it erases itself.', ['oath_ledger', 'rune_reader', 'memory_loom'], 'boss_record', 'The boss title is already crossed out in the archive.'),
];

export const JUMPSCARE_EVENT_IDS = JUMPSCARE_EVENTS.map((e) => e.id);
export const JUMPSCARE_EVENTS_BY_ID = Object.fromEntries(JUMPSCARE_EVENTS.map((e) => [e.id, e]));
export const JUMPSCARE_CATEGORY_IDS = JUMPSCARE_CATEGORIES.map((c) => c.id);

// ---------------------------------------------------------------------------
// Stages — 30 Arc IX and 40 Arc X records.
// ---------------------------------------------------------------------------
const stageRecord = (stage, arcId) => {
  const chapter = ARCHIVE_CHAPTERS_BY_ID[stage.chapter];
  const ghostIds = GHOSTS.filter((g) => g.chapter === stage.chapter).map((g) => g.id);
  const boss = (arcId === 'arc9' ? VEIL_BOSSES : ETERNAL_BOSSES).find((b) => b.chapterId === stage.chapter);
  return {
    id: stage.id,
    arcId,
    chapterId: stage.chapter,
    chapterName: stage.chapterName,
    name: stage.name,
    number: stage.number,
    index: stage.index,
    localIndex: stage.localIndex,
    room: stage.room,
    zone: stage.zone,
    objective: stage.objective,
    objectiveIds: [`main:${stage.id}`, `evidence:${stage.id}`, ...(stage.investigation ? [`investigation:${stage.id}`] : [])],
    enemyCount: stage.enemyCount,
    eliteCount: stage.eliteCount,
    archetypes: stage.archetypes,
    investigation: !!stage.investigation,
    secret: !!stage.secret,
    stageType: stage.stageType || 'standard',
    bossId: boss?.id || null,
    ghostIds,
    jumpscareEventIds: JUMPSCARE_EVENTS.filter((e) => e.stageId === stage.id).map((e) => e.id),
    collectibleIds: ghostIds.flatMap((id) => [0, 1, 2, 3].map((lore) => `${id}:lore:${lore + 1}`)),
    rewards: stage.reward,
    sanityDrain: stage.sanityDrain,
    threat: boss ? 'Extreme' : stage.investigation ? 'High' : stage.secret ? 'Moderate' : 'Low',
    previewAvailable: true,
    previewDataId: `preview:${stage.id}`,
    conditions: {
      zone: stage.zone, sanityDrain: stage.sanityDrain, investigation: !!stage.investigation,
      supernaturalActivity: stage.investigation || stage.secret ? 'High' : 'Low',
    },
    description: `${stage.name} berada di ${chapter?.name || stage.chapterName}. ${chapter?.subtitle || ''} ${stage.objective}.`,
  };
};

export const ARCHIVE_STAGES = [
  ...VEIL_STAGES.map((stage) => stageRecord(stage, 'arc9')),
  ...ETERNAL_STAGES.map((stage) => stageRecord(stage, 'arc10')),
];
export const ARCHIVE_STAGE_IDS = ARCHIVE_STAGES.map((s) => s.id);
export const ARCHIVE_STAGES_BY_ID = Object.fromEntries(ARCHIVE_STAGES.map((s) => [s.id, s]));
export const archiveStagesForChapter = (chapterId) => ARCHIVE_STAGES.filter((s) => s.chapterId === chapterId);
export const archiveStagesForArc = (arcId) => ARCHIVE_STAGES.filter((s) => s.arcId === arcId);

const bossRecord = (boss, arcId) => {
  const chapter = ARCHIVE_CHAPTERS_BY_ID[boss.chapterId];
  return {
    id: boss.id, arcId, chapterId: boss.chapterId, chapterName: chapter?.name || boss.chapterId,
    name: boss.name, title: boss.title, maxHp: boss.maxHp, maxPhases: boss.maxPhases,
    final: !!boss.final, reward: boss.reward,
    stageIds: ARCHIVE_STAGES.filter((s) => s.chapterId === boss.chapterId).map((s) => s.id),
  };
};

export const ARCHIVE_BOSSES = [
  ...VEIL_BOSSES.map((b) => bossRecord(b, 'arc9')),
  ...ETERNAL_BOSSES.map((b) => bossRecord(b, 'arc10')),
];
export const ARCHIVE_BOSS_IDS = ARCHIVE_BOSSES.map((b) => b.id);
export const ARCHIVE_BOSSES_BY_ID = Object.fromEntries(ARCHIVE_BOSSES.map((b) => [b.id, b]));

// ---------------------------------------------------------------------------
// Investigation tools — every Arc IX and Arc X tool, plus complete field kit.
// ---------------------------------------------------------------------------
const tool = (id, name, category, functions, extra = {}) => ({
  id, name, category, functions, upgradeMax: 5, essential: false, legacySource: null, ...extra,
});

export const ARCHIVE_TOOLS = [
  tool('spectral_detector', 'Spectral Detector', 'detection', ['Detect nearby supernatural signals', 'Locate hidden entities'], { essential: true, legacySource: 'veil' }),
  tool('spirit_camera', 'Spirit Camera', 'recording', ['Record visual evidence', 'Capture hidden manifestations'], { essential: true, legacySource: 'veil' }),
  tool('echo_recorder', 'Echo Recorder', 'audio', ['Record whispers and environmental sound', 'Preserve residual audio'], { legacySource: 'veil' }),
  tool('veil_lens', 'Veil Lens', 'veil', ['Reveal hidden traces and symbols', 'See through the veil layer'], { legacySource: 'veil' }),
  tool('rune_reader', 'Rune Reader', 'analysis', ['Interpret supernatural symbols', 'Translate ancient inscriptions'], { legacySource: 'eternal:rune_reader' }),
  tool('spirit_lantern', 'Spirit Lantern', 'exploration', ['Reveal certain entities safely', 'Illuminate evidence without startling'], { legacySource: 'eternal:portable_lantern' }),
  tool('resonance_scanner', 'Resonance Scanner', 'detection', ['Measure supernatural activity', 'Compare environmental resonance'], { essential: true, legacySource: 'eternal:resonance_scanner' }),
  tool('ancient_seal', 'Ancient Seal', 'containment', ['Secure specific containment objectives', 'Stabilize hostile manifestations'], { legacySource: 'eternal:ancient_seal' }),
  tool('echo_beacon', 'Echo Beacon', 'exploration', ['Mark an investigation location', 'Track recorded signals'], { legacySource: 'eternal:echo_beacon' }),
  tool('investigator_journal', 'Investigator Journal', 'archive', ['Store evidence and notes', 'Compile entity research records'], { essential: true, legacySource: 'veil' }),
  tool('veil_compass', 'Veil Compass', 'detection', ['Locate unusual supernatural activity', 'Point toward the nearest veil disturbance'], { legacySource: 'eternal:veil_compass' }),
  tool('spirit_microphone', 'Spirit Microphone', 'audio', ['Record entity-specific audio signatures', 'Isolate residual voices'], { legacySource: 'eternal:spirit_microphone' }),
  tool('memory_camera', 'Memory Camera', 'recording', ['Capture residual memories', 'Photograph past events'], { legacySource: 'eternal:memory_camera' }),
  tool('guardian_pendant', 'Guardian Pendant', 'protection', ['Provide temporary protection', 'Reduce veil exposure'], { legacySource: 'eternal:guardian_pendant' }),
  tool('portable_generator', 'Portable Generator', 'utility', ['Power investigation equipment', 'Extend field operation time'], { legacySource: 'eternal:portable_generator' }),
  tool('signal_relay', 'Signal Relay', 'utility', ['Extend detection coverage', 'Synchronize team evidence'], { legacySource: 'eternal:signal_relay' }),
  tool('spectral_trap', 'Spectral Trap', 'containment', ['Temporary containment for eligible entities', 'Hold a manifestation for documentation']),
  tool('ghost_archive_scanner', 'Ghost Archive Scanner', 'archive', ['Automatically categorize collected evidence', 'Compare records against the index']),
  tool('evidence_analyzer', 'Evidence Analyzer', 'analysis', ['Compare evidence against known records', 'Flag contradictory testimony']),
  tool('temporal_recorder', 'Temporal Recorder', 'recording', ['Record repeating environmental events', 'Compare two timelines']),
  tool('footprint_scanner', 'Footprint Scanner', 'analysis', ['Identify unusual movement traces', 'Reconstruct a pursuit route']),
  tool('artifact_scanner', 'Artifact Scanner', 'analysis', ['Examine cursed or supernatural objects', 'Detect residue on relics']),
  tool('phase_thermometer', 'Phase Thermometer', 'detection', ['Measure cold spots and phase changes', 'Detect temperature anomalies']),
  tool('ectoplasm_sampler', 'Ectoplasm Sampler', 'containment', ['Collect physical residue', 'Preserve a sample for analysis']),
  tool('oath_ledger', 'Oath Ledger', 'archive', ['Record names that resist erasure', 'Cross-check ancient vows']),
  tool('spectral_lens', 'Spectral Lens', 'investigation', ['See hidden evidence layers', 'Classify evidence in the field'], { legacySource: 'eternal:spectral_lens' }),
  tool('portable_lantern', 'Portable Lantern', 'exploration', ['Light dark rooms', 'Reveal hidden paths'], { legacySource: 'eternal:portable_lantern' }),
  // Update XVI — Unwritten Wing field kit.
  tool('resonance_anchor', 'Resonance Anchor', 'detection', ['Pin a stable signal in shifting space', 'Compare two locations across rewrites']),
  tool('memory_loom', 'Memory Loom', 'recording', ['Weave residual memories into a readable record', 'Preserve a page after it is erased']),
  tool('veil_divider', 'Veil Divider', 'containment', ['Partially contain an unwritten entity', 'Hold a page open for documentation']),
];
export const ARCHIVE_TOOL_IDS = ARCHIVE_TOOLS.map((t) => t.id);
export const ARCHIVE_TOOLS_BY_ID = Object.fromEntries(ARCHIVE_TOOLS.map((t) => [t.id, t]));
export const ARCHIVE_TOOL_CATEGORIES = unique(ARCHIVE_TOOLS.map((t) => t.category));

// ---------------------------------------------------------------------------
// Ghost-to-tool requirements and documentation methods
// ---------------------------------------------------------------------------
const TOOL_BY_CLASS = {
  wraith: ['spectral_detector', 'spirit_camera'],
  revenant: ['spectral_detector', 'spirit_camera'],
  apparition: ['spirit_camera', 'echo_recorder'],
  wisp: ['spirit_camera', 'resonance_scanner'],
  phantom: ['veil_lens', 'memory_camera'],
  mimic: ['veil_lens', 'evidence_analyzer'],
  shade: ['veil_lens', 'spectral_detector'],
  aberration: ['veil_lens', 'resonance_scanner'],
  lost_spirit: ['echo_recorder', 'investigator_journal'],
  spectral_beast: ['footprint_scanner', 'spirit_camera'],
  ancient_entity: ['rune_reader', 'resonance_scanner', 'ancient_seal'],
  primordial: ['oath_ledger', 'rune_reader', 'ancient_seal'],
};

const METHOD_BY_EVIDENCE = {
  visual: 'Visual documentation',
  audio: 'Audio documentation',
  environmental: 'Environmental investigation',
  document: 'Historical research',
  trace: 'Trace reconstruction',
  witness: 'Witness account collection',
  behavior: 'Behavioral observation',
  boss_record: 'Boss encounter record',
};

export const GHOST_TOOL_REQUIREMENTS = Object.fromEntries(GHOSTS.map((ghost) => {
  const required = unique(TOOL_BY_CLASS[ghost.classification] || ['spectral_detector', 'investigator_journal']);
  const optional = unique([
    'evidence_analyzer',
    ghost.evidence.includes('audio') ? 'spirit_microphone' : 'ghost_archive_scanner',
    ghost.rarity === 'mythic' || ghost.rarity === 'unknown' ? 'spectral_trap' : 'artifact_scanner',
    ghost.chapter === 'unwritten_wing' ? 'memory_loom' : '',
    ghost.chapter === 'unwritten_wing' ? 'resonance_anchor' : '',
    ['ancient_entity', 'primordial', 'aberration'].includes(ghost.classification) ? 'veil_divider' : '',
  ]).filter((id) => !required.includes(id));
  const methods = unique((ghost.requiredEvidence || ghost.evidence || []).map((type) => METHOD_BY_EVIDENCE[type]).filter(Boolean));
  return [ghost.id, {
    ghostId: ghost.id,
    required,
    optional,
    methods,
    containable: ['ancient_entity', 'primordial', 'aberration', 'mimic'].includes(ghost.classification),
    multiPlayer: ghost.classification === 'mimic' || ghost.rarity === 'mythic' || ghost.rarity === 'unknown',
    jumpscareRelated: JUMPSCARE_EVENTS.some((e) => e.ghostId === ghost.id),
  }];
}));

export const ARCHIVE_ACHIEVEMENTS = [
  { id: 'first_encounter', name: 'First Encounter', requirement: 'Encounter your first ghost', reward: 'Investigator badge', metric: 'encountered', target: 1 },
  { id: 'the_observer', name: 'The Observer', requirement: 'Document 10 entities', reward: 'Profile frame', metric: 'documented', target: 10 },
  { id: 'ghost_scholar', name: 'Ghost Scholar', requirement: 'Identify 25 entities', reward: 'Scholar title', metric: 'identified', target: 25 },
  { id: 'master_researcher', name: 'Master Researcher', requirement: 'Master 50 entities', reward: 'Special journal skin', metric: 'mastered', target: 50 },
  { id: 'complete_archive', name: 'The Complete Archive', requirement: 'Master all eligible entries', reward: 'Legendary archive decoration', metric: 'mastered', target: GHOSTS.length },
  { id: 'stage_explorer', name: 'Stage Explorer', requirement: 'Preview 20 stages', reward: 'Explorer emblem', metric: 'previews', target: 20 },
  { id: 'perfect_chapter', name: 'Perfect Chapter', requirement: 'Complete every record in one chapter', reward: 'Chapter trophy', metric: 'perfectChapters', target: 1 },
  { id: 'fearless_investigator', name: 'Fearless Investigator', requirement: 'Complete a set of investigations on Hard', reward: 'Exclusive cosmetic', metric: 'hardCases', target: 1 },
  { id: 'event_historian', name: 'Event Historian', requirement: 'Document 30 scare events', reward: 'Event journal skin', metric: 'documentedEvents', target: 30 },
  { id: 'master_collector', name: 'Master Collector', requirement: 'Complete every available tool collection', reward: 'Workshop decoration', metric: 'toolsOwned', target: ARCHIVE_TOOLS.length },
];
export const ARCHIVE_ACHIEVEMENT_IDS = ARCHIVE_ACHIEVEMENTS.map((a) => a.id);

export const ARCHIVE_LIMITS = {
  maxPreviewRecords: 2000,
  maxJumpscareRecords: JUMPSCARE_EVENTS.length,
  maxToolUpgrades: 5,
  maxNotes: 480,
  pageSize: 24,
};

export const ARCHIVE_DATA_STATS = {
  arcs: ARCHIVE_ARCS.length,
  chapters: ARCHIVE_CHAPTERS.length,
  stages: ARCHIVE_STAGES.length,
  bosses: ARCHIVE_BOSSES.length,
  ghosts: GHOSTS.length,
  classifications: GHOST_CLASSIFICATIONS.length,
  rarities: GHOST_RARITIES.length,
  evidenceTypes: EVIDENCE_TYPE_IDS.length,
  jumpscares: JUMPSCARE_EVENTS.length,
  jumpscareCategories: JUMPSCARE_CATEGORIES.length,
  tools: ARCHIVE_TOOLS.length,
  toolCategories: ARCHIVE_TOOL_CATEGORIES.length,
  achievements: ARCHIVE_ACHIEVEMENTS.length,
  eternalEquipment: ETERNAL_EQUIPMENT.length,
};
