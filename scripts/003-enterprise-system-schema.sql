-- Enhanced Fintech + Enterprise System Database Migration
-- Includes: Finance, Human Resources, Inventory Management, Security & Access Control

-- Finance Schema
CREATE SCHEMA IF NOT EXISTS finance;

-- Finance Tables
CREATE TABLE IF NOT EXISTS finance.customer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(10),
  country VARCHAR(100),
  id_number VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS finance.account (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES finance.customer(id) ON DELETE CASCADE,
  account_number VARCHAR(20) UNIQUE NOT NULL,
  account_type VARCHAR(50) NOT NULL, -- checking, savings, credit
  balance DECIMAL(15, 2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'active', -- active, frozen, closed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS finance.transaction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES finance.account(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- deposit, withdrawal, transfer, payment
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'completed', -- pending, completed, failed, reversed
  reference_number VARCHAR(50) UNIQUE,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS finance.transfer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_account_id UUID NOT NULL REFERENCES finance.account(id),
  to_account_id UUID NOT NULL REFERENCES finance.account(id),
  amount DECIMAL(15, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, cancelled
  scheduled_date TIMESTAMP,
  execution_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS finance.bill (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES finance.account(id) ON DELETE CASCADE,
  payee_name VARCHAR(255) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'unpaid', -- unpaid, paid, overdue
  recurring BOOLEAN DEFAULT FALSE,
  frequency VARCHAR(20), -- monthly, weekly, annual
  last_paid_date DATE,
  next_due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Human Resources Schema
CREATE SCHEMA IF NOT EXISTS human_resource;

CREATE TABLE IF NOT EXISTS human_resource.department (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  budget DECIMAL(15, 2),
  manager_id UUID,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS human_resource.employee (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  department_id UUID NOT NULL REFERENCES human_resource.department(id),
  position VARCHAR(100) NOT NULL,
  salary DECIMAL(15, 2),
  employment_type VARCHAR(50), -- full-time, part-time, contract
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, on_leave
  hire_date DATE NOT NULL,
  termination_date DATE,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(10),
  country VARCHAR(100),
  emergency_contact VARCHAR(255),
  emergency_phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS human_resource.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES human_resource.employee(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP NOT NULL,
  check_out_time TIMESTAMP,
  status VARCHAR(20) DEFAULT 'present', -- present, absent, late, early_leave
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS human_resource.payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES human_resource.employee(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_salary DECIMAL(15, 2) NOT NULL,
  overtime_hours DECIMAL(5, 2) DEFAULT 0,
  overtime_amount DECIMAL(15, 2) DEFAULT 0,
  deductions DECIMAL(15, 2) DEFAULT 0,
  bonuses DECIMAL(15, 2) DEFAULT 0,
  net_salary DECIMAL(15, 2) NOT NULL,
  payment_date DATE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, processed, paid
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS human_resource.leave_request (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES human_resource.employee(id) ON DELETE CASCADE,
  leave_type VARCHAR(50) NOT NULL, -- sick, vacation, personal, unpaid
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled
  approved_by UUID REFERENCES human_resource.employee(id),
  approval_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Management Schema
CREATE SCHEMA IF NOT EXISTS inventory;

CREATE TABLE IF NOT EXISTS inventory.category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory.product (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID NOT NULL REFERENCES inventory.category(id),
  unit_price DECIMAL(15, 2) NOT NULL,
  cost_price DECIMAL(15, 2) NOT NULL,
  quantity_in_stock INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 10,
  supplier_id UUID,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory.supplier (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  country VARCHAR(100),
  payment_terms VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory.stock_transaction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES inventory.product(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- purchase, sale, adjustment, return
  quantity INTEGER NOT NULL,
  reference_id VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory.purchase_order (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES inventory.supplier(id),
  order_date DATE NOT NULL,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  total_amount DECIMAL(15, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, received, cancelled, partial
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory.purchase_order_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES inventory.purchase_order(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES inventory.product(id),
  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  unit_price DECIMAL(15, 2) NOT NULL,
  total_price DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Security & Access Control Schema
CREATE SCHEMA IF NOT EXISTS security;

CREATE TABLE IF NOT EXISTS security.user_account (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  profile_image_url TEXT,
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended, locked
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security.role (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security.permission (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  module VARCHAR(100), -- finance, hr, inventory, admin
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security.role_permission (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES security.role(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES security.permission(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS security.user_role (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES security.user_account(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES security.role(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by UUID,
  UNIQUE(user_id, role_id)
);

CREATE TABLE IF NOT EXISTS security.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES security.user_account(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'success', -- success, failure
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security.session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES security.user_account(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Performance Optimization

-- Finance Indexes
CREATE INDEX IF NOT EXISTS idx_transaction_account_id
ON finance.transaction USING btree (account_id);

CREATE INDEX IF NOT EXISTS idx_transaction_created_at
ON finance.transaction USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transaction_status
ON finance.transaction USING btree (status);

CREATE INDEX IF NOT EXISTS idx_account_customer_id
ON finance.account USING btree (customer_id);

CREATE INDEX IF NOT EXISTS idx_account_status
ON finance.account USING btree (status);

CREATE INDEX IF NOT EXISTS idx_transfer_from_account
ON finance.transfer USING btree (from_account_id);

CREATE INDEX IF NOT EXISTS idx_transfer_to_account
ON finance.transfer USING btree (to_account_id);

CREATE INDEX IF NOT EXISTS idx_transfer_created_at
ON finance.transfer USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bill_account_id
ON finance.bill USING btree (account_id);

CREATE INDEX IF NOT EXISTS idx_bill_status
ON finance.bill USING btree (status);

-- Human Resources Indexes
CREATE INDEX IF NOT EXISTS idx_employee_department_id
ON human_resource.employee USING btree (department_id);

CREATE INDEX IF NOT EXISTS idx_employee_first_name_last_name
ON human_resource.employee USING btree (first_name, last_name);

CREATE INDEX IF NOT EXISTS idx_employee_email
ON human_resource.employee USING btree (email);

CREATE INDEX IF NOT EXISTS idx_employee_status
ON human_resource.employee USING btree (status);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_id
ON human_resource.attendance USING btree (employee_id);

CREATE INDEX IF NOT EXISTS idx_attendance_created_at
ON human_resource.attendance USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payroll_employee_id
ON human_resource.payroll USING btree (employee_id);

CREATE INDEX IF NOT EXISTS idx_payroll_period
ON human_resource.payroll USING btree (period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_leave_request_employee_id
ON human_resource.leave_request USING btree (employee_id);

CREATE INDEX IF NOT EXISTS idx_leave_request_status
ON human_resource.leave_request USING btree (status);

-- Inventory Indexes
CREATE INDEX IF NOT EXISTS idx_product_category_id
ON inventory.product USING btree (category_id);

CREATE INDEX IF NOT EXISTS idx_product_sku
ON inventory.product USING btree (sku);

CREATE INDEX IF NOT EXISTS idx_product_status
ON inventory.product USING btree (status);

CREATE INDEX IF NOT EXISTS idx_stock_transaction_product_id
ON inventory.stock_transaction USING btree (product_id);

CREATE INDEX IF NOT EXISTS idx_stock_transaction_created_at
ON inventory.stock_transaction USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_purchase_order_supplier_id
ON inventory.purchase_order USING btree (supplier_id);

CREATE INDEX IF NOT EXISTS idx_purchase_order_status
ON inventory.purchase_order USING btree (status);

CREATE INDEX IF NOT EXISTS idx_purchase_order_item_po_id
ON inventory.purchase_order_item USING btree (purchase_order_id);

-- Security Indexes
CREATE INDEX IF NOT EXISTS idx_user_account_email
ON security.user_account USING btree (email);

CREATE INDEX IF NOT EXISTS idx_user_account_username
ON security.user_account USING btree (username);

CREATE INDEX IF NOT EXISTS idx_user_account_status
ON security.user_account USING btree (status);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id
ON security.audit_log USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
ON security.audit_log USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_session_user_id
ON security.session USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_session_expires_at
ON security.session USING btree (expires_at);

-- Enable RLS and Create Policies
ALTER TABLE finance.customer ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.account ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.transaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_resource.employee ENABLE ROW LEVEL SECURITY;
ALTER TABLE security.user_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.product ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT USAGE ON SCHEMA finance TO authenticated;
GRANT USAGE ON SCHEMA human_resource TO authenticated;
GRANT USAGE ON SCHEMA inventory TO authenticated;
GRANT USAGE ON SCHEMA security TO authenticated;
