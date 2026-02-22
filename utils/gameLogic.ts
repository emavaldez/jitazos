// utils/gameLogic.ts

export interface Song {
  id: string;
  year: number;
  name: string;
  artist: string;
}

/**
 * Valida si una canción está correctamente posicionada en una lista cronológica.
 * @param timeline Lista de canciones ya colocadas
 * @param newSong La canción que se intenta colocar
 * @param index El índice donde el usuario la soltó
 */
export const isValidPlacement = (
  timeline: Song[], 
  newSong: Song, 
  index: number
): boolean => {
  // Si la línea está vacía, cualquier posición es válida (primer turno)
  if (timeline.length === 0) return true;

  const prevSong = timeline[index - 1];
  const nextSong = timeline[index];

  // Regla: Año anterior <= Año actual <= Año siguiente
  const checkPrev = prevSong ? newSong.year >= prevSong.year : true;
  const checkNext = nextSong ? newSong.year <= nextSong.year : true;

  return checkPrev && checkNext;
};