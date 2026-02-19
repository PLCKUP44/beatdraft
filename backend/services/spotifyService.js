const axios = require('axios');
const db = require('../config/database');

class SpotifyService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Get Spotify access token
  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const credentials = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64');

    try {
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('Error getting Spotify token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Spotify');
    }
  }

  // Get artist data from Spotify
  async getArtistData(spotifyId) {
    const token = await this.getAccessToken();
    
    try {
      const response = await axios.get(
        `https://api.spotify.com/v1/artists/${spotifyId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      return {
        name: response.data.name,
        followers: response.data.followers.total,
        popularity: response.data.popularity,
        genres: response.data.genres,
        image_url: response.data.images[0]?.url
      };
    } catch (error) {
      console.error(`Error fetching artist ${spotifyId}:`, error.message);
      return null;
    }
  }

  // Calculate category based on monthly listeners
  calculateCategory(monthlyListeners, isLegacy) {
    if (isLegacy) return 'Leggendario';
    if (monthlyListeners >= 50000000) return 'Mondiale';
    if (monthlyListeners >= 5000000) return 'Grande';
    if (monthlyListeners >= 1000000) return 'Emergente';
    return 'Sconosciuto';
  }

  // Sync single artist
  async syncArtist(spotifyId) {
    const data = await this.getArtistData(spotifyId);
    if (!data) return null;

    // Get current artist from DB
    const currentResult = await db.query(
      'SELECT * FROM artists WHERE spotify_id = $1',
      [spotifyId]
    );

    const current = currentResult.rows[0];
    const monthlyListeners = data.followers; // Nota: Spotify API non fornisce monthly listeners direttamente
    
    // Determina categoria
    const category = this.calculateCategory(monthlyListeners, current?.is_legacy || false);

    if (current) {
      // Update existing
      await db.query(
        `UPDATE artists SET
          name = $1, followers = $2, popularity = $3, 
          image_url = $4, category = $5, last_synced_at = CURRENT_TIMESTAMP
         WHERE spotify_id = $6`,
        [data.name, data.followers, data.popularity, data.image_url, category, spotifyId]
      );

      // Save to history
      await db.query(
        `INSERT INTO artist_stats_history 
         (artist_id, monthly_listeners, followers, recorded_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
        [current.id, monthlyListeners, data.followers]
      );

      return { ...current, ...data, category };
    } else {
      // Insert new
      const result = await db.query(
        `INSERT INTO artists 
         (spotify_id, name, followers, monthly_listeners, popularity, category, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [spotifyId, data.name, data.followers, monthlyListeners, data.popularity, category, data.image_url]
      );

      return result.rows[0];
    }
  }

  // Sync all artists in database
  async syncAllArtists() {
    const result = await db.query('SELECT spotify_id FROM artists');
    const artists = result.rows;

    console.log(`📊 Syncing ${artists.length} artists...`);

    for (const artist of artists) {
      try {
        await this.syncArtist(artist.spotify_id);
        console.log(`✅ Synced: ${artist.spotify_id}`);
        // Rate limiting: Spotify allows 100 req/sec, we'll be conservative
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Failed to sync ${artist.spotify_id}:`, error.message);
      }
    }

    console.log('✅ Sync complete!');
  }

  // Calculate growth percentage (last 7 days)
  async calculateGrowth(artistId) {
    const result = await db.query(
      `SELECT monthly_listeners 
       FROM artist_stats_history 
       WHERE artist_id = $1 
         AND recorded_at >= NOW() - INTERVAL '7 days'
       ORDER BY recorded_at DESC 
       LIMIT 2`,
      [artistId]
    );

    if (result.rows.length < 2) return 0;

    const [current, previous] = result.rows;
    return ((current.monthly_listeners - previous.monthly_listeners) / previous.monthly_listeners) * 100;
  }
}

module.exports = new SpotifyService();
