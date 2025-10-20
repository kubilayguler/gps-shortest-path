-- GPS Shortest Path - Seed Data
-- Tables are automatically created by Sequelize sync
-- This script only inserts initial demo data

-- Insert default roles (with priority field)
INSERT INTO roles (id, name, priority, description, created_at, updated_at) VALUES
(1, 'Admin', 1, 'Full system access', NOW(), NOW()),
(2, 'Manager', 2, 'Manage company, warehouses, users, orders', NOW(), NOW()),
(3, 'Employee', 3, 'Create and manage orders', NOW(), NOW()),
(4, 'Driver', 4, 'View assigned orders and calculate routes', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed data: Create a demo company (with status and deleted_at)
INSERT INTO companies (id, name, address, phone, email, latitude, longitude, status, created_at, updated_at, deleted_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Demo Delivery Company', 'Konya, Turkey', '+90 555 123 4567', 'info@demo.com', 37.8746, 32.4932, 'active', NOW(), NOW(), NULL)
ON CONFLICT (id) DO NOTHING;

-- Seed data: Create a demo warehouse (with status and deleted_at)
INSERT INTO warehouses (id, name, address, latitude, longitude, phone, company_id, status, created_at, updated_at, deleted_at) VALUES
('660e8400-e29b-41d4-a716-446655440000', 'Central Warehouse', 'Meram, Konya, Turkey', 37.8557, 32.5085, '+90 555 111 2222', '550e8400-e29b-41d4-a716-446655440000', 'active', NOW(), NOW(), NULL)
ON CONFLICT (id) DO NOTHING;

-- Seed data: Create demo users
-- All passwords are 'demo123' (hashed with bcrypt)

-- Admin user (with last_login and deleted_at)
INSERT INTO users (id, name, email, password, role_id, company_id, warehouse_id, phone, is_active, last_login, created_at, updated_at, deleted_at) VALUES
('770e8400-e29b-41d4-a716-446655440000', 'Admin User', 'admin@demo.com', '$2b$10$7b8/N5HDmsFrZQ94Pg/aZOV.5afi17N0jKQY6yjyCJn1VKS3AkYQG', 1, '550e8400-e29b-41d4-a716-446655440000', NULL, '+90 555 000 0001', true, NULL, NOW(), NOW(), NULL)
ON CONFLICT (email) DO NOTHING;

-- Manager user (with last_login and deleted_at)
INSERT INTO users (id, name, email, password, role_id, company_id, warehouse_id, phone, is_active, last_login, created_at, updated_at, deleted_at) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'Manager User', 'manager@demo.com', '$2b$10$MIZSCSScQbcmIO8KQa.QX.ZBBXgL2oafvBvaq/xIklYxm2pU7nHdG', 2, '550e8400-e29b-41d4-a716-446655440000', NULL, '+90 555 000 0002', true, NULL, NOW(), NOW(), NULL)
ON CONFLICT (email) DO NOTHING;

-- Employee user (with last_login and deleted_at)
INSERT INTO users (id, name, email, password, role_id, company_id, warehouse_id, phone, is_active, last_login, created_at, updated_at, deleted_at) VALUES
('770e8400-e29b-41d4-a716-446655440002', 'Employee User', 'employee@demo.com', '$2b$10$n56wMj.K7xGxKlJ6YOE47elQP.KBO4fc1ukduXjBTq5mwzWS9So0S', 3, '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', '+90 555 000 0003', true, NULL, NOW(), NOW(), NULL)
ON CONFLICT (email) DO NOTHING;

-- Driver user (with last_login and deleted_at)
INSERT INTO users (id, name, email, password, role_id, company_id, warehouse_id, phone, is_active, last_login, created_at, updated_at, deleted_at) VALUES
('770e8400-e29b-41d4-a716-446655440003', 'Driver User', 'driver@demo.com', '$2b$10$JFjEflQznOH2NwKEx1y27OxtMTYJeGxryXflqbxQZWWpxQpzqR8SW', 4, '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', '+90 555 000 0004', true, NULL, NOW(), NOW(), NULL)
ON CONFLICT (email) DO NOTHING;

-- Note: All demo user passwords are 'demo123'
-- Login credentials:
--   admin@demo.com / demo123
--   manager@demo.com / demo123
--   employee@demo.com / demo123
--   driver@demo.com / demo123
