import { useState } from "react";
import { API_BASE } from "./api";

export interface VideoClip {
  title: string;
  start: number;
  end: number;
  videoUrl: string;
  snippet?: string;
}

export function useVideoClips() {
  const [loading, setLoading] = useState(false);
  const [clips, setClips] = useState<VideoClip[]>([]);

  async function search(q: string) {
    if (!q.trim()) {
      setClips([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/video/search?q=${encodeURIComponent(q)}`);
      if (response.ok) {
        const data = await response.json();
        // Handle both formats: { clips: [...] } or direct array
        const clipsList = data.clips || data || [];
        setClips(clipsList);
      } else {
        console.warn('Video search failed:', response.status);
        setClips([]);
      }
    } catch (error) {
      console.error('Error searching videos:', error);
      setClips([]);
    } finally {
      setLoading(false);
    }
  }

  return { loading, clips, search };
}