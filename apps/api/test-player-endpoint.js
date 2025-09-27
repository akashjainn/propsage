// Test the new player by ID endpoint
const API_BASE = process.env.API_URL || 'http://localhost:3001';

async function testPlayerEndpoint() {
  console.log('Testing CFB player by ID endpoint...');
  
  // Test with Ryan Puglisi's ID (if it exists in the system)
  const testPlayerId = 'cfb_ryan_puglisi';
  
  try {
    console.log(`\nFetching player: ${testPlayerId}`);
    const response = await fetch(`${API_BASE}/cfb/players/${testPlayerId}`);
    
    console.log(`Response status: ${response.status}`);
    
    if (response.ok) {
      const player = await response.json();
      console.log('Player found:');
      console.log(`- Name: ${player.name}`);
      console.log(`- Team: ${player.team}`);
      console.log(`- Position: ${player.position}`);
      console.log(`- Team Color: ${player.teamColor}`);
    } else {
      const error = await response.json();
      console.log('Player not found:', error);
      
      // Try searching for Ryan Puglisi instead
      console.log('\nTrying player search for "Ryan Puglisi"...');
      const searchResponse = await fetch(`${API_BASE}/cfb/players?q=ryan%20puglisi`);
      if (searchResponse.ok) {
        const searchResults = await searchResponse.json();
        console.log(`Found ${searchResults.length} players in search`);
        if (searchResults.length > 0) {
          const player = searchResults[0];
          console.log('First search result:');
          console.log(`- ID: ${player.id}`);
          console.log(`- Name: ${player.name}`);
          console.log(`- Team: ${player.team}`);
          console.log(`- Position: ${player.position}`);
          
          // Now test the endpoint with the actual ID
          console.log(`\nTesting endpoint with actual ID: ${player.id}`);
          const idResponse = await fetch(`${API_BASE}/cfb/players/${player.id}`);
          if (idResponse.ok) {
            const playerById = await idResponse.json();
            console.log('Player by ID endpoint works:');
            console.log(`- Name: ${playerById.name}`);
            console.log(`- Team: ${playerById.team}`);
            console.log(`- Position: ${playerById.position}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error testing endpoint:', error);
  }
}

// Run if called directly
if (require.main === module) {
  testPlayerEndpoint();
}

module.exports = { testPlayerEndpoint };