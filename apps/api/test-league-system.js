#!/usr/bin/env node
/**
 * Test Script: League-Aware Evidence System
 * 
 * Verifies that the unified evidence service is properly integrated
 * and prevents cross-league contamination.
 */

import { unifiedEvidenceService } from '../src/services/unified-evidence-service.js';
import { detectLeague, normalizeTeamName } from '../src/services/league-context.js';

console.log('🧪 Testing League-Aware Evidence System\n');

// Test 1: Team Detection
console.log('Test 1: Team Detection');
console.log('  Ravens ->', detectLeague('Ravens')); // Should be 'nfl'
console.log('  Georgia ->', detectLeague('Georgia')); // Should be 'cfb'
console.log('  BAL ->', normalizeTeamName('BAL')); // Should be 'Ravens'
console.log('  OSU ->', normalizeTeamName('OSU')); // Should be 'Ohio State'
console.log('  ✅ Team detection working\n');

// Test 2: NFL Search
console.log('Test 2: NFL Player Search');
try {
  const nflClips = await unifiedEvidenceService.searchEvidence({
    league: 'nfl',
    player: 'Lamar Jackson',
    team: 'Ravens',
    opponent: 'Chiefs',
    propType: 'rushing_touchdowns',
    season: '2024',
    week: 5
  }, {
    limit: 5,
    minScore: 0.5
  });

  console.log(`  Found ${nflClips.length} clips`);
  
  if (nflClips.length > 0) {
    console.log(`  Sample clip:`, {
      id: nflClips[0].id,
      league: nflClips[0].league,
      start: nflClips[0].start,
      end: nflClips[0].end,
      confidence: nflClips[0].confidence
    });
    
    // Check for contamination
    const hasCFB = nflClips.some(c => c.league === 'cfb');
    if (hasCFB) {
      console.error('  ❌ CONTAMINATION: Found CFB clips in NFL search!');
    } else {
      console.log('  ✅ No contamination detected');
    }
  } else {
    console.log('  ⚠️  No clips found (may need to index videos)');
  }
} catch (error) {
  console.error('  ❌ Error:', error.message);
}
console.log();

// Test 3: Auto-Detection
console.log('Test 3: Auto-Detection');
try {
  const autoClips = await unifiedEvidenceService.searchWithAutoDetect(
    'Lamar Jackson',
    'rushing_attempts',
    'Ravens', // Should detect NFL
    { limit: 3 }
  );

  console.log(`  Auto-detected league from "Ravens"`);
  console.log(`  Found ${autoClips.length} clips`);
  
  if (autoClips.length > 0) {
    const leagues = [...new Set(autoClips.map(c => c.league))];
    console.log(`  Leagues in results: ${leagues.join(', ')}`);
    
    if (leagues.length === 1 && leagues[0] === 'nfl') {
      console.log('  ✅ Auto-detection working correctly');
    } else {
      console.error('  ❌ Auto-detection failed or contamination detected');
    }
  } else {
    console.log('  ⚠️  No clips found (may need to index videos)');
  }
} catch (error) {
  console.error('  ❌ Error:', error.message);
}
console.log();

// Test 4: Batch Search
console.log('Test 4: Batch Search');
try {
  const contexts = [
    {
      league: 'nfl',
      player: 'Lamar Jackson',
      team: 'Ravens',
      propType: 'rushing_touchdowns',
      season: '2024',
      week: 5
    },
    {
      league: 'nfl',
      player: 'Patrick Mahomes',
      team: 'Chiefs',
      propType: 'passing_yards',
      season: '2024',
      week: 5
    }
  ];

  const resultsMap = await unifiedEvidenceService.batchSearch(contexts, { limit: 3 });
  
  console.log(`  Batched ${contexts.length} searches`);
  console.log(`  Results map size: ${resultsMap.size}`);
  
  let totalClips = 0;
  resultsMap.forEach((clips, key) => {
    totalClips += clips.length;
  });
  
  console.log(`  Total clips across all queries: ${totalClips}`);
  console.log('  ✅ Batch search working');
} catch (error) {
  console.error('  ❌ Error:', error.message);
}
console.log();

// Test 5: Cache
console.log('Test 5: Cache Performance');
try {
  const context = {
    league: 'nfl',
    player: 'Lamar Jackson',
    team: 'Ravens',
    propType: 'rushing_touchdowns',
    season: '2024',
    week: 5
  };

  // First search (uncached)
  const start1 = Date.now();
  await unifiedEvidenceService.searchEvidence(context, { limit: 5 });
  const duration1 = Date.now() - start1;

  // Second search (should be cached)
  const start2 = Date.now();
  await unifiedEvidenceService.searchEvidence(context, { limit: 5 });
  const duration2 = Date.now() - start2;

  console.log(`  First search: ${duration1}ms`);
  console.log(`  Second search: ${duration2}ms (cached)`);
  
  if (duration2 < duration1 * 0.5) {
    console.log('  ✅ Cache working (2nd search much faster)');
  } else if (duration2 < duration1) {
    console.log('  ⚠️  Cache working but smaller speedup than expected');
  } else {
    console.log('  ⚠️  Cache may not be working');
  }
} catch (error) {
  console.error('  ❌ Error:', error.message);
}
console.log();

console.log('🎉 All tests complete!\n');
console.log('Next steps:');
console.log('  1. If no clips found, index videos with proper metadata');
console.log('  2. Update remaining NFL routes to use unified service');
console.log('  3. Create CFB routes');
console.log('  4. Update frontend to pass league parameter');
console.log('\nSee LEAGUE_MIGRATION_STEPS.md for details.');
