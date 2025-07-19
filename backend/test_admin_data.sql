-- Add test admin knowledge data

INSERT INTO admin_knowledge (title, content, department, tags, created_by) VALUES 
('Company Remote Work Policy', 'All employees are eligible for remote work arrangements. Employees can work remotely up to 3 days per week with manager approval. Remote work requests must be submitted at least 1 week in advance. Home office setup allowance of $500 is provided annually.', 'HR', '["remote work", "policy", "benefits"]', 1),

('Employee Leave Policy', 'Annual leave: 20 days per year. Sick leave: 10 days per year. Maternity/Paternity leave: 12 weeks paid. Personal leave must be approved by immediate supervisor. Emergency leave can be taken without prior approval but must be reported within 24 hours.', 'HR', '["leave", "benefits", "time off"]', 1),

('IT Security Guidelines', 'Password requirements: minimum 8 characters with special characters. Two-factor authentication is mandatory for all systems. VPN must be used when accessing company resources remotely. Report security incidents immediately to IT department. Software installations require IT approval.', 'IT', '["security", "IT policy", "passwords"]', 1),

('Employee Benefits Overview', 'Health insurance: 100% premium covered for employee, 80% for family. Dental and vision insurance included. Retirement plan: 401k with 6% company match. Professional development budget: $2000 per year. Gym membership reimbursement up to $100/month.', 'HR', '["benefits", "health insurance", "retirement"]', 1);
