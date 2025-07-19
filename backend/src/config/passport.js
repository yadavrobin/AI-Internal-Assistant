import dotenv from 'dotenv';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { pool } from './database.js';

// Ensure environment variables are loaded
dotenv.config();

console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Found' : 'Missing');
console.log('Google Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'Found' : 'Missing');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const client = await pool.connect();
    
    // Check if user exists
    const existingUser = await client.query(
      'SELECT * FROM users WHERE google_id = $1',
      [profile.id]
    );

    if (existingUser.rows.length > 0) {
      // User exists, return them
      return done(null, existingUser.rows[0]);
    }

    // Check if this will be the first user (auto-admin)
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const isFirstUser = parseInt(userCount.rows[0].count) === 0;

    // Check if email is in admin list from environment
    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(email => email.trim()) : [];
    const isAdminEmail = adminEmails.includes(profile.emails[0].value);

    // Create new user
    const newUser = await client.query(
      `INSERT INTO users (google_id, email, name, avatar_url, is_admin, role, last_login) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [
        profile.id,
        profile.emails[0].value,
        profile.displayName,
        profile.photos[0].value,
        isFirstUser || isAdminEmail,
        (isFirstUser || isAdminEmail) ? 'admin' : 'user'
      ]
    );

    if (isFirstUser) {
      console.log(`🔑 First user ${profile.displayName} (${profile.emails[0].value}) automatically made admin!`);
    } else if (isAdminEmail) {
      console.log(`🔑 Admin user ${profile.displayName} (${profile.emails[0].value}) logged in!`);
    }

    client.release();
    return done(null, newUser.rows[0]);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const client = await pool.connect();
    const user = await client.query('SELECT * FROM users WHERE id = $1', [id]);
    client.release();
    done(null, user.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
