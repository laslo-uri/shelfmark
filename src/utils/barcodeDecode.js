const EAN_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];

async function getBarcodeDetector() {
  if (typeof window === 'undefined' || !('BarcodeDetector' in window)) return null;
  try {
    const supported = await window.BarcodeDetector.getSupportedFormats();
    const formats = EAN_FORMATS.filter((f) => supported.includes(f));
    if (formats.length === 0) return null;
    return new window.BarcodeDetector({ formats });
  } catch {
    return null;
  }
}

function frameToCanvas(video) {
  const canvas = document.createElement('canvas');
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return null;
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(video, 0, 0, w, h);
  return canvas;
}

export async function decodeBarcodeFromVideo(video) {
  const canvas = frameToCanvas(video);
  if (!canvas) return null;

  const detector = await getBarcodeDetector();
  if (detector) {
    try {
      const barcodes = await detector.detect(canvas);
      if (barcodes.length > 0) return barcodes[0].rawValue;
    } catch {
      /* try zxing */
    }
  }

  const { BrowserMultiFormatReader } = await import('@zxing/browser');
  const reader = new BrowserMultiFormatReader();
  try {
    const result = await reader.decodeFromImageElement(canvas);
    return result?.getText?.() ?? null;
  } catch {
    return null;
  } finally {
    reader.reset();
  }
}
