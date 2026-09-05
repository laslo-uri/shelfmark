import { useCallback, useEffect, useRef, useState } from 'react';
import { decodeBarcodeFromVideo } from '../utils/barcodeDecode.js';
import { cameraRequiresSecureContext } from '../utils/platform.js';

const EAN_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];

const CAMERA_CONSTRAINTS = [
  {
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  },
  {
    video: {
      facingMode: { ideal: 'user' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  },
  { video: true, audio: false },
];

function supportsBarcodeDetector() {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

async function getBarcodeDetector() {
  if (!supportsBarcodeDetector()) return null;
  try {
    const supported = await window.BarcodeDetector.getSupportedFormats();
    const formats = EAN_FORMATS.filter((f) => supported.includes(f));
    if (formats.length === 0) return null;
    return new window.BarcodeDetector({ formats });
  } catch {
    return null;
  }
}

async function openCameraStream() {
  let lastError;
  for (const constraints of CAMERA_CONSTRAINTS) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      lastError = err;
      if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
        throw err;
      }
    }
  }
  throw lastError ?? new Error('Could not access camera');
}

async function loadZxingReader() {
  const { BrowserMultiFormatReader } = await import('@zxing/browser');
  return new BrowserMultiFormatReader();
}

export function useBarcodeScanner({ onDetected, active }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const zxingRef = useRef(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(null);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (zxingRef.current) {
      zxingRef.current.reset();
      zxingRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
    setReady(false);
  }, []);

  const handleDetection = useCallback(
    (rawValue) => {
      const value = String(rawValue).replace(/[-\s]/g, '');
      if (value.length >= 10) {
        onDetected?.(value);
        stop();
      }
    },
    [onDetected, stop],
  );

  const captureAndScan = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      setError('Camera not ready yet. Wait a second, then try Capture & scan again.');
      return;
    }

    setCapturing(true);
    setError(null);
    try {
      const raw = await decodeBarcodeFromVideo(video);
      if (raw) {
        handleDetection(raw);
      } else {
        setError(
          'No barcode found in this shot. Center the ISBN bars in the frame, hold steady, and tap Capture & scan again.',
        );
      }
    } finally {
      setCapturing(false);
    }
  }, [handleDetection]);

  useEffect(() => {
    if (!active) {
      stop();
      setError(null);
      setMode(null);
      setCapturing(false);
      return undefined;
    }

    if (cameraRequiresSecureContext()) {
      setError(
        'Camera needs a secure connection (HTTPS). Open the deployed app or use localhost.',
      );
      return undefined;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera is not supported in this browser. Enter the ISBN manually below.');
      return undefined;
    }

    let cancelled = false;

    async function start() {
      setError(null);
      setReady(false);

      try {
        const stream = await openCameraStream();

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.muted = true;
        video.playsInline = true;
        video.srcObject = stream;

        try {
          await video.play();
        } catch {
          /* iOS may require a user gesture */
        }

        const onReady = () => {
          if (!cancelled && video.videoWidth > 0) setReady(true);
        };
        video.addEventListener('loadeddata', onReady);
        if (video.readyState >= 2) onReady();

        const detector = await getBarcodeDetector();
        if (cancelled) return;

        if (detector) {
          setMode('native');

          const scan = async () => {
            if (cancelled || !videoRef.current) return;
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                handleDetection(barcodes[0].rawValue);
                return;
              }
            } catch {
              /* frame not ready */
            }
            rafRef.current = requestAnimationFrame(scan);
          };

          rafRef.current = requestAnimationFrame(scan);
        } else {
          setMode('zxing');
          const reader = await loadZxingReader();
          if (cancelled) {
            reader.reset();
            return;
          }
          zxingRef.current = reader;

          reader.decodeFromVideoElement(video, (result, err) => {
            if (result) {
              handleDetection(result.getText());
            }
            if (err && err.name !== 'NotFoundException') {
              /* ignore scan misses */
            }
          });
        }
      } catch (err) {
        if (!cancelled) {
          if (err.name === 'NotAllowedError') {
            setError(
              'Camera access denied. Allow camera permission in browser or system settings, then try again.',
            );
          } else if (err.name === 'NotFoundError') {
            setError('No camera found. Enter the ISBN manually below.');
          } else if (err.name === 'NotReadableError') {
            setError(
              'Camera is in use by another app. Close it and try again, or enter the ISBN below.',
            );
          } else {
            setError('Could not start camera. Enter the ISBN manually below.');
          }
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      stop();
    };
  }, [active, handleDetection, stop]);

  return { videoRef, error, mode, ready, capturing, captureAndScan, stop };
}
