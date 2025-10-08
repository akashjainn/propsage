/**
 * Real-time Video Evidence Integration Component
 * 
 * Demonstrates live video evidence affecting pricing calculations
 * for the webinar demo scenarios.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Video, Play, Pause } from 'lucide-react';

interface PricingData {
  marketLine: number;
  fairValue: number;
  edge: number;
  confidence: number;
  lastUpdate: string;
}

interface VideoEvidence {
  id: string;
  playerId: string;
  playerName: string;
  momentDescription: string;
  evidenceType: 'positive' | 'negative' | 'neutral';
  weight: number;
  deltaMu: number;
  deltaSigma: number;
  timestamp: string;
}

export default function RealtimeVideoEvidence() {
  const [isLive, setIsLive] = useState(false);
  const [pricingData, setPricingData] = useState<PricingData>({
    marketLine: 247.5,
    fairValue: 247.5,
    edge: 0,
    confidence: 50,
    lastUpdate: new Date().toLocaleTimeString()
  });
  
  const [videoEvidence, setVideoEvidence] = useState<VideoEvidence[]>([]);
  const [simulationSpeed, setSimulationSpeed] = useState(3000); // 3 seconds between updates

  // Simulate real-time evidence updates
  useEffect(() => {
    if (!isLive) return;

    const evidenceSequence: Omit<VideoEvidence, 'id' | 'timestamp'>[] = [
      {
        playerId: 'gunner-stockton',
        playerName: 'Gunner Stockton',
        momentDescription: 'Accurate 25-yard touchdown pass under pressure to Colbie Young',
        evidenceType: 'positive',
        weight: 0.8,
        deltaMu: 0.15,
        deltaSigma: -0.05
      },
      {
        playerId: 'ryan-williams',
        playerName: 'Ryan Williams',
        momentDescription: 'Drops wide-open 15-yard pass in crucial moment',
        evidenceType: 'negative', 
        weight: 0.7,
        deltaMu: -0.08,
        deltaSigma: 0.03
      },
      {
        playerId: 'gunner-stockton',
        playerName: 'Gunner Stockton',
        momentDescription: '64-yard deep ball completion showing arm strength',
        evidenceType: 'positive',
        weight: 0.9,
        deltaMu: 0.18,
        deltaSigma: -0.06
      },
      {
        playerId: 'gunner-stockton', 
        playerName: 'Gunner Stockton',
        momentDescription: 'Mobile in pocket, extends play for 12-yard gain',
        evidenceType: 'positive',
        weight: 0.6,
        deltaMu: 0.08,
        deltaSigma: -0.02
      }
    ];

    let evidenceIndex = 0;
    const interval = setInterval(() => {
      if (evidenceIndex < evidenceSequence.length) {
        const newEvidence = {
          ...evidenceSequence[evidenceIndex],
          id: `evidence-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString()
        };
        
        setVideoEvidence(prev => [newEvidence, ...prev]);
        
        // Update pricing based on cumulative evidence
        setPricingData(prev => {
          const cumulativeAdjustment = videoEvidence
            .concat(newEvidence)
            .reduce((sum, ev) => sum + (ev.deltaMu * ev.weight), 0);
          
          const newFairValue = 247.5 + (cumulativeAdjustment * 30); // Scale adjustment
          const newEdge = ((newFairValue - prev.marketLine) / prev.marketLine * 100);
          
          return {
            ...prev,
            fairValue: Math.round(newFairValue * 10) / 10,
            edge: Math.round(newEdge * 100) / 100,
            confidence: Math.min(95, 50 + (videoEvidence.length + 1) * 8),
            lastUpdate: new Date().toLocaleTimeString()
          };
        });
        
        evidenceIndex++;
      } else {
        // Reset after all evidence shown
        setTimeout(() => {
          setVideoEvidence([]);
          setPricingData({
            marketLine: 247.5,
            fairValue: 247.5,
            edge: 0,
            confidence: 50,
            lastUpdate: new Date().toLocaleTimeString()
          });
          evidenceIndex = 0;
        }, 5000);
      }
    }, simulationSpeed);

    return () => clearInterval(interval);
  }, [isLive, simulationSpeed, videoEvidence.length]);

  const toggleLiveDemo = () => {
    if (isLive) {
      // Stop demo
      setIsLive(false);
    } else {
      // Start fresh demo
      setVideoEvidence([]);
      setPricingData({
        marketLine: 247.5,
        fairValue: 247.5,
        edge: 0,
        confidence: 50,
        lastUpdate: new Date().toLocaleTimeString()
      });
      setIsLive(true);
    }
  };

  const getEdgeColor = (edge: number) => {
    if (edge > 2) return 'text-green-400';
    if (edge < -2) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'negative': return <TrendingDown className="h-4 w-4 text-red-400" />;
      default: return <Video className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-white text-2xl">
                Real-Time Video Evidence Integration
              </CardTitle>
              <p className="text-slate-400 mt-2">
                Watch how TwelveLabs video AI affects live pricing in real-time
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-slate-400">Demo Speed</div>
                <select 
                  value={simulationSpeed}
                  onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                  className="bg-slate-700 text-white rounded px-2 py-1 text-sm"
                  disabled={isLive}
                >
                  <option value={1000}>Fast (1s)</option>
                  <option value={3000}>Normal (3s)</option>
                  <option value={5000}>Slow (5s)</option>
                </select>
              </div>
              <Button
                onClick={toggleLiveDemo}
                className={isLive ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}
              >
                {isLive ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Stop Demo
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Live Demo
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pricing Dashboard */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-emerald-400" />
              Live Pricing Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Player Prop */}
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-white font-semibold">Gunner Stockton</h3>
                  <p className="text-slate-400 text-sm">Passing Yards O/U</p>
                </div>
                <Badge className="bg-emerald-600">Live</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-slate-400 text-xs">Market Line</div>
                  <div className="text-2xl font-bold text-white">{pricingData.marketLine}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs">Fair Value</div>
                  <div className="text-2xl font-bold text-emerald-400">{pricingData.fairValue}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-slate-400 text-xs">Edge</div>
                  <div className={`text-xl font-bold ${getEdgeColor(pricingData.edge)}`}>
                    {pricingData.edge >= 0 ? '+' : ''}{pricingData.edge}%
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs">Confidence</div>
                  <div className="text-xl font-bold text-white">{pricingData.confidence}%</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="text-slate-500 text-xs">
                  Last Update: {pricingData.lastUpdate}
                </div>
              </div>
            </div>

            {/* Recommendation */}
            {Math.abs(pricingData.edge) > 2 && (
              <div className={`rounded-lg p-4 ${pricingData.edge > 0 ? 'bg-green-900/20 border border-green-700' : 'bg-red-900/20 border border-red-700'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`font-semibold ${pricingData.edge > 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {pricingData.edge > 0 ? 'BET OVER' : 'BET UNDER'}
                    </div>
                    <div className="text-sm text-slate-400">
                      {Math.abs(pricingData.edge)}% edge detected
                    </div>
                  </div>
                  <Badge className={pricingData.edge > 0 ? 'bg-green-600' : 'bg-red-600'}>
                    {pricingData.confidence}% Confidence
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Video Evidence Feed */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Video className="mr-2 h-5 w-5 text-blue-400" />
              Video Evidence Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {videoEvidence.length === 0 && !isLive && (
                <div className="text-center py-8 text-slate-400">
                  <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Start the demo to see video evidence in real-time</p>
                </div>
              )}

              {videoEvidence.length === 0 && isLive && (
                <div className="text-center py-8 text-slate-400">
                  <div className="animate-pulse">
                    <Video className="h-12 w-12 mx-auto mb-3" />
                    <p>Analyzing video moments...</p>
                  </div>
                </div>
              )}

              {videoEvidence.map((evidence) => (
                <div key={evidence.id} className="border border-slate-600 rounded-lg p-3 animate-in slide-in-from-top">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getEvidenceIcon(evidence.evidenceType)}
                      <span className="text-white font-medium">{evidence.playerName}</span>
                    </div>
                    <div className="text-slate-500 text-xs">{evidence.timestamp}</div>
                  </div>
                  
                  <p className="text-slate-300 text-sm mb-3">{evidence.momentDescription}</p>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Weight:</span>
                      <span className="text-emerald-400 ml-1">{evidence.weight}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Δμ:</span>
                      <span className={`ml-1 ${evidence.deltaMu >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {evidence.deltaMu >= 0 ? '+' : ''}{evidence.deltaMu}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Impact:</span>
                      <span className={`ml-1 ${evidence.evidenceType === 'positive' ? 'text-green-400' : evidence.evidenceType === 'negative' ? 'text-red-400' : 'text-blue-400'}`}>
                        {evidence.evidenceType === 'positive' ? '+' : evidence.evidenceType === 'negative' ? '-' : '~'}{Math.abs(evidence.deltaMu * evidence.weight * 30).toFixed(1)} yds
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technical Details */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">
            Technical Integration Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Video className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">TwelveLabs AI</h3>
              <p className="text-slate-400 text-sm">
                Multimodal video understanding extracts player performance moments with contextual analysis
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-emerald-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">Monte Carlo Engine</h3>
              <p className="text-slate-400 text-sm">
                Evidence adjustments modify distribution parameters for real-time fair value calculations
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Play className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">Real-Time Integration</h3>
              <p className="text-slate-400 text-sm">
                WebSocket connections enable instant price updates as new video evidence is processed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}