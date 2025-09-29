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
            url: '/clips/9-27%20uga%20alabama%20Gunner%20Stockton%20passes%20to%20Colbie%20Young%20touchdown.mp4',
            thumbnail: '/clips/thumbnails/9-27%20uga%20alabama%20Gunner%20Stockton%20passes%20to%20Colbie%20Young%20touchdown.jpg',
            duration: 30,
            confidence: 0.94,
            tags: ['passing','touchdown','deep_ball','clutch','passing_yds','pass_tds','longest_completion'],
            metadata: { game: 'UGA vs Alabama', date: '2025-09-27', quarter: 3, down_distance: '2nd & 8', field_position: 'UGA 35' },
            clips: [{ start_time: 0, end_time: 30, description: 'Stockton perfect strike to Young for TD (explosive pass)' }]
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
          url: '/clips/9-27%20georgia%20tech%20wake%20forest%20haynes%20king%20passing%20touchdown%20from%203rd%20and%2010%20to%20begin%20comeback.mp4',
          thumbnail: '/clips/thumbnails/9-27%20georgia%20tech%20wake%20forest%20haynes%20king%20passing%20touchdown%20from%203rd%20and%2010%20to%20begin%20comeback.jpg',
          duration: 35,
          confidence: 0.92,
          tags: ['passing','touchdown','comeback','clutch','passing_yds','pass_tds'],
          metadata: { game: 'Georgia Tech vs Wake Forest', date: '2025-09-27', quarter: 3, down_distance: '3rd & 10', field_position: 'WF 25' },
          clips: [{ start_time: 0, end_time: 35, description: 'Critical 3rd and 10 TD pass to begin comeback' }]
        },
        {
          id: 'vid_king_rushing_touchdown_001',
          title: 'Haynes King designed QB rushing TD',
          url: '/clips/9-27%20georgia%20tech%20wake%20forest%20haynes%20king%20running%20touchdown%20bringing%20game%20to%2017-20.mp4',
          thumbnail: '/clips/thumbnails/9-27%20georgia%20tech%20wake%20forest%20haynes%20king%20running%20touchdown%20bringing%20game%20to%2017-20.jpg',
          duration: 28,
          confidence: 0.90,
          tags: ['rushing','rush_tds','rushing_yds','designed_run','mobility','touchdown'],
          metadata: { game: 'Georgia Tech vs Wake Forest', date: '2025-09-27', quarter: 2, down_distance: '2nd & Goal', field_position: 'WF 5' },
          clips: [{ start_time: 0, end_time: 28, description: 'Designed QB power for rushing touchdown' }]
        }
      ]
    },
    'cfb_jamal_haynes': {
      name: 'Jamal Haynes',
      team: 'Georgia Tech',
      videos: [
        {
          id: 'vid_jamal_haynes_run_001',
          title: 'Jamal Haynes interior run (ball security highlight)',
          url: '/clips/9-27%20georgia%20tech%20wake%20forest%20jamal%20haines%20fumble.mp4',
          thumbnail: '/clips/thumbnails/9-27%20georgia%20tech%20wake%20forest%20jamal%20haines%20fumble.jpg',
          duration: 22,
          confidence: 0.78,
          tags: ['rushing','rushing_yds','run_play','ground_game'],
          metadata: { game: 'Georgia Tech vs Wake Forest', date: '2025-09-27', quarter: 1, field_position: 'GT 40' },
          clips: [{ start_time: 0, end_time: 22, description: 'Haynes interior zone – illustrates rushing style & risk' }]
        }
      ]
    },
    'cfb_luke_altmyer': {
      name: 'Luke Altmyer',
      team: 'Illinois',
      videos: [
        {
          id: 'vid_altmyer_pass_tds_001',
          title: 'Luke Altmyer 3 TD passes vs USC highlights',
          url: '/clips/sample-illinois-usc-altmyer-passing.mp4',
          thumbnail: '/clips/thumbnails/sample-illinois-usc-altmyer-passing.jpg',
          duration: 45,
          confidence: 0.91,
          tags: ['passing','pass_tds','touchdown','red_zone','passing_yds'],
          metadata: { game: 'Illinois vs USC', date: '2025-09-21', quarter: 'Multiple', field_position: 'Various' },
          clips: [{ start_time: 0, end_time: 45, description: 'Altmyer 3 TD compilation - red zone efficiency' }]
        }
      ]
    }
  }
  ,
  // Deterministic mapping: key = `${playerId}:${propType}` using playerId WITH cfb_ prefix and propType from insights/props
  propClipMap: {
    'cfb_gunner_stockton:passing_yds': ['vid_stockton_pass_highlights_001'],
    'cfb_gunner_stockton:pass_tds': ['vid_stockton_pass_highlights_001'],
    'cfb_gunner_stockton:longest_completion': ['vid_stockton_pass_highlights_001'],
    'cfb_haynes_king:passing_yds': ['vid_king_passing_touchdown_001'],
    'cfb_haynes_king:pass_tds': ['vid_king_passing_touchdown_001'],
    'cfb_haynes_king:rush_tds': ['vid_king_rushing_touchdown_001'],
    'cfb_haynes_king:rushing_yds': ['vid_king_rushing_touchdown_001'],
    'cfb_jamal_haynes:rushing_yds': ['vid_jamal_haynes_run_001'],
    'cfb_luke_altmyer:passing_yds': ['vid_altmyer_pass_tds_001'],
    'cfb_luke_altmyer:pass_tds': ['vid_altmyer_pass_tds_001']
  }
};
