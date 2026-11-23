import { forwardRef, memo, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { MAP_HTML } from './mapHtml.generated';
import type { MapEvent, MapHandle } from './types';

// Web preview: same map engine inside an iframe.
export const NeonMap = memo(
  forwardRef<MapHandle, { onEvent: (e: MapEvent) => void }>(function NeonMap({ onEvent }, ref) {
  const frame = useRef<HTMLIFrameElement>(null);
  const cb = useRef(onEvent);
  cb.current = onEvent;
  // A blob: URL (not srcDoc) — MapLibre's tile workers can't resolve URLs from about:srcdoc.
  const src = useMemo(() => URL.createObjectURL(new Blob([MAP_HTML], { type: 'text/html' })), []);

  const queue = useRef<Record<string, unknown>[]>([]);
  useImperativeHandle(ref, () => ({
    post(msg) {
      queue.current.push(msg);
      if (queue.current.length > 1) return;
      setTimeout(() => {
        const batch = queue.current;
        queue.current = [];
        frame.current?.contentWindow?.postMessage({ __neonIn: true, payload: JSON.stringify(batch.length === 1 ? batch[0] : batch) }, '*');
      }, 0);
    },
  }));

  useEffect(() => {
    const h = (ev: MessageEvent) => {
      if (ev.data && ev.data.__neon) {
        try {
          cb.current(JSON.parse(ev.data.payload));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('message', h);
    return () => window.removeEventListener('message', h);
  }, []);

  return (
    <iframe
      ref={frame}
      title="map"
      src={src}
      style={{ border: 0, width: '100%', height: '100%', display: 'block', background: '#170E2E' }}
    />
  );
}),
);
