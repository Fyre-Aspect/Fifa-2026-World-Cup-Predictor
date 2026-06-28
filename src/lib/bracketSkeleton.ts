/**
 * The official FIFA 2026 knockout skeleton, shared by the projected seeding and
 * the "official" (positions-only) bracket view.
 *
 * Round of 32, matches 73–88 in canonical order. Slot codes: `1x` = winner of
 * group x, `2x` = runner-up of group x, `3` = one of the eight best third-placed
 * teams. The pairings are fixed by FIFA — there is no redraw — so this is the
 * real shape of the bracket, independent of which teams end up in each slot.
 */
export const R32_POSITIONS: ReadonlyArray<readonly [string, string]> = [
  ['2A', '2B'], // 73
  ['1E', '3'], //  74
  ['1F', '2C'], // 75
  ['1C', '2F'], // 76
  ['1I', '3'], //  77
  ['2E', '2I'], // 78
  ['1A', '3'], //  79
  ['1L', '3'], //  80
  ['1D', '3'], //  81
  ['1G', '3'], //  82
  ['2K', '2L'], // 83
  ['1H', '2J'], // 84
  ['1B', '3'], //  85
  ['1J', '2H'], // 86
  ['1K', '3'], //  87
  ['2D', '2G'], // 88
];

/** Human-readable label for a slot code, e.g. `1E` → "Winner E", `3` → "3rd place". */
export function slotLabel(code: string): string {
  if (code === '3') return '3rd place';
  const group = code.slice(1);
  return code[0] === '1' ? `Winner ${group}` : `Runner-up ${group}`;
}
