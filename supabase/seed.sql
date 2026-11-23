-- ==============================================================================
-- NOIR — BENCHMARK SEED DATA SCRIPT (Fictional Demo Data)
-- Factory: NOIR Snacks Manufacturing, Tamil Nadu
-- ==============================================================================

-- 1. Units
INSERT INTO units (id, name, symbol, category) VALUES
('kg', 'Kilogram', 'kg', 'weight'),
('g', 'Gram', 'g', 'weight'),
('L', 'Litre', 'L', 'volume'),
('ml', 'Millilitre', 'ml', 'volume'),
('pkt', 'Packet', 'pkt', 'count'),
('pcs', 'Pieces', 'pcs', 'count'),
('ctn', 'Carton', 'ctn', 'count')
ON CONFLICT (id) DO NOTHING;

-- 2. Profiles (Demo Users for all roles)
INSERT INTO profiles (id, email, full_name, role, phone) VALUES
('11111111-1111-1111-1111-111111111111', 'owner@noir-factory.com', 'K. Senthil Nathan', 'OWNER', '+91 98765 00001'),
('22222222-2222-2222-2222-222222222222', 'admin@noir-factory.com', 'R. Meenakshi', 'ADMIN', '+91 98765 00002'),
('33333333-3333-3333-3333-333333333333', 'production@noir-factory.com', 'M. Velmurugan', 'PRODUCTION', '+91 98765 00003'),
('44444444-4444-4444-4444-444444444444', 'sales.a@noir-factory.com', 'K. Rajesh (Salesman A)', 'SALESMAN', '+91 98765 00004'),
('55555555-5555-5555-5555-555555555555', 'sales.b@noir-factory.com', 'P. Anand (Salesman B)', 'SALESMAN', '+91 98765 00005'),
('66666666-6666-6666-6666-666666666666', 'auditor@auditfirm-tn.com', 'C.A. Sundaram', 'AUDITOR', '+91 98765 00006')
ON CONFLICT (email) DO NOTHING;

-- 3. Customers
INSERT INTO customers (id, code, name, business_name, gstin, state, state_code, address, phone, credit_period_days, salesman_id) VALUES
('aaaa1111-1111-1111-1111-111111111111', 'CUST-001', 'Retailer A', 'Sri Krishna Provision Stores', '33ABCDE1234F1Z5', 'Tamil Nadu', '33', '124 Netaji Road, Tiruchirappalli, Tamil Nadu', '+91 94431 11222', 30, '44444444-4444-4444-4444-444444444444'),
('bbbb2222-2222-2222-2222-222222222222', 'CUST-002', 'Distributor B', 'Karnataka Fine Foods Agency', '29XYZAB5678G2Z1', 'Karnataka', '29', '45 B.T.M. Layout, Bengaluru, Karnataka', '+91 98801 33444', 45, '55555555-5555-5555-5555-555555555555')
ON CONFLICT (code) DO NOTHING;

-- 4. Supplier
INSERT INTO suppliers (id, code, name, gstin, state, address, phone) VALUES
('supp1111-1111-1111-1111-111111111111', 'SUPP-001', 'Southern Agro Mills', '33AABCS4455P1Z8', 'Tamil Nadu', 'Plot 18, SIDCO Industrial Estate, Madurai', '+91 94422 99881')
ON CONFLICT (code) DO NOTHING;

-- 5. Materials & Finished Goods (Opening Inventory as per prompt)
INSERT INTO materials (id, sku, name, category, unit, opening_stock, opening_rate, reorder_level, hsn_code, gst_rate, default_selling_price) VALUES
('mat-flour-1111', 'RAW-FLOUR-01', 'Rice Flour Premium', 'RAW_MATERIAL', 'kg', 100.0, 42.00, 50.0, '1102', 5.0, 0),
('mat-oil-2222', 'RAW-OIL-01', 'Cooking Oil Refined', 'RAW_MATERIAL', 'L', 30.0, 140.00, 15.0, '1515', 5.0, 0),
('mat-spice-3333', 'RAW-SPICE-01', 'Salt & Spice Mix Formula A', 'RAW_MATERIAL', 'kg', 5.0, 200.00, 2.0, '0910', 5.0, 0),
('mat-pouch-4444', 'PKG-POUCH-200', 'Murukku 200g Printed Pouch', 'PACKAGING', 'pcs', 500.0, 2.50, 150.0, '3923', 18.0, 0),
('mat-carton-5555', 'PKG-CTN-20PKT', 'Master Corrugated Carton (20 pkts)', 'PACKAGING', 'pcs', 30.0, 15.00, 10.0, '4819', 18.0, 0),
('mat-murukku-6666', 'FG-MURUKKU-200', 'Murukku 200g Packaged Snack', 'FINISHED_GOODS', 'pkt', 50.0, 31.00, 30.0, '19059040', 5.0, 50.00)
ON CONFLICT (sku) DO NOTHING;

-- 6. BOM (Murukku 200g, 1 batch = 200 packets)
INSERT INTO boms (id, product_id, version, name, batch_size, expected_yield_packets, standard_cost_estimate) VALUES
('bom-murukku-v1', 'mat-murukku-6666', 1, 'Standard Murukku 200g Batch Formula', 1.0, 200.0, 6200.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO bom_items (id, bom_id, material_id, item_type, quantity, unit, notes) VALUES
(uuid_generate_v4(), 'bom-murukku-v1', 'mat-flour-1111', 'INGREDIENT', 40.0, 'kg', 'Base flour'),
(uuid_generate_v4(), 'bom-murukku-v1', 'mat-oil-2222', 'INGREDIENT', 10.0, 'L', 'Frying oil absorption'),
(uuid_generate_v4(), 'bom-murukku-v1', 'mat-spice-3333', 'INGREDIENT', 1.2, 'kg', 'Seasoning & salt'),
(uuid_generate_v4(), 'bom-murukku-v1', 'mat-pouch-4444', 'PACKAGING', 200.0, 'pcs', 'Individual pouch'),
(uuid_generate_v4(), 'bom-murukku-v1', 'mat-carton-5555', 'PACKAGING', 10.0, 'pcs', '10 cartons for 200 pkts')
ON CONFLICT DO NOTHING;

-- 7. Initial Opening Ledger Entries
INSERT INTO inventory_ledger (material_id, transaction_type, quantity_in, quantity_out, unit, unit_cost, running_balance, source_document, reference_number, notes) VALUES
('mat-flour-1111', 'OPENING_BALANCE', 100.0, 0, 'kg', 42.00, 100.0, 'SYSTEM_INIT', 'INIT-2026-001', 'Opening physical count'),
('mat-oil-2222', 'OPENING_BALANCE', 30.0, 0, 'L', 140.00, 30.0, 'SYSTEM_INIT', 'INIT-2026-002', 'Opening physical count'),
('mat-spice-3333', 'OPENING_BALANCE', 5.0, 0, 'kg', 200.00, 5.0, 'SYSTEM_INIT', 'INIT-2026-003', 'Opening physical count'),
('mat-pouch-4444', 'OPENING_BALANCE', 500.0, 0, 'pcs', 2.50, 500.0, 'SYSTEM_INIT', 'INIT-2026-004', 'Opening packaging stock'),
('mat-carton-5555', 'OPENING_BALANCE', 30.0, 0, 'pcs', 15.00, 30.0, 'SYSTEM_INIT', 'INIT-2026-005', 'Opening carton stock'),
('mat-murukku-6666', 'OPENING_BALANCE', 50.0, 0, 'pkt', 31.00, 50.0, 'SYSTEM_INIT', 'INIT-2026-006', 'Opening finished goods batch')
ON CONFLICT DO NOTHING;
