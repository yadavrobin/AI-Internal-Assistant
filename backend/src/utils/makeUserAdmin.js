import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function makeUserAdmin() {
  try {
    // Get all users
    const users = await pool.query('SELECT id, email, name, is_admin FROM users ORDER BY created_at ASC');
    
    console.log('\n📋 Current users:');
    users.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Admin: ${user.is_admin}`);
    });

    if (users.rows.length === 0) {
      console.log('❌ No users found. Please login with Google first.');
      return;
    }

    // Make the first user admin
    const firstUser = users.rows[0];
    await pool.query('UPDATE users SET is_admin = true, role = $1 WHERE id = $2', ['admin', firstUser.id]);
    
    console.log(`\n✅ Made ${firstUser.name} (${firstUser.email}) an admin!`);
    
    // Verify the change
    const updatedUser = await pool.query('SELECT * FROM users WHERE id = $1', [firstUser.id]);
    console.log('✅ Verified:', updatedUser.rows[0]);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

makeUserAdmin();
