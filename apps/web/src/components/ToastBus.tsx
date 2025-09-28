'use client';
import { useEffect, useState } from 'react';

type Msg = { id: number; text: string };
let pushImpl: ((text: string) => void) | null = null;
export function pushToast(text: string) { pushImpl?.(text); }

export default function ToastBus() {
  const [items, setItems] = useState<Msg[]>([]);
  useEffect(() => {
    pushImpl = (text) => {
      const id = Date.now();
      setItems((s) => [...s, { id, text }]);
      setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 3500);
    };
    return () => { pushImpl = null; };
  }, []);
  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-[1000]">
      {items.map((m) => (
        <div key={m.id} className="rounded-lg bg-black/80 text-white px-3 py-2 shadow">
          {m.text}
        </div>
      ))}
    </div>
  );
}
