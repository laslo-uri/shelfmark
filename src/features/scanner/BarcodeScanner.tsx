import { Button } from "@/components/ui/button";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";

export function BarcodeScanner({
  active,
  onDetected,
  onClose,
}: {
  active: boolean;
  onDetected: (value: string) => void;
  onClose: () => void;
}) {
  const scanner = useBarcodeScanner({ active, onDetected });
  return (
    <div className="space-y-3">
      <video ref={scanner.videoRef} className="aspect-video w-full rounded-md bg-black object-cover" muted playsInline />
      {scanner.error ? <p className="text-sm text-destructive" role="alert">{scanner.error}</p> : null}
      <p className="text-xs text-muted-foreground">{scanner.ready ? "Camera ready" : "Starting camera…"}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void scanner.captureAndScan()} disabled={scanner.capturing}>
          {scanner.capturing ? "Scanning…" : "Capture & scan"}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>Close scanner</Button>
      </div>
    </div>
  );
}
