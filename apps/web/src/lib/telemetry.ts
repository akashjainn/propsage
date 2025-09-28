export function wireTelemetry(video: HTMLVideoElement, ctx: Record<string, any> = {}) {
  const log = (ev: string, extra: any = {}) =>
    console.log('[player]', ev, { t: video.currentTime, ...ctx, ...extra });
  video.addEventListener('play', () => log('play'));
  video.addEventListener('pause', () => log('pause'));
  video.addEventListener('waiting', () => log('rebuffer'));
  video.addEventListener('error', () => log('error', { err: video.error }));
}
