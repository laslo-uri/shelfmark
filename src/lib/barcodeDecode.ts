const EAN_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];

async function getBarcodeDetector() {
  if (typeof window === "undefined" || !window.BarcodeDetector) return null;
  try {
    const supported = await window.BarcodeDetector.getSupportedFormats();
    const formats = EAN_FORMATS.filter((format) => supported.includes(format));
    if (!formats.length) return null;
    return new window.BarcodeDetector({ formats });
  } catch {
    return null;
  }
}

function frameToCanvas(video: HTMLVideoElement) {
  const canvas = document.createElement("canvas");
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return null;
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(video, 0, 0, width, height);
  return canvas;
}

export async function decodeBarcodeFromVideo(video: HTMLVideoElement): Promise<string | null> {
  const canvas = frameToCanvas(video);
  if (!canvas) return null;

  const detector = await getBarcodeDetector();
  if (detector) {
    try {
      const barcodes = await detector.detect(canvas);
      if (barcodes.length > 0) return barcodes[0]?.rawValue ?? null;
    } catch {
      /* try zxing */
    }
  }

  const { BrowserMultiFormatReader } = await import("@zxing/browser");
  const reader = new BrowserMultiFormatReader();
  try {
    const result = reader.decodeFromCanvas(canvas);
    return result.getText() ?? null;
  } catch {
    return null;
  }
}
