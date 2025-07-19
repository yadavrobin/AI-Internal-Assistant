// Simple script to add admin knowledge data
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function addTestData() {
  console.log('🔍 Starting to add admin knowledge data...');
  
  try {
    // Check current count
    const countResult = await pool.query('SELECT COUNT(*) FROM admin_knowledge');
    console.log(`📊 Current entries: ${countResult.rows[0].count}`);
    
    if (countResult.rows[0].count > 0) {
      console.log('📋 Data already exists, skipping...');
      return;
    }

    // Insert data
    const insertQuery = `
      INSERT INTO admin_knowledge (title, content, department, tags, created_by) VALUES 
      ($1, $2, $3, $4, $5),
      ($6, $7, $8, $9, $10),
      ($11, $12, $13, $14, $15),
      ($16, $17, $18, $19, $20)
    `;
    
    const values = [
      'Company Remote Work Policy', 
      'All employees are eligible for remote work arrangements. Employees can work remotely up to 3 days per week with manager approval. Remote work requests must be submitted at least 1 week in advance. Home office setup allowance of $500 is provided annually.', 
      'HR', 
      JSON.stringify(['remote work', 'policy', 'benefits']), 
      1,
      
      'Employee Leave Policy', 
      'Annual leave: 20 days per year. Sick leave: 10 days per year. Maternity/Paternity leave: 12 weeks paid. Personal leave must be approved by immediate supervisor. Emergency leave can be taken without prior approval but must be reported within 24 hours.', 
      'HR', 
      JSON.stringify(['leave', 'benefits', 'time off']), 
      1,
      
      'IT Security Guidelines', 
      'Password requirements: minimum 8 characters with special characters. Two-factor authentication is mandatory for all systems. VPN must be used when accessing company resources remotely. Report security incidents immediately to IT department. Software installations require IT approval.', 
      'IT', 
      JSON.stringify(['security', 'IT policy', 'passwords']), 
      1,
      
      'Employee Benefits Overview', 
      'Health insurance: 100% premium covered for employee, 80% for family. Dental and vision insurance included. Retirement plan: 401k with 6% company match. Professional development budget: $2000 per year. Gym membership reimbursement up to $100/month.', 
      'HR', 
      JSON.stringify(['benefits', 'health insurance', 'retirement']), 
      1
    ];

    await pool.query(insertQuery, values);
    console.log('✅ Test data inserted successfully!');
    
    // Verify
    const finalCount = await pool.query('SELECT COUNT(*) FROM admin_knowledge');
    console.log(`📊 Final entries: ${finalCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addTestData();
