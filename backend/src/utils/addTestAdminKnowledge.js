import { pool } from '../config/database.js';

const addTestAdminKnowledge = async () => {
  try {
    console.log('🔍 Starting to add test admin knowledge data...');
    console.log('📡 Connecting to database...');
    
    const testData = [
      {
        title: 'Company Remote Work Policy',
        content: 'All employees are eligible for remote work arrangements. Employees can work remotely up to 3 days per week with manager approval. Remote work requests must be submitted at least 1 week in advance. Home office setup allowance of $500 is provided annually.',
        department: 'HR',
        tags: ['remote work', 'policy', 'benefits']
      },
      {
        title: 'Employee Leave Policy',
        content: 'Annual leave: 20 days per year. Sick leave: 10 days per year. Maternity/Paternity leave: 12 weeks paid. Personal leave must be approved by immediate supervisor. Emergency leave can be taken without prior approval but must be reported within 24 hours.',
        department: 'HR',
        tags: ['leave', 'benefits', 'time off']
      },
      {
        title: 'IT Security Guidelines',
        content: 'Password requirements: minimum 8 characters with special characters. Two-factor authentication is mandatory for all systems. VPN must be used when accessing company resources remotely. Report security incidents immediately to IT department. Software installations require IT approval.',
        department: 'IT',
        tags: ['security', 'IT policy', 'passwords']
      },
      {
        title: 'Employee Benefits Overview',
        content: 'Health insurance: 100% premium covered for employee, 80% for family. Dental and vision insurance included. Retirement plan: 401k with 6% company match. Professional development budget: $2000 per year. Gym membership reimbursement up to $100/month.',
        department: 'HR',
        tags: ['benefits', 'health insurance', 'retirement']
      }
    ];

    // First, check if data already exists
    const existingData = await pool.query('SELECT COUNT(*) FROM admin_knowledge');
    console.log(`📊 Current admin knowledge entries: ${existingData.rows[0].count}`);

    if (existingData.rows[0].count > 0) {
      console.log('📋 Admin knowledge data already exists. Skipping insertion.');
      return;
    }

    // Insert test data
    for (const item of testData) {
      await pool.query(
        'INSERT INTO admin_knowledge (title, content, department, tags, created_by) VALUES ($1, $2, $3, $4, $5)',
        [item.title, item.content, item.department, JSON.stringify(item.tags), 1] // Using user ID 1 as default
      );
      console.log(`✅ Added: ${item.title}`);
    }

    console.log('🎉 Test admin knowledge data added successfully!');
    
    // Verify the data was inserted
    const finalCount = await pool.query('SELECT COUNT(*) FROM admin_knowledge');
    console.log(`📊 Final admin knowledge entries: ${finalCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error adding test admin knowledge:', error);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addTestAdminKnowledge()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export default addTestAdminKnowledge;
