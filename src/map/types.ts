export interface MapHandle {
  post(msg: Record<string, unknown>): void;
}

export type MapEvent =
  | { type: 'ready' }
  | { type: 'select'; id: string }
  | { type: 'mapTap' }
  | { type: 'bearing'; bearing: number };

export interface HighlightItem {
  color: string;
  badge?: string;
  /** Category id whose blip icon to use (e.g. 'fashion'). */
  icon?: string;
}
