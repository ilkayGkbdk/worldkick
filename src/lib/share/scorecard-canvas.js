export function renderScorecard(canvas, { total, accuracy, exactCount, championName }) {
  const W = 1080, H = 1080;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#15151c'); g.addColorStop(1, '#0b0b10');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#ff2e63';
  ctx.font = '800 44px system-ui, sans-serif';
  ctx.fillText('WORLDKICK', 80, 150);
  ctx.fillStyle = '#9a9aa6';
  ctx.font = '600 30px system-ui, sans-serif';
  ctx.fillText('TAHMİN KARNESİ', 80, 200);

  ctx.fillStyle = '#f2f2f5';
  ctx.font = '800 240px system-ui, sans-serif';
  ctx.fillText(String(total), 76, 560);
  ctx.fillStyle = '#9a9aa6';
  ctx.font = '600 44px system-ui, sans-serif';
  ctx.fillText('PUAN', 88, 620);

  ctx.fillStyle = '#f2f2f5';
  ctx.font = '500 46px system-ui, sans-serif';
  ctx.fillText(`İsabet: %${accuracy}`, 80, 760);
  ctx.fillText(`Tam skor: ${exactCount}`, 80, 830);
  if (championName) ctx.fillText(`Şampiyon: ${championName}`, 80, 900);

  ctx.fillStyle = '#56565f';
  ctx.font = '500 32px system-ui, sans-serif';
  ctx.fillText('ilkaygkbdk.github.io/worldkick', 80, 1010);
}
