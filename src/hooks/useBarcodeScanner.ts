import { useCallback, useEffect, useRef, useState } from "react";
import { decodeBarcodeFromVideo, getBarcodeDetector } from "@/lib/barcodeDecode";
import { cameraRequiresSecureContext } from "@/lib/platform";

/** Native detection is costly; ~7 scans a second is plenty for a held-up barcode. */
const NATIVE_SCAN_INTERVAL_MS = 150;

const CAMERA_CONSTRAINTS: MediaStreamConstraints[] = [
  { video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
  { video: { facingMode: { ideal: "user" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
  { video: true, audio: false },
];

async function openCameraStream() {
  let lastError: unknown;
  for (const constraints of CAMERA_CONSTRAINTS) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      lastError = err;
      if (err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError")) throw err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Could not access camera");
}

export function useBarcodeScanner({ onDetected, active }: { onDetected: (value: string) => void; active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const scannerControlsRef = useRef<{ stop: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"native" | "zxing" | null>(null);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const lastSeenRef = useRef({ value: "", at: 0 });
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setReady(false);
  }, []);

  const handleDetection = useCallback((rawValue: string) => {
    const value = String(rawValue).replace(/[-\s]/g, "");
    if (value.length < 10) return;
    const now = Date.now();
    if (lastSeenRef.current.value === value && now - lastSeenRef.current.at < 2500) return;
    lastSeenRef.current = { value, at: now };
    onDetectedRef.current(value);
  }, []);

  const captureAndScan = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      setError("Camera not ready yet. Wait a second, then try Capture & scan again.");
      return;
    }
    setCapturing(true);
    setError(null);
    try {
      const raw = await decodeBarcodeFromVideo(video);
      if (raw) handleDetection(raw);
      else setError("No barcode found in this shot. Center the ISBN bars and try Capture & scan again.");
    } catch {
      setError("Could not scan this shot. Try again, or enter the ISBN manually.");
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
      setError("Camera needs a secure connection (HTTPS). Open the deployed app or use localhost.");
      return undefined;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera is not supported in this browser. Enter the ISBN manually.");
      return undefined;
    }

    let cancelled = false;
    let removeReadyListener: (() => void) | null = null;
    async function start() {
      setError(null);
      setReady(false);
      try {
        const stream = await openCameraStream();
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.muted = true;
        video.playsInline = true;
        video.srcObject = stream;
        try { await video.play(); } catch { /* iOS may need a gesture */ }
        const onReady = () => { if (!cancelled && video.videoWidth > 0) setReady(true); };
        video.addEventListener("loadeddata", onReady);
        removeReadyListener = () => video.removeEventListener("loadeddata", onReady);
        if (video.readyState >= 2) onReady();

        const detector = await getBarcodeDetector();
        if (cancelled) return;
        if (detector) {
          setMode("native");
          let lastScan = 0;
          const scan = async (time: number) => {
            if (cancelled || !videoRef.current) return;
            if (time - lastScan >= NATIVE_SCAN_INTERVAL_MS) {
              lastScan = time;
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes[0]) handleDetection(barcodes[0].rawValue);
              } catch { /* frame not ready */ }
            }
            if (cancelled) return;
            rafRef.current = requestAnimationFrame((next) => { void scan(next); });
          };
          rafRef.current = requestAnimationFrame((next) => { void scan(next); });
        } else {
          setMode("zxing");
          const { BrowserMultiFormatReader } = await import("@zxing/browser");
          const reader = new BrowserMultiFormatReader();
          const controls = await reader.decodeFromVideoElement(video, (result) => {
            if (result) handleDetection(result.getText());
          });
          if (cancelled) {
            controls.stop();
            return;
          }
          scannerControlsRef.current = controls;
        }
      } catch (err) {
        if (cancelled) return;
        const name = err instanceof DOMException ? err.name : "";
        if (name === "NotAllowedError") setError("Camera access denied. Allow camera permission, then try again.");
        else if (name === "NotFoundError") setError("No camera found. Enter the ISBN manually.");
        else if (name === "NotReadableError") setError("Camera is in use by another app. Enter the ISBN below.");
        else setError("Could not start camera. Enter the ISBN manually.");
      }
    }
    void start();
    return () => {
      cancelled = true;
      removeReadyListener?.();
      stop();
    };
  }, [active, handleDetection, stop]);

  return { videoRef, error, mode, ready, capturing, captureAndScan, stop };
}
