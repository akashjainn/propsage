import { useEffect, useRef, useState } from "react";

export function useVideoThumb(src?: string, timeSec = 0) {
  const [url, setUrl] = useState<string>();
  const working = useRef(false);

  useEffect(() => {
    if (!src || working.current) return;
    working.current = true;

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "metadata";
    video.src = src;

    const onLoaded = () => {
      // seek slightly past the start to avoid black frames
      video.currentTime = Math.max(0, timeSec + 0.1);
    };

    const onSeeked = () => {
      const canvas = document.createElement("canvas");
      const w = (canvas.width = video.videoWidth || 640);
      const h = (canvas.height = video.videoHeight || 360);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, w, h);
        const data = canvas.toDataURL("image/jpeg", 0.82);
        setUrl(data);
      }
      cleanup();
    };

    const onError = () => { 
      console.warn('Failed to extract thumbnail from video:', src);
      cleanup(); 
    };

    const cleanup = () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      working.current = false;
    };

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    
    // Start loading
    video.load();

    return cleanup;
  }, [src, timeSec]);

  return url; // data URL you can use in <img src={url} />
}