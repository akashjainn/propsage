export type Clip = {
  id: string;
  playerId: string;
  title: string;
  src: string;
  start: number;
  end: number;
  thumbnail: string;
  tags: string[];
  confidence: number; // 0..1
};
