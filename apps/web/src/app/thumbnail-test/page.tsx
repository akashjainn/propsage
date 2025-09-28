import React from 'react';
import ClipsGrid from '../../components/ClipsGrid';
import type { Clip } from '../../components/clip.types';

// Example clips to test thumbnail extraction
const sampleClips: Clip[] = [
  {
    id: 'test-clip-1',
    playerId: 'test-player-1',
    title: 'Sample Video Clip 1',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    start: 0,
    end: 10,
    thumbnail: '', // Will be extracted from video
    confidence: 0.95,
    tags: ['test', 'sample']
  },
  {
    id: 'test-clip-2',
    playerId: 'test-player-2', 
    title: 'Sample Video Clip 2',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    start: 5,
    end: 15,
    thumbnail: '', // Will be extracted from video
    confidence: 0.88,
    tags: ['test', 'sample']
  },
  {
    id: 'mock-clip-1',
    playerId: 'mock-player-1',
    title: 'Mock Clip for Testing',
    src: '/api/video/mock/mock-clip-1',
    start: 0,
    end: 8,
    thumbnail: '',
    confidence: 0.91,
    tags: ['mock', 'test']
  }
];

export default function ThumbnailTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Video Thumbnail Extraction Test
          </h1>
          <p className="text-gray-600">
            This page demonstrates automatic thumbnail extraction from the first frame of video clips.
            The system will capture the frame at the start time of each clip.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Sample Clips</h2>
          <ClipsGrid 
            clips={sampleClips}
            selectedPlayer={{ name: 'Test Player', position: 'QB', team: 'TEST' }}
          />
        </div>

        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How it works:</h3>
          <ul className="space-y-2 text-blue-800">
            <li>• Thumbnails are extracted client-side using HTML5 video + canvas</li>
            <li>• Only visible clips are processed (using Intersection Observer)</li>
            <li>• Videos are sought to the clip's start time for accurate frames</li>
            <li>• Fallback to API-generated thumbnails or SVG placeholders</li>
            <li>• CORS-enabled video proxy for TwelveLabs content</li>
          </ul>
        </div>
      </div>
    </div>
  );
}