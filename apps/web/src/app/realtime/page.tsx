/**
 * Real-time Demo Page
 * Showcases the enhanced PropSage real-time capabilities
 */

'use client';

import React from 'react';
import { AppShell, SectionHeader } from '@/ui';
import { RealtimeDemo } from '@/components/RealtimeDemo';
import { FEATURES } from '@/lib/features';

export default function RealtimeDemoPage() {
  return (
    <AppShell>
      <div className="space-y-8 pb-8">
        <SectionHeader
          title="PropSage Real-time Enhancement"
          subtitle="Experience the future of sports betting analytics with live odds, line movement tracking, and AI-powered edge detection"
        />

        {/* Feature Status Alert */}
        {!FEATURES.realtime && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-white text-sm font-bold">!</span>
              </div>
              <div>
                <h3 className="font-semibold text-yellow-900 mb-2">Real-time Features Disabled</h3>
                <p className="text-yellow-800 text-sm mb-3">
                  To enable real-time features, add these environment variables to your .env.local file:
                </p>
                <code className="block bg-yellow-100 p-3 rounded text-sm text-yellow-900 font-mono">
                  NEXT_PUBLIC_RT_ENABLED=true<br/>
                  NEXT_PUBLIC_LIVE_ODDS=true<br/>
                  NEXT_PUBLIC_WS_ENABLED=true
                </code>
                <p className="text-yellow-700 text-sm mt-2">
                  See <code>.env.realtime</code> for a complete configuration example.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Demo Component */}
        <RealtimeDemo />

        {/* Next Steps */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-4">Next Steps for Implementation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Phase 1: Backend Setup</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Set up PostgreSQL with real-time schema</li>
                <li>• Configure Redis for caching and pub/sub</li>
                <li>• Implement The Odds API provider</li>
                <li>• Create BullMQ job scheduler</li>
                <li>• Add WebSocket server for live updates</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Phase 2: Frontend Integration</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Build core package successfully</li>
                <li>• Integrate useRealtimeData hook</li>
                <li>• Add live prop cards with movement indicators</li>
                <li>• Implement WebSocket connection handling</li>
                <li>• Create virtualized lists for performance</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
            <h4 className="font-medium text-gray-900 mb-2">📖 Complete Implementation Guide</h4>
            <p className="text-sm text-gray-700">
              See <code>REALTIME_ENHANCEMENT_PLAN.md</code> for the complete 5-phase implementation plan 
              with code examples, database schemas, and production deployment strategies.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}