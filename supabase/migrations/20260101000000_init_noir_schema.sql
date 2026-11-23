-- ==============================================================================
-- NOIR — FACTORY INTELLIGENCE OS
-- Complete Relational Database Schema (PostgreSQL / Supabase)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. UNITS & UNIT CONVERSIONS
CREATE TABLE IF NOT EXISTS units (
    id VARCHAR(16) PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    symbol VARCHAR(16) NOT NULL,
    category VARCHAR(32) NOT NULL -- 'weight', 'volume', 'count'
);

CREATE TABLE IF NOT EXISTS unit_conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_unit VARCHAR(16) REFERENCES units(id),
    to_unit VARCHAR(16) REFERENCES units(id),
    factor NUMERIC(14, 6) NOT NULL, -- multiply from_unit by factor to get to_unit
    product_id UUID, -- NULL for general, or specific product for package/carton rules
    notes TEXT,
    CONSTRAINT unique_conversion UNIQUE (from_unit, to_unit, product_id)
);

-- 2. USER PROFILES & ROLES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('SALESMAN', 'ADMIN', 'PRODUCTION', 'AUDITOR', 'OWNER')),
    phone VARCHAR(32),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CUSTOMERS & PRICING
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    gstin VARCHAR(20),
    state VARCHAR(64) NOT NULL DEFAULT 'Tamil Nadu',
    state_code VARCHAR(4) NOT NULL DEFAULT '33', -- 33 for TN, 29 for KA
    address TEXT NOT NULL,
    phone VARCHAR(32),
    email VARCHAR(128),
    credit_period_days INT DEFAULT 30,
    credit_limit NUMERIC(14, 2) DEFAULT 100000.00,
    salesman_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    gstin VARCHAR(20),
    state VARCHAR(64) NOT NULL DEFAULT 'Tamil Nadu',
    address TEXT,
    phone VARCHAR(32),
    email VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MATERIALS & FINISHED PRODUCTS
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    category VARCHAR(32) NOT NULL CHECK (category IN ('RAW_MATERIAL', 'PACKAGING', 'FINISHED_GOODS')),
    unit VARCHAR(16) REFERENCES units(id),
    opening_stock NUMERIC(14, 4) NOT NULL DEFAULT 0,
    opening_rate NUMERIC(14, 4) NOT NULL DEFAULT 0, -- initial cost per unit
    reorder_level NUMERIC(14, 4) DEFAULT 10,
    hsn_code VARCHAR(16),
    gst_rate NUMERIC(5, 2) DEFAULT 5.00,
    default_selling_price NUMERIC(14, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BILL OF MATERIALS (BOM)
CREATE TABLE IF NOT EXISTS boms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES materials(id) NOT NULL,
    version INT NOT NULL DEFAULT 1,
    name VARCHAR(128) NOT NULL,
    batch_size NUMERIC(14, 4) NOT NULL DEFAULT 1,
    expected_yield_packets NUMERIC(14, 4) NOT NULL,
    standard_cost_estimate NUMERIC(14, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_product_version UNIQUE (product_id, version)
);

CREATE TABLE IF NOT EXISTS bom_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bom_id UUID REFERENCES boms(id) ON DELETE CASCADE NOT NULL,
    material_id UUID REFERENCES materials(id) NOT NULL,
    item_type VARCHAR(32) NOT NULL CHECK (item_type IN ('INGREDIENT', 'PACKAGING')),
    quantity NUMERIC(14, 4) NOT NULL,
    unit VARCHAR(16) REFERENCES units(id) NOT NULL,
    notes TEXT
);

-- 7. STOCK LEDGER (IMMUTABLE AUDIT TRAIL OF ALL MOVEMENTS)
CREATE TABLE IF NOT EXISTS inventory_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES materials(id) NOT NULL,
    transaction_type VARCHAR(32) NOT NULL CHECK (
        transaction_type IN (
            'OPENING_BALANCE',
            'PURCHASE_RECEIPT',
            'PRODUCTION_ISSUE',
            'PRODUCTION_OUTPUT',
            'SALES_DISPATCH',
            'SALES_RETURN',
            'PURCHASE_RETURN',
            'DAMAGE',
            'ADJUSTMENT',
            'CORRECTION'
        )
    ),
    quantity_in NUMERIC(14, 4) NOT NULL DEFAULT 0,
    quantity_out NUMERIC(14, 4) NOT NULL DEFAULT 0,
    unit VARCHAR(16) REFERENCES units(id) NOT NULL,
    unit_cost NUMERIC(14, 4) NOT NULL DEFAULT 0,
    running_balance NUMERIC(14, 4) NOT NULL,
    source_document VARCHAR(64) NOT NULL, -- e.g. 'PURCHASE_ORDER', 'PRODUCTION_RUN', 'DISPATCH'
    reference_id UUID,
    reference_number VARCHAR(64),
    performed_by UUID REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ledger_material ON inventory_ledger(material_id);
CREATE INDEX idx_ledger_created ON inventory_ledger(created_at);

-- 8. PURCHASES
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_number VARCHAR(64) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id) NOT NULL,
    supplier_invoice_no VARCHAR(64),
    purchase_date DATE NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN ('DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED')),
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE NOT NULL,
    material_id UUID REFERENCES materials(id) NOT NULL,
    quantity NUMERIC(14, 4) NOT NULL,
    unit VARCHAR(16) REFERENCES units(id) NOT NULL,
    rate NUMERIC(14, 4) NOT NULL,
    tax_rate NUMERIC(5, 2) DEFAULT 0,
    tax_amount NUMERIC(14, 2) DEFAULT 0,
    total_amount NUMERIC(14, 2) NOT NULL,
    quantity_received NUMERIC(14, 4) DEFAULT 0
);

-- 9. PRODUCTION RUNS
CREATE TABLE IF NOT EXISTS production_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id VARCHAR(64) UNIQUE NOT NULL,
    product_id UUID REFERENCES materials(id) NOT NULL,
    bom_id UUID REFERENCES boms(id) NOT NULL,
    production_date DATE NOT NULL,
    supervisor_id UUID REFERENCES profiles(id),
    planned_output NUMERIC(14, 4) NOT NULL,
    actual_good_output NUMERIC(14, 4) NOT NULL DEFAULT 0,
    rejected_output NUMERIC(14, 4) NOT NULL DEFAULT 0,
    damaged_packaging NUMERIC(14, 4) NOT NULL DEFAULT 0,
    yield_variance_percent NUMERIC(8, 4) DEFAULT 0,
    labour_cost NUMERIC(14, 2) DEFAULT 0,
    power_gas_cost NUMERIC(14, 2) DEFAULT 0,
    other_cost NUMERIC(14, 2) DEFAULT 0,
    material_cost NUMERIC(14, 2) DEFAULT 0,
    packaging_cost NUMERIC(14, 2) DEFAULT 0,
    total_run_cost NUMERIC(14, 2) DEFAULT 0,
    cost_per_packet NUMERIC(14, 4) DEFAULT 0,
    status VARCHAR(32) NOT NULL CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS production_material_consumption (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_run_id UUID REFERENCES production_runs(id) ON DELETE CASCADE NOT NULL,
    material_id UUID REFERENCES materials(id) NOT NULL,
    planned_quantity NUMERIC(14, 4) NOT NULL,
    actual_quantity NUMERIC(14, 4) NOT NULL,
    damaged_quantity NUMERIC(14, 4) DEFAULT 0,
    unit VARCHAR(16) REFERENCES units(id) NOT NULL,
    unit_cost NUMERIC(14, 4) NOT NULL DEFAULT 0,
    total_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
    variance_percent NUMERIC(8, 4) DEFAULT 0
);

-- 10. SALES ORDERS
CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(64) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) NOT NULL,
    salesman_id UUID REFERENCES profiles(id) NOT NULL,
    order_date DATE NOT NULL,
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
    estimated_gst NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL CHECK (
        status IN (
            'DRAFT',
            'SUBMITTED',
            'UNDER_REVIEW',
            'APPROVED',
            'REJECTED',
            'INVOICED',
            'PARTIALLY_DISPATCHED',
            'DISPATCHED',
            'CANCELLED'
        )
    ),
    notes TEXT,
    price_override_reason TEXT,
    stock_shortage_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES materials(id) NOT NULL,
    quantity NUMERIC(14, 4) NOT NULL,
    unit VARCHAR(16) REFERENCES units(id) NOT NULL,
    unit_price NUMERIC(14, 2) NOT NULL,
    standard_price NUMERIC(14, 2) NOT NULL,
    subtotal NUMERIC(14, 2) NOT NULL,
    gst_rate NUMERIC(5, 2) NOT NULL,
    gst_amount NUMERIC(14, 2) NOT NULL,
    total_amount NUMERIC(14, 2) NOT NULL,
    available_stock_at_order NUMERIC(14, 4) DEFAULT 0,
    shortage_quantity NUMERIC(14, 4) DEFAULT 0,
    dispatched_quantity NUMERIC(14, 4) DEFAULT 0
);

-- 11. INVOICES & GST
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(64) UNIQUE NOT NULL,
    financial_year VARCHAR(16) NOT NULL,
    order_id UUID REFERENCES sales_orders(id),
    customer_id UUID REFERENCES customers(id) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    place_of_supply VARCHAR(64) NOT NULL,
    is_interstate BOOLEAN NOT NULL DEFAULT FALSE,
    taxable_amount NUMERIC(14, 2) NOT NULL,
    cgst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    sgst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    igst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_gst_amount NUMERIC(14, 2) NOT NULL,
    total_amount NUMERIC(14, 2) NOT NULL,
    paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    outstanding_amount NUMERIC(14, 2) NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN ('ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED')),
    cancellation_reason TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES materials(id) NOT NULL,
    hsn_code VARCHAR(16) NOT NULL,
    quantity NUMERIC(14, 4) NOT NULL,
    unit VARCHAR(16) REFERENCES units(id) NOT NULL,
    rate NUMERIC(14, 2) NOT NULL,
    taxable_value NUMERIC(14, 2) NOT NULL,
    gst_rate NUMERIC(5, 2) NOT NULL,
    cgst_rate NUMERIC(5, 2) DEFAULT 0,
    cgst_amount NUMERIC(14, 2) DEFAULT 0,
    sgst_rate NUMERIC(5, 2) DEFAULT 0,
    sgst_amount NUMERIC(14, 2) DEFAULT 0,
    igst_rate NUMERIC(5, 2) DEFAULT 0,
    igst_amount NUMERIC(14, 2) DEFAULT 0,
    total_item_amount NUMERIC(14, 2) NOT NULL
);

-- 12. DISPATCHES
CREATE TABLE IF NOT EXISTS dispatches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispatch_number VARCHAR(64) UNIQUE NOT NULL,
    order_id UUID REFERENCES sales_orders(id) NOT NULL,
    invoice_id UUID REFERENCES invoices(id),
    dispatch_date DATE NOT NULL,
    vehicle_number VARCHAR(32),
    delivery_notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dispatch_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispatch_id UUID REFERENCES dispatches(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES materials(id) NOT NULL,
    quantity NUMERIC(14, 4) NOT NULL,
    unit VARCHAR(16) REFERENCES units(id) NOT NULL
);

-- 13. PAYMENTS & ALLOCATIONS
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_number VARCHAR(64) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) NOT NULL,
    payment_date DATE NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    payment_mode VARCHAR(32) NOT NULL CHECK (payment_mode IN ('CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE')),
    reference_number VARCHAR(64),
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE NOT NULL,
    invoice_id UUID REFERENCES invoices(id) NOT NULL,
    allocated_amount NUMERIC(14, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    action VARCHAR(64) NOT NULL,
    entity VARCHAR(64) NOT NULL,
    record_id VARCHAR(64) NOT NULL,
    previous_values JSONB,
    new_values JSONB,
    reason TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
