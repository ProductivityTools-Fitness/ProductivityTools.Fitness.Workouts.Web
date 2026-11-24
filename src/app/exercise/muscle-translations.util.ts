export const MUSCLE_TRANSLATIONS_PL: Record<string, string> = {
  abductors: 'odwodziciele uda',
  abs: 'mięśnie brzucha',
  adductors: 'przywodziciele uda',
  back: 'plecy',
  biceps: 'biceps / dwugłowe ramienia',
  calves: 'łydki',
  'cardiovascular system': 'układ krążenia / kardio',
  chest: 'klatka piersiowa',
  core: 'mięśnie głębokie tułowia',
  delts: 'barki / naramienne',
  forearms: 'przedramiona',
  glutes: 'pośladki',
  hamstrings: 'dwugłowe uda',
  'hip flexors': 'zginacze bioder',
  lats: 'najszerszy grzbietu',
  'levator scapulae': 'dźwigacz łopatki',
  'lower back': 'dolna część pleców',
  neck: 'szyja',
  obliques: 'skośne brzucha',
  pectorals: 'klatka piersiowa',
  quads: 'czworogłowe uda',
  rhomboids: 'mięśnie równoległoboczne',
  'serratus anterior': 'zębaty przedni',
  shins: 'piszczele',
  shoulders: 'barki',
  spine: 'prostowniki grzbietu',
  traps: 'kaptury / czworoboczny',
  triceps: 'triceps / trójgłowe ramienia',
  'upper back': 'górna część pleców',
};

export function formatMuscleLabel(muscle: string): string {
  const trimmed = muscle.trim();
  const translation = MUSCLE_TRANSLATIONS_PL[trimmed.toLowerCase()];
  return translation ? `${trimmed} (${translation})` : trimmed;
}
