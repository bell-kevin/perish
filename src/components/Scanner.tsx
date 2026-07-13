import { useEffect, useRef, useState } from 'react';

interface Props {
  onDetected: (code: string) => void;
  onClose: () => void;
}

/**
 * Barcode scanner with two engines:
 *   1. The native BarcodeDetector API where available (Chromium, Android).
 *   2. A lazily-loaded ZXing (Apache-2.0) fallback everywhere else
 *      (Firefox, Safari/iOS).
 * If the camera is unavailable or denied, a manual-entry field remains.
 */
export default function Scanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const doneRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [engine, setEngine] = useState<'native' | 'zxing' | null>(null);
  const [manual, setManual] = useState('');

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let timer = 0;
    let controls: { stop: () => void } | null = null;

    const finish = (raw: string) => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDetected(raw.trim());
    };

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          'No camera access in this browser (a secure HTTPS connection is required). You can type the barcode below.'
        );
        return;
      }
      try {
        if ('BarcodeDetector' in window) {
          setEngine('native');
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          const video = videoRef.current;
          if (!video) return;
          video.srcObject = stream;
          await video.play();
          const detector = new BarcodeDetector({
            formats: [
              'ean_13',
              'ean_8',
              'upc_a',
              'upc_e',
              'code_128',
              'code_39',
              'itf',
              'qr_code'
            ]
          });
          const tick = async () => {
            if (cancelled || doneRef.current) return;
            try {
              const codes = await detector.detect(video);
              if (codes.length > 0 && codes[0].rawValue) {
                finish(codes[0].rawValue);
                return;
              }
            } catch {
              // frame not ready yet — keep polling
            }
            timer = window.setTimeout(tick, 180);
          };
          tick();
        } else {
          setEngine('zxing');
          const { BrowserMultiFormatReader } = await import('@zxing/browser');
          const reader = new BrowserMultiFormatReader();
          controls = await reader.decodeFromVideoDevice(
            undefined,
            videoRef.current ?? undefined,
            (result) => {
              if (result) {
                controls?.stop();
                finish(result.getText());
              }
            }
          );
          if (cancelled) controls.stop();
        }
      } catch {
        setError(
          'Could not open the camera — permission was denied or no camera is available. You can type the barcode below.'
        );
      }
    }

    start();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      controls?.stop();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onDetected]);

  return (
    <div className="scanner-overlay" role="dialog" aria-label="Scan a barcode">
      <div className="scanner-panel">
        <div className="scanner-head">
          <span className="eyebrow">Scan barcode</span>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close scanner">
            Close
          </button>
        </div>

        {!error && (
          <div className="scanner-stage">
            <video ref={videoRef} muted playsInline className="scanner-video" />
            <div className="scanner-reticle" aria-hidden="true" />
          </div>
        )}

        {error && <p className="scanner-error">{error}</p>}

        <form
          className="scanner-manual"
          onSubmit={(e) => {
            e.preventDefault();
            if (manual.trim()) onDetected(manual.trim());
          }}
        >
          <input
            inputMode="numeric"
            placeholder="…or type the barcode digits"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            aria-label="Barcode digits"
          />
          <button className="btn" type="submit" disabled={!manual.trim()}>
            Use code
          </button>
        </form>

        <p className="scanner-hint">
          {engine === 'zxing'
            ? 'Point the camera at the barcode and hold steady.'
            : 'Point the camera at the barcode.'}{' '}
          Product names are looked up on Open Food Facts when you're online; only
          the digits are sent.
        </p>
      </div>
    </div>
  );
}
