'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Video, TrendingUp, Users, Clock, Target } from 'lucide-react';
import { demoScenarios, type DemoScenario } from '@/lib/demo-scenarios';
import RealtimeVideoEvidence from '@/components/RealtimeVideoEvidence';

interface VideoMoment {
  id: string;
  filename: string;
  actions: string[];
  players: string[];
  teams: string;
  yardage?: number;
  evidenceWeight: number;
  deltaMu: number;
  deltaSigma: number;
  confidence: string;
}

interface DemoState {
  activeScenario: string | null;
  currentStep: number;
  videoMoments: VideoMoment[];
  isLoading: boolean;
  demoMode: 'preview' | 'live' | 'complete';
}

export default function WebinarDemoPage() {
  const [demoState, setDemoState] = useState<DemoState>({
    activeScenario: null,
    currentStep: 0,
    videoMoments: [],
    isLoading: false,
    demoMode: 'preview'
  });

  // Load processed video moments for demo
  useEffect(() => {
    const loadVideoMoments = async () => {
      setDemoState(prev => ({ ...prev, isLoading: true }));
      
      try {
        // In a real app, this would fetch from our processed data API
        // For now, simulate the data structure we created
        const mockVideoMoments: VideoMoment[] = [
          {
            id: 'gunner-stockton-td',
            filename: '9-27 uga alabama Gunner Stockton passes to Colbie Young touchdown.mp4',
            actions: ['touchdown', 'passing'],
            players: ['Gunner Stockton', 'Colbie Young'],
            teams: 'UGA vs Alabama',
            evidenceWeight: 0.8,
            deltaMu: 0.15,
            deltaSigma: -0.05,
            confidence: 'high'
          },
          {
            id: 'ryan-williams-drop',
            filename: '9-27 uga alabama Ryan Williams drops wide open pass.mp4',
            actions: ['drop'],
            players: ['Ryan Williams'],
            teams: 'UGA vs Alabama',
            evidenceWeight: 0.7,
            deltaMu: -0.10,
            deltaSigma: 0.02,
            confidence: 'high'
          },
          {
            id: 'haynes-king-passing',
            filename: '9-27 georgia tech wake forest haynes king passing touchdown from 3rd and 10 to begin comeback.mp4',
            actions: ['touchdown', 'passing'],
            players: ['Haynes King'],
            teams: 'Georgia Tech vs Wake Forest',
            evidenceWeight: 0.8,
            deltaMu: 0.15,
            deltaSigma: -0.05,
            confidence: 'high'
          },
          {
            id: 'haynes-king-rushing',
            filename: '9-27 georgia tech wake forest haynes king running touchdown bringing game to 17-20.mp4',
            actions: ['touchdown', 'rushing'],
            players: ['Haynes King'],
            teams: 'Georgia Tech vs Wake Forest',
            evidenceWeight: 0.8,
            deltaMu: 0.15,
            deltaSigma: -0.05,
            confidence: 'high'
          }
        ];

        setDemoState(prev => ({ 
          ...prev, 
          videoMoments: mockVideoMoments,
          isLoading: false 
        }));
      } catch (error) {
        console.error('Error loading video moments:', error);
        setDemoState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadVideoMoments();
  }, []);

  const startDemo = (scenarioId: string) => {
    setDemoState(prev => ({
      ...prev,
      activeScenario: scenarioId,
      currentStep: 0,
      demoMode: 'live'
    }));
  };

  const nextStep = () => {
    const scenario = getActiveScenario();
    if (scenario && demoState.currentStep < scenario.demoSteps.length - 1) {
      setDemoState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1
      }));
    } else {
      setDemoState(prev => ({
        ...prev,
        demoMode: 'complete'
      }));
    }
  };

  const resetDemo = () => {
    setDemoState(prev => ({
      ...prev,
      activeScenario: null,
      currentStep: 0,
      demoMode: 'preview'
    }));
  };

  const getActiveScenario = (): DemoScenario | null => {
    switch (demoState.activeScenario) {
      case 'edge-detection-live':
        return demoScenarios.SCENARIO_EDGE_DETECTION;
      case 'player-performance-profile':
        return demoScenarios.SCENARIO_PLAYER_PROFILING;
      case 'momentum-context-analysis':
        return demoScenarios.SCENARIO_MOMENTUM_ANALYSIS;
      default:
        return null;
    }
  };

  const getRelevantVideoMoments = (scenario: DemoScenario) => {
    return demoState.videoMoments.filter(moment =>
      scenario.videoAssets.some(asset => moment.filename.includes(asset.split('.')[0]))
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (demoState.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 flex items-center justify-center">
        <div className="text-white text-xl">Loading demo scenarios...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            TwelveLabs Integration
            <span className="text-emerald-400 ml-3">Webinar Demo</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Enterprise-grade video intelligence for sports betting analytics
          </p>
          <div className="flex items-center justify-center mt-6 space-x-6 text-slate-400">
            <div className="flex items-center space-x-2">
              <Video className="h-5 w-5" />
              <span>{demoState.videoMoments.length} Video Moments</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>3 Demo Scenarios</span>
            </div>
            <div className="flex items-center space-x-2">

          {/* Real-time Integration Demo */}
          {demoState.demoMode === 'preview' && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Live Integration Demo
                </h2>
                <p className="text-slate-300 max-w-2xl mx-auto">
                  Experience real-time video evidence integration with live pricing updates
                </p>
              </div>
              <RealtimeVideoEvidence />
            </>
          )}
              <Clock className="h-5 w-5" />
              <span>25 Min Total</span>
            </div>
          </div>
        </div>

        {demoState.demoMode === 'preview' && (
          <>
            {/* Demo Scenarios Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {[
                demoScenarios.SCENARIO_EDGE_DETECTION,
                demoScenarios.SCENARIO_PLAYER_PROFILING,
                demoScenarios.SCENARIO_MOMENTUM_ANALYSIS
              ].map((scenario) => (
                <Card key={scenario.id} className="bg-slate-800/50 border-slate-700 backdrop-blur">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-3">
                      <Badge className={getDifficultyColor(scenario.difficulty)}>
                        {scenario.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-slate-300">
                        {scenario.duration}
                      </Badge>
                    </div>
                    <CardTitle className="text-white text-xl">
                      {scenario.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 mb-4">
                      {scenario.description}
                    </p>
                    
                    <div className="mb-4">
                      <h4 className="text-emerald-400 font-semibold mb-2">Business Value</h4>
                      <p className="text-slate-400 text-sm">
                        {scenario.businessValue}
                      </p>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-emerald-400 font-semibold mb-2">Video Assets</h4>
                      <div className="space-y-1">
                        {getRelevantVideoMoments(scenario).map((moment) => (
                          <div key={moment.id} className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 truncate">
                              {moment.players.join(', ') || 'Unknown Player'}
                            </span>
                            <div className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${getConfidenceColor(moment.confidence)}`} />
                              <span className="text-slate-500">{moment.actions.join(', ')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button 
                      onClick={() => startDemo(scenario.id)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start Demo
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Video Moments Library */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur mb-8">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Video className="mr-2 h-5 w-5" />
                  Processed Video Moments Library
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {demoState.videoMoments.map((moment) => (
                    <div key={moment.id} className="border border-slate-600 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getConfidenceColor(moment.confidence)}`} />
                          <span className="text-white font-medium">
                            {moment.players.join(' & ') || 'Team Play'}
                          </span>
                        </div>
                        <Badge className="text-xs">
                          {moment.teams}
                        </Badge>
                      </div>
                      
                      <p className="text-slate-300 text-sm mb-3">
                        {moment.actions.map(action => action.charAt(0).toUpperCase() + action.slice(1)).join(' + ')}
                        {moment.yardage && ` (${moment.yardage} yards)`}
                      </p>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500">Weight:</span>
                          <span className="text-emerald-400 ml-1">{moment.evidenceWeight}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Δμ:</span>
                          <span className={`ml-1 ${moment.deltaMu >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {moment.deltaMu >= 0 ? '+' : ''}{moment.deltaMu}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Δσ:</span>
                          <span className={`ml-1 ${moment.deltaSigma >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {moment.deltaSigma >= 0 ? '+' : ''}{moment.deltaSigma}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {demoState.demoMode === 'live' && (
          <DemoExecution 
            scenario={getActiveScenario()!}
            currentStep={demoState.currentStep}
            videoMoments={demoState.videoMoments}
            onNextStep={nextStep}
            onReset={resetDemo}
          />
        )}

        {demoState.demoMode === 'complete' && (
          <DemoComplete 
            scenario={getActiveScenario()!}
            onReset={resetDemo}
          />
        )}
      </div>
    </div>
  );
}

function DemoExecution({ scenario, currentStep, videoMoments, onNextStep, onReset }: {
  scenario: DemoScenario;
  currentStep: number;
  videoMoments: VideoMoment[];
  onNextStep: () => void;
  onReset: () => void;
}) {
  const step = scenario.demoSteps[currentStep];
  
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white text-2xl">
              {scenario.title}
            </CardTitle>
            <Button variant="outline" onClick={onReset}>
              Reset Demo
            </Button>
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>Step {currentStep + 1} of {scenario.demoSteps.length}</span>
            <Badge className="bg-emerald-600">{scenario.difficulty}</Badge>
            <Badge variant="outline">{scenario.duration}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border border-slate-600 rounded-lg p-6">
            <h3 className="text-emerald-400 font-semibold text-lg mb-3">
              Action: {step.action}
            </h3>
            
            <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
              <h4 className="text-white font-medium mb-2">Expected Result:</h4>
              <p className="text-slate-300">{step.expectedResult}</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-white font-medium">Key Talking Points:</h4>
              <ul className="space-y-2">
                {step.keyTalkingPoints.map((point, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {step.technicalDetails && (
              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded">
                <h5 className="text-blue-300 font-medium mb-1">Technical Detail:</h5>
                <p className="text-blue-200 text-sm">{step.technicalDetails}</p>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <div className="text-slate-400">
              Progress: {Math.round(((currentStep + 1) / scenario.demoSteps.length) * 100)}%
            </div>
            <Button onClick={onNextStep} className="bg-emerald-600 hover:bg-emerald-700">
              {currentStep === scenario.demoSteps.length - 1 ? 'Complete Demo' : 'Next Step'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DemoComplete({ scenario, onReset }: {
  scenario: DemoScenario;
  onReset: () => void;
}) {
  return (
    <div className="max-w-4xl mx-auto text-center">
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white text-3xl">
            Demo Complete! 🎉
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-xl text-slate-300">
            {scenario.expectedOutcome}
          </div>
          
          <div className="bg-emerald-900/20 border border-emerald-700 rounded-lg p-6">
            <h3 className="text-emerald-300 font-semibold text-lg mb-3">
              Business Value Delivered
            </h3>
            <p className="text-emerald-100">{scenario.businessValue}</p>
          </div>

          <div className="flex justify-center space-x-4">
            <Button onClick={onReset} variant="outline">
              Try Another Demo
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              Schedule Implementation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}