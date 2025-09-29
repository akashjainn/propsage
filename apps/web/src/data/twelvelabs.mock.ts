// Embedded mock TwelveLabs data for serverless environments (Vercel)
// This avoids filesystem path issues when the API package isn't deployed.
export const TWELVE_LABS_MOCK = {
  players: {
    'cfb_gunner_stockton': {
      name: 'Gunner Stockton',
      team: 'UGA',
      videos: [
        {
          id: 'vid_stockton_pass_highlights_001',
          title: 'Gunner Stockton passes to Colbie Young touchdown',
          url: 'https://example.com/videos/stockton_touchdown.mp4',
            // In production replace with a real CDN URL or a /public asset
          thumbnail: 'https://example.com/thumbs/stockton_td.jpg',
          duration: 30,
          confidence: 0.94,
          tags: ['passing','touchdown','deep_ball','clutch'],
          metadata: { game: 'UGA vs Alabama', date: '2025-09-27', quarter: 3, down_distance: '2nd & 8', field_position: 'UGA 35' },
          clips: [{ start_time: 0, end_time: 30, description: 'Stockton perfect strike to Young for TD' }]
        }
      ]
    },
    'cfb_haynes_king': {
      name: 'Haynes King',
      team: 'Georgia Tech',
      videos: [
        {
          id: 'vid_king_passing_touchdown_001',
          title: 'Haynes King passing touchdown from 3rd and 10',
          url: 'https://example.com/videos/king_td.mp4',
          thumbnail: 'https://example.com/thumbs/king_td.jpg',
          duration: 35,
          confidence: 0.92,
          tags: ['passing','touchdown','comeback','clutch'],
          metadata: { game: 'Georgia Tech vs Wake Forest', date: '2025-09-27', quarter: 3, down_distance: '3rd & 10', field_position: 'WF 25' },
          clips: [{ start_time: 0, end_time: 35, description: 'Critical 3rd and 10 TD pass to begin comeback' }]
        }
      ]
    }
  }
};
