import { pool } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    console.log('Database URL configured:', process.env.DATABASE_URL ? 'Yes' : 'No');

    // Sample users
    const users = [
      {
        email: 'admin@company.com',
        name: 'Admin User',
        role: 'admin',
        is_admin: true,
        department: 'IT',
      },
      {
        email: 'john.doe@company.com',
        name: 'John Doe',
        role: 'user',
        is_admin: false,
        department: 'Engineering',
      },
      {
        email: 'jane.smith@company.com',
        name: 'Jane Smith',
        role: 'user',
        is_admin: false,
        department: 'HR',
      },
    ];

    // Insert users
    for (const user of users) {
      try {
        await pool.query(
          `INSERT INTO users (email, name, role, is_admin, department) 
           VALUES ($1, $2, $3, $4, $5) 
           ON CONFLICT (email) DO NOTHING`,
          [user.email, user.name, user.role, user.is_admin, user.department]
        );
        console.log(`✅ User created: ${user.name}`);
      } catch (error) {
        console.log(`⚠️ User already exists: ${user.name}`);
      }
    }

    // Sample knowledge documents
    const documents = [
      {
        title: 'Employee Handbook 2024',
        content: `Welcome to our company! This handbook contains important information about company policies, procedures, and benefits.

Key Topics:
- Work Schedule: Standard hours are 9 AM to 5 PM, Monday through Friday
- Remote Work Policy: Employees may work remotely up to 3 days per week with manager approval
- Vacation Policy: All full-time employees receive 15 days of paid vacation annually
- Health Benefits: Comprehensive health insurance including medical, dental, and vision
- Code of Conduct: Professional behavior is expected at all times
- IT Security: Use strong passwords and enable two-factor authentication
- Reporting Issues: Contact HR at hr@company.com for any workplace concerns`,
        source: 'confluence',
        source_url: 'https://company.atlassian.net/wiki/spaces/HR/pages/123456/Employee+Handbook',
        department: 'HR',
        tags: ['handbook', 'policies', 'benefits', 'hr'],
        metadata: { version: '2024.1', lastReviewed: '2024-01-01' },
      },
      {
        title: 'IT Security Guidelines',
        content: `Information Technology Security Guidelines

Password Requirements:
- Minimum 12 characters
- Include uppercase, lowercase, numbers, and special characters
- Change passwords every 90 days
- Do not reuse last 12 passwords

Two-Factor Authentication:
- Required for all company systems
- Use company-approved authenticator apps
- Backup codes must be stored securely

Data Protection:
- Classify data as Public, Internal, Confidential, or Restricted
- Encrypt sensitive data both in transit and at rest
- Report data breaches immediately to security@company.com
- Do not share credentials or access with unauthorized personnel

Remote Work Security:
- Use company VPN for all work activities
- Ensure home WiFi networks are secured
- Lock screens when away from workstation
- Use only company-approved cloud services`,
        source: 'confluence',
        source_url: 'https://company.atlassian.net/wiki/spaces/IT/pages/789012/Security+Guidelines',
        department: 'IT',
        tags: ['security', 'passwords', 'data-protection', 'vpn'],
        metadata: { version: '3.2', lastReviewed: '2024-06-15' },
      },
      {
        title: 'Development Standards and Best Practices',
        content: `Development Standards and Best Practices

Code Quality:
- All code must pass automated tests before merging
- Code coverage should be at least 80%
- Use consistent coding standards and formatting
- Conduct peer code reviews for all changes

Git Workflow:
- Use feature branches for all development
- Write clear, descriptive commit messages
- Squash commits before merging to main
- Tag releases with semantic versioning

Documentation:
- Maintain up-to-date README files
- Document all public APIs and functions
- Include setup and deployment instructions
- Update architecture diagrams as needed

Testing:
- Write unit tests for all business logic
- Include integration tests for API endpoints
- Perform manual testing before releases
- Use automated testing in CI/CD pipeline

Deployment:
- Use blue-green deployment strategy
- Test in staging environment first
- Monitor application performance post-deployment
- Have rollback plan ready for production issues`,
        source: 'confluence',
        source_url: 'https://company.atlassian.net/wiki/spaces/ENG/pages/345678/Development+Standards',
        department: 'Engineering',
        tags: ['development', 'coding', 'testing', 'deployment'],
        metadata: { version: '2.1', lastReviewed: '2024-05-20' },
      },
    ];

    // Insert documents
    for (const doc of documents) {
      try {
        const result = await pool.query(
          `INSERT INTO knowledge_documents (title, content, source, source_url, department, tags, metadata) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [doc.title, doc.content, doc.source, doc.source_url, doc.department, doc.tags, JSON.stringify(doc.metadata)]
        );
        console.log(`✅ Document created: ${doc.title} (ID: ${result.rows[0].id})`);
      } catch (error) {
        console.log(`❌ Error creating document ${doc.title}:`, error.message);
      }
    }

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await pool.end();
  }
};

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedData();
}

export { seedData };
