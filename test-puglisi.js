// Test Ryan Puglisi and Georgia player search
const RAILWAY_URL = 'https://worthy-charisma-production.up.railway.app';

async function testPugliси() {
  console.log('🏈 Testing Ryan Puglisi and Georgia QB search...\n');
  
  const searches = [
    'ryan puglisi',
    'puglisi', 
    'uga puglisi',
    'georgia puglisi',
    'uga qb',
    'georgia qb',
    'bulldogs qb'
  ];
  
  for (const query of searches) {
    try {
      console.log(`🔍 Testing: "${query}"`);
      const response = await fetch(`${RAILWAY_URL}/cfb/players?q=${encodeURIComponent(query)}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   📊 Found ${data.length} players`);
        
        const puglisi = data.find(p => p.name.toLowerCase().includes('puglisi'));
        const georgiaQBs = data.filter(p => p.team === 'Georgia' && p.position === 'QB');
        
        if (puglisi) {
          console.log(`   ✅ Found Ryan Puglisi: ${puglisi.name} (${puglisi.team} ${puglisi.position})`);
        }
        
        if (georgiaQBs.length > 0) {
          console.log(`   🏈 Georgia QBs found: ${georgiaQBs.map(qb => qb.name).join(', ')}`);
        }
        
        if (data.length === 0) {
          console.log(`   ⚠️  No results - triggering live search...`);
        }
        
        // Show top 3 results for context
        data.slice(0, 3).forEach((player, i) => {
          console.log(`   ${i+1}. ${player.name} (${player.team} ${player.position})`);
        });
        
      } else {
        console.log(`   ❌ Search failed: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');
  }
  
  console.log('🎯 If Ryan Puglisi doesn\'t appear, the live search fallback should catch him!');
}

testPugliси().catch(console.error);