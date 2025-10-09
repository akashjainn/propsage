/**
 * NFL Evidence Demo Page
 * 
 * Showcases Week 5 NFL highlight evidence integration with TwelveLabs
 */

import { NFLEvidenceExplorer } from '../../components/NFLEvidenceExplorer';

export default function NFLEvidencePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Week 5 NFL Highlights
            </span>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            NFL Evidence Intelligence
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore video evidence from Week 5 NFL games to build data-driven prop betting insights. 
            Our AI analyzes game footage to identify key moments and statistical patterns.
          </p>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="text-2xl mb-4">🎯</div>
            <h3 className="font-semibold mb-2">Smart Query Patterns</h3>
            <p className="text-gray-600 text-sm">
              Pre-built query patterns for touchdowns, explosive plays, red zone situations, and more.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="text-2xl mb-4">🏃‍♂️</div>
            <h3 className="font-semibold mb-2">Player-Specific Props</h3>
            <p className="text-gray-600 text-sm">
              Find evidence for specific players across rushing, passing, and receiving categories.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="text-2xl mb-4">📊</div>
            <h3 className="font-semibold mb-2">Evidence Scoring</h3>
            <p className="text-gray-600 text-sm">
              AI confidence scores and PropSage evidence weights for fair market line calculations.
            </p>
          </div>
        </div>

        {/* Interactive Explorer */}
        <NFLEvidenceExplorer />

        {/* API Examples */}
        <div className="mt-16 bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold mb-6">API Integration Examples</h2>
          
          <div className="space-y-6">
            {/* Search Examples */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Evidence Search</h3>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                <div className="text-green-600"># Search for touchdown passes in red zone</div>
                <div>GET /nfl/evidence/search?q=touchdown%20pass%20red%20zone&limit=5</div>
                <br />
                <div className="text-green-600"># Find explosive running plays</div>
                <div>GET /nfl/evidence/search?q=explosive%20run%2020%2B%20yards&minScore=0.7</div>
              </div>
            </div>

            {/* Player Examples */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Player Props</h3>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                <div className="text-green-600"># Lamar Jackson rushing touchdowns</div>
                <div>GET /nfl/evidence/player/Lamar%20Jackson?propType=rushing_touchdowns</div>
                <br />
                <div className="text-green-600"># Josh Allen passing yards evidence</div>
                <div>GET /nfl/evidence/player/Josh%20Allen?propType=passing_yards&limit=8</div>
              </div>
            </div>

            {/* Response Example */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Response Format</h3>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700">
                <pre>{`{
  "query": "touchdown pass red zone",
  "totalResults": 12,
  "evidence": [
    {
      "id": "nfl_video123_45",
      "confidence": 0.89,
      "tags": ["TOUCHDOWN", "PASS", "RED_ZONE"],
      "actors": { "players": ["Josh Allen"] },
      "evidenceWeight": 0.85,
      "deltaMu": 0.12,
      "deltaSigma": -0.04,
      "context": {
        "transcript": "Allen finds Diggs in the corner...",
        "thumbnail": "https://..."
      }
    }
  ],
  "week": 5
}`}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Notes */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">🔧 Technical Implementation</h3>
          <div className="text-blue-800 space-y-2 text-sm">
            <p>• <strong>TwelveLabs AI:</strong> Multi-modal video search (visual + audio + transcript)</p>
            <p>• <strong>Evidence Weights:</strong> Confidence-based adjustments to Monte Carlo simulations</p>
            <p>• <strong>Caching:</strong> LRU cache with 30-minute TTL for query results</p>
            <p>• <strong>Deduplication:</strong> Temporal overlap detection to avoid duplicate clips</p>
            <p>• <strong>PropSage Integration:</strong> Direct evidence feed into fair market line calculations</p>
          </div>
        </div>
      </div>
    </main>
  );
}