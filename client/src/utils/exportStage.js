// Always restore the preview, including when CORS or an unloaded asset makes
// Konva throw during export.
export function exportStage(stage, { width, height, hiddenNodes = [], ...options }) {
  const scale = stage.scale();
  const size = stage.size();
  const visibility = hiddenNodes.filter(Boolean).map(node => [node, node.visible()]);
  try {
    visibility.forEach(([node]) => node.visible(false));
    stage.scale({ x: 1, y: 1 });
    stage.size({ width, height });
    stage.batchDraw();
    return stage.toDataURL({ x: 0, y: 0, width, height, pixelRatio: 2, mimeType: 'image/jpeg', quality: 0.95, ...options });
  } finally {
    stage.scale(scale);
    stage.size(size);
    visibility.forEach(([node, visible]) => node.visible(visible));
    stage.batchDraw();
  }
}
