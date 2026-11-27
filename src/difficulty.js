// Ashen Vow — campaign difficulty profiles.
// Pure data so the core simulation, settings UI, and Node tests share one source.
export const DIFFICULTY_VERSION = 1;

export const DIFFICULTIES = [
  {
    id: 'story', name: 'Story Mode', localName: 'Mode Cerita', tag: 'Relaxed',
    desc: 'Fokus pada eksplorasi dan cerita; tekanan musuh rendah dan pemulihan longgar.',
    enemyDamage: 0.5, enemyHp: 0.68, enemySpeed: 0.82, detection: 0.72, attackRate: 0.74,
    reaction: 1.32, aggression: 0.65, bossDamage: 0.52, bossHp: 0.7, bossPatterns: 'reduced',
    recovery: 1.6, resources: 1.5, hazards: 0.52, elite: 0.65, reward: 0.85,
    tutorial: true, unlock: 'always', phaseGrace: 0.2,
  },
  {
    id: 'easy', name: 'Easy', localName: 'Mudah', tag: 'Forgiving',
    desc: 'Kerusakan musuh lebih rendah dan sumber pemulihan lebih banyak; mekanik bos tetap utuh.',
    enemyDamage: 0.7, enemyHp: 0.82, enemySpeed: 0.92, detection: 0.86, attackRate: 0.86,
    reaction: 1.18, aggression: 0.82, bossDamage: 0.72, bossHp: 0.85, bossPatterns: 'standard',
    recovery: 1.35, resources: 1.2, hazards: 0.72, elite: 0.82, reward: 0.95,
    tutorial: true, unlock: 'always', phaseGrace: 0.14,
  },
  {
    id: 'normal', name: 'Normal', localName: 'Normal', tag: 'Recommended',
    desc: 'Keseimbangan yang dimaksudkan: perilaku musuh, mekanik bos, hadiah, dan progresi standar.',
    enemyDamage: 1, enemyHp: 1, enemySpeed: 1, detection: 1, attackRate: 1,
    reaction: 1, aggression: 1, bossDamage: 1, bossHp: 1, bossPatterns: 'standard',
    recovery: 1, resources: 1.05, hazards: 0.95, elite: 1, reward: 1,
    tutorial: true, unlock: 'always', phaseGrace: 0.1,
  },
  {
    id: 'hard', name: 'Hard', localName: 'Sulit', tag: 'Demanding',
    desc: 'Musuh lebih agresif, pola serangan lebih maju, jendela pemulihan lebih sempit, elite lebih kuat.',
    enemyDamage: 1.18, enemyHp: 1.14, enemySpeed: 1.06, detection: 1.12, attackRate: 1.14,
    reaction: 0.9, aggression: 1.18, bossDamage: 1.16, bossHp: 1.12, bossPatterns: 'advanced',
    recovery: 0.88, resources: 0.95, hazards: 1.12, elite: 1.22, reward: 1.18,
    tutorial: false, unlock: 'always', phaseGrace: 0.07,
  },
  {
    id: 'nightmare', name: 'Nightmare', localName: 'Mimpi Buruk', tag: 'Advanced',
    desc: 'Kombinasi musuh lebih kompleks, bos memakai mekanik tambahan, dan hadiah tantangan khusus.',
    enemyDamage: 1.38, enemyHp: 1.28, enemySpeed: 1.14, detection: 1.24, attackRate: 1.26,
    reaction: 0.82, aggression: 1.36, bossDamage: 1.35, bossHp: 1.24, bossPatterns: 'full',
    recovery: 0.78, resources: 0.85, hazards: 1.28, elite: 1.42, reward: 1.35,
    tutorial: false, unlock: 'campaign', phaseGrace: 0.05, challenge: true,
  },
  {
    id: 'abyssal', name: 'Abyssal', localName: 'Abisal', tag: 'Endgame challenge',
    desc: 'Tantangan akhir untuk pemain berpengalaman: bos agresif, modifier tambahan, kosmetik eksklusif.',
    enemyDamage: 1.62, enemyHp: 1.45, enemySpeed: 1.22, detection: 1.4, attackRate: 1.38,
    reaction: 0.72, aggression: 1.56, bossDamage: 1.58, bossHp: 1.4, bossPatterns: 'abyssal',
    recovery: 0.68, resources: 0.75, hazards: 1.45, elite: 1.68, reward: 1.6,
    tutorial: false, unlock: 'campaign', phaseGrace: 0.035, challenge: true,
  },
];

export const DIFFICULTY_BY_ID = Object.fromEntries(DIFFICULTIES.map((entry) => [entry.id, entry]));
export const DIFFICULTY_IDS = DIFFICULTIES.map((entry) => entry.id);
export const HIGH_DIFFICULTIES = ['nightmare', 'abyssal'];

export function difficultyConfig(id) {
  return DIFFICULTY_BY_ID[id] || DIFFICULTY_BY_ID.normal;
}

export function difficultyUnlocked(id, progress = {}) {
  const config = difficultyConfig(id);
  if (config.unlock === 'always') return true;
  const cleared = (progress.cleared || []).filter(Boolean).length;
  const eclipse = progress.eclipse?.bosses ? Object.keys(progress.eclipse.bosses).length : 0;
  return cleared >= 3 || eclipse > 0 || Boolean(progress.campaignComplete);
}

export function difficultyWarning(id) {
  const config = difficultyConfig(id);
  if (!config.challenge) return '';
  return `${config.name} mengaktifkan pola bos lanjutan dan hadiah tantangan. Progres kampanye tidak direset, tetapi hadiah cerita biasa dapat berbeda.`;
}

export function describeDifficulty(id) {
  const config = difficultyConfig(id);
  return `${config.name} · damage ×${config.enemyDamage.toFixed(2)} · HP musuh ×${config.enemyHp.toFixed(2)} · deteksi ×${config.detection.toFixed(2)} · agresi ×${config.aggression.toFixed(2)}`;
}
