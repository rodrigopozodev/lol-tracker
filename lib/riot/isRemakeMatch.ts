/**
 * Match v5 (participant): indica partida rehecha / finalización anticipada por remake.
 * Riot documenta el campo como early surrender; en la práctica aplica a rehechas de cola.
 */
export function isRemakeParticipant(
  p: { gameEndedInEarlySurrender?: boolean } | null | undefined
): boolean {
  return Boolean(p?.gameEndedInEarlySurrender);
}
