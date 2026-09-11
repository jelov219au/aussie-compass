export const letterTileWidth = 46;
export const letterTileGap = 8;

export function letterRowSizes(count: number, availableWidth: number) {
  if (count < 1) return [];
  const capacity = Math.max(1, Math.floor((availableWidth + letterTileGap) / (letterTileWidth + letterTileGap)));
  const rows = Math.ceil(count / capacity);
  const shortRow = Math.floor(count / rows);
  return Array.from({ length: rows }, (_, row) => shortRow + (row < count % rows ? 1 : 0));
}
