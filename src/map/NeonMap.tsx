import { forwardRef, useImperativeHandle, useRef, type ComponentType } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { MAP_HTML } from './mapHtml.generated';
import type { MapEvent, MapHandle } from './types';

// react-native-webview's class typings don't line up with React 19.3's JSX types yet;
// the runtime component is fine, so we type it loosely here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WV = WebView as unknown as ComponentType<any>;

// Native (iOS / Android): MapLibre GL running inside a WebView.
export const NeonMap = forwardRef<MapHandle, { onEvent: (e: MapEvent) => void }>(function NeonMap({ onEvent }, ref) {
  const web = useRef<{ injectJavaScript(js: string): void; reload(): void } | null>(null);
  useImperativeHandle(ref, () => ({
    post(msg) {
      const s = JSON.stringify(JSON.stringify(msg));
      web.current?.injectJavaScript(`window.NEON && window.NEON.receive(${s}); true;`);
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
});

const styles = StyleSheet.create({ map: { flex: 1, backgroundColor: '#170E2E' } });
