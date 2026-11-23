import { forwardRef, memo, useImperativeHandle, useRef, type ComponentType } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { MAP_HTML } from './mapHtml.generated';
import type { MapEvent, MapHandle } from './types';

// react-native-webview's class typings don't line up with React 19.3's JSX types yet;
// the runtime component is fine, so we type it loosely here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WV = WebView as unknown as ComponentType<any>;

// Native (iOS / Android): MapLibre GL running inside a WebView.
export const NeonMap = memo(
  forwardRef<MapHandle, { onEvent: (e: MapEvent) => void }>(function NeonMap({ onEvent }, ref) {
  const web = useRef<{ injectJavaScript(js: string): void; reload(): void } | null>(null);
  // Messages posted in the same JS tick go across the bridge as one injectJavaScript call.
  const queue = useRef<Record<string, unknown>[]>([]);
  useImperativeHandle(ref, () => ({
    post(msg) {
      queue.current.push(msg);
      if (queue.current.length > 1) return;
      setTimeout(() => {
        const batch = queue.current;
        queue.current = [];
        const s = JSON.stringify(JSON.stringify(batch.length === 1 ? batch[0] : batch));
        web.current?.injectJavaScript(`window.NEON && window.NEON.receive(${s}); true;`);
      }, 0);
    },
  }));
  return (
    <WV
      ref={web}
      style={styles.map}
      originWhitelist={['*']}
      source={{ html: MAP_HTML, baseUrl: 'https://neon-dxb.local/' }}
      onMessage={(e: { nativeEvent: { data: string } }) => {
        try {
          onEvent(JSON.parse(e.nativeEvent.data));
        } catch {
          // ignore
        }
      }}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
      bounces={false}
      overScrollMode="never"
      setSupportMultipleWindows={false}
      allowsInlineMediaPlayback
      webviewDebuggingEnabled={__DEV__}
      onContentProcessDidTerminate={() => web.current?.reload()}
    />
  );
  }),
);

const styles = StyleSheet.create({ map: { flex: 1, backgroundColor: '#170E2E' } });
