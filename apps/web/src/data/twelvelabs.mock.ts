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
          // Using existing local clip asset (spaces encoded) from /public/clips
          // Original filename: 9-27 uga alabama Gunner Stockton passes to Colbie Young touchdown.mp4
          url: '/clips/9-27%20uga%20alabama%20Gunner%20Stockton%20passes%20to%20Colbie%20Young%20touchdown.mp4',
          // Optional: add a thumbnail still at /public/clips/stockton_td.jpg
          thumbnail: '/clips/stockton_td.jpg',
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
          // Existing Haynes King passing TD clip (spaces encoded)
          // Original filename: 9-27 georgia tech wake forest haynes king passing touchdown from 3rd and 10 to begin comeback.mp4
          url: '/clips/9-27%20georgia%20tech%20wake%20forest%20haynes%20king%20passing%20touchdown%20from%203rd%20and%2010%20to%20begin%20comeback.mp4',
          thumbnail: '/clips/haynes_king_td.jpg',
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
