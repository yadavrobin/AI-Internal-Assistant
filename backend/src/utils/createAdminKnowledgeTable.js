import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createAdminKnowledgeTable() {
  try {
    // Create admin_knowledge table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_knowledge (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        department VARCHAR(100),
        tags JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log('✅ admin_knowledge table created successfully');

    // Create index for text search
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_knowledge_content 
      ON admin_knowledge USING gin(to_tsvector('english', content));
    `);

    console.log('✅ Full-text search index created successfully');

    // Create index for tags
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_knowledge_tags 
      ON admin_knowledge USING gin(tags);
    `);

    console.log('✅ Tags index created successfully');

    // Insert some sample data
    const sampleData = [
      {
        title: 'Company Vacation Policy',
        content: 'Employees are entitled to 20 days of paid vacation per year. Vacation requests must be submitted at least 2 weeks in advance through the HR portal. Vacation days cannot be carried over to the next calendar year unless approved by management.',
        department: 'HR',
        tags: ['vacation', 'time-off', 'policy', 'hr']
      },
      {
        title: 'Software Development Guidelines',
        content: 'All code must follow our coding standards and be reviewed by at least one other developer before merging. Use meaningful commit messages and maintain comprehensive documentation. Follow the Git flow branching strategy.',
        department: 'Engineering',
        tags: ['development', 'coding', 'guidelines', 'git']
      },
      {
        title: 'Expense Reimbursement Process',
        content: 'Submit expense reports within 30 days of the expense date. Include original receipts for all expenses over $25. Approved expenses will be reimbursed within 2 weeks. Use the company expense app for submissions.',
        department: 'Finance',
        tags: ['expenses', 'reimbursement', 'finance', 'receipts']
      }
    ];

    for (const entry of sampleData) {
      await pool.query(`
        INSERT INTO admin_knowledge (title, content, department, tags)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
      `, [entry.title, entry.content, entry.department, JSON.stringify(entry.tags)]);
    }

    console.log('✅ Sample knowledge entries added successfully');

  } catch (error) {
    console.error('❌ Error creating admin_knowledge table:', error);
  } finally {
    await pool.end();
  }
}

// Run the migration
createAdminKnowledgeTable();
