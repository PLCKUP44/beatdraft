const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function initDatabase() {
  console.log('🔧 Initializing database...');
  
  try {
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    await pool.query(schema);
    
    console.log('✅ Database tables created successfully');
    
    // Insert sample data
    console.log('📝 Inserting sample artists...');
    
    const artists = [
      ['06HL4z0CvFAxyc27GXpf02', 'Taylor Swift', '🎤', 95000000, 92000000, 'Mondiale', false, 'Pop', 1],
      ['3TVXtAsR1Inumwj472S9r4', 'Drake', '🦉', 82000000, 78000000, 'Mondiale', false, 'Hip Hop', 3],
      ['4q3ewBCX7sLwd24euuV69X', 'Bad Bunny', '🐰', 112000000, 67000000, 'Mondiale', false, 'Reggaeton', 2],
      ['1McMsnEElThX1knmY4oliG', 'Sfera Ebbasta', '🔵', 8000000, 5200000, 'Grande', false, 'Trap', 5],
      ['36l4JROocfWBrKODx1XmOu', 'Led Zeppelin', '🎸', 16000000, 22000000, 'Leggendario', true, 'Rock', null]
    ];
    
    for (const [spotifyId, name, emoji, listeners, followers, category, legacy, genre, chartPos] of artists) {
      await pool.query(
        `INSERT INTO artists 
         (spotify_id, name, emoji, monthly_listeners, followers, category, is_legacy, genre, chart_position_global)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (spotify_id) DO NOTHING`,
        [spotifyId, name, emoji, listeners, followers, category, legacy, genre, chartPos]
      );
    }
    
    console.log('✅ Sample data inserted');
    console.log('');
    console.log('🎉 Database initialization complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update Spotify API credentials in .env');
    console.log('2. Run: npm run sync');
    console.log('3. Start server: npm start');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();
