import { characters, type CharacterId } from "@/data/playground";

// Render the user's result locally. No image service or answer upload is needed.
export async function downloadCharacterCard(id: CharacterId): Promise<void> {
  const character = characters[id];
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1080; canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  const font = '"Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
  ctx.fillStyle = "#fff9ee"; ctx.fillRect(0, 0, 1080, 1080);
  ctx.fillStyle = character.color; ctx.beginPath(); ctx.arc(540, 380, 215, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#1a2744"; ctx.lineWidth = 3; ctx.setLineDash([9, 10]); ctx.strokeRect(36, 36, 1008, 1008); ctx.setLineDash([]);
  ctx.textAlign = "center"; ctx.fillStyle = "#1a2744";
  ctx.font = `600 25px ${font}`; ctx.fillText("HOJU COMPASS  /  잠깐, 호주 한 판", 540, 110);
  ctx.font = '170px "Segoe UI Emoji", "Apple Color Emoji", sans-serif'; ctx.fillText(character.emoji, 540, 440);
  ctx.font = `500 28px ${font}`; ctx.fillText("나의 호주 생활 캐릭터", 540, 645);
  ctx.font = `800 58px ${font}`; ctx.fillText(character.name, 540, 730);
  ctx.font = `600 35px ${font}`; ctx.fillText(character.title, 540, 815);
  ctx.font = `400 27px ${font}`; ctx.fillText(character.line, 540, 875);
  ctx.font = `400 23px ${font}`; ctx.fillText("재미로 보는 5문항 테스트 · hojucompass.com/play", 540, 984);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Image unavailable")), "image/png"));
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a"); link.href = url; link.download = `hoju-compass-${id}.png`;
    document.body.appendChild(link);
    try { link.click(); } finally { link.remove(); }
  } finally { window.setTimeout(() => URL.revokeObjectURL(url), 10000); }
}
