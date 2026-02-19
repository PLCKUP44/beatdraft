require('dotenv').config();
const spotifyService = require('../services/spotifyService');

async function syncSpotify() {
  console.log('🎵 Starting Spotify sync...');
  console.log('');
  
  try {
    await spotifyService.syncAllArtists();
    
    console.log('');
    console.log('✅ Sync completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

syncSpotify();
