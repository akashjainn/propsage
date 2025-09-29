// Simple event emitter for coordinating video playback (avoid multiple simultaneous audio sources)
import { EventEmitter } from 'events';

export const videoEvents = new EventEmitter();

// Limit listeners to prevent memory leak warnings if many components mount/unmount
videoEvents.setMaxListeners(20);

export type VideoPlayEvent = { id: string };

export const emitVideoPlay = (id: string) => videoEvents.emit('play', { id } as VideoPlayEvent);
export const onVideoPlay = (handler: (e: VideoPlayEvent) => void) => {
  videoEvents.on('play', handler);
  return () => videoEvents.off('play', handler);
};