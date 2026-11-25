# NOIR — Factory Intelligence OS

> **Tagline:** *Every material. Every movement. Every number. Accounted for.*

NOIR is an industrial-grade manufacturing intelligence operating system engineered specifically for packaged food manufacturers (Murukku, Mixture, Chips, Sweets). It connects the entire operational chain:

$$\text{Sales} \longrightarrow \text{Order Verification} \longrightarrow \text{Production} \longrightarrow \text{BOM} \longrightarrow \text{Raw Materials} \longrightarrow \text{Finished Goods} \longrightarrow \text{Dispatch} \longrightarrow \text{GST Billing} \longrightarrow \text{Payments} \longrightarrow \text{Costing} \longrightarrow \text{Audit}$$

---

## 1. Overview & Core Philosophy

Generic ERPs and accounting software treat inventory as a passive spreadsheet cell that gets overwritten. In industrial snack manufacturing, this causes phantom stock, unrecorded cooking oil absorption, unnoticed packaging damage, and inaccurate profit margins.

**The NOIR Philosophy:**
1. **Transactions are entered once** at their point of physical occurrence.
2. **Every stock movement is traceable** through an immutable double-entry ledger.
3. **Production is strictly measured against recipe standards (BOM)** with automated variance detection ($\pm 3.0\%$ tolerance).
4. **Actual batch costs are computed from weighted-average raw material costs**, physical oil/spice consumption, direct shift labour, and fuel/power meters.
5. **Damaged packaging is tracked separately from edible food waste.**
6. **Sales and Production share a synchronized single inventory.** Negative dispatches are strictly prohibited.
7. **Statutory and financial auditors can drill down from any balance directly to its atomic movement.**

---

## 2. Visual Identity & Interface

The interface takes its cues from a small-batch South Indian food factory: warm paper, chilli, turmeric, and printed-label details, with glass used lightly for depth.
- **Canvas:** warm ivory with restrained coral, turmeric, and sky-blue light
- **Panels:** translucent warm-white surfaces with fine borders and soft shadows
- **Primary Accent:** chilli red with a saffron-orange highlight
- **Status Colors:** teal for healthy, amber for warnings, red for critical exceptions, and indigo for informational states
- **Typography:** Outfit for the interface and Fraunces for editorial headings

The role-based login opens the command center after a valid demo account is selected. The dashboard prioritizes the benchmark workflow with live operating metrics, stock and dispatch pipeline, variance alerts, and recent orders. Layouts adapt to desktop, tablet, and mobile screens.

---

## 3. Technology Stack

- **Frontend:** React 18, TypeScript 5, Vite 6, Tailwind CSS 3
- **Icons & Typography:** Lucide React, IBM Plex Mono, Inter
- **Analytics & Visualizations:** Recharts (responsive area charts & bar meters)
- **Database Architecture:** PostgreSQL / Supabase Relational Schema + Migrations (`supabase/migrations/`) with a reactive, client-side relational storage engine backing zero-latency evaluation.
- **Reporting & Exports:** SheetJS / XLSX for Excel spreadsheets, standard CSV streaming, and jsPDF / jspdf-autotable for PDF invoices.
- **Testing Engine:** Vitest for automated unit and end-to-end benchmark scenario assertions.

---

## 4. Benchmark Scenario & Exact Verification Results

NOIR comes pre-loaded with an automated, reproducible benchmark scenario based on a Tamil Nadu snack factory producing **Murukku 200g**:

### 4.1 Opening Factory State
- **Rice Flour Premium:** 100 kg @ ₹42.00/kg (₹4,200.00)
- **Refined Cooking Oil:** 30 L @ ₹140.00/L (₹4,200.00)
- **Salt & Spice Mix Formula A:** 5 kg @ ₹200.00/kg (₹1,000.00)
- **200g Printed Pouches:** 500 pcs @ ₹2.50/pc (₹1,250.00)
- **Master Corrugated Cartons:** 30 pcs @ ₹15.00/pc (₹450.00)
- **Finished Goods (Murukku 200g):** 50 packets @ ₹50.00 selling price

### 4.2 Step 1 — Purchase Delivery
- **Received:** 60 kg Flour @ ₹45.00/kg from Southern Agro Mills
- **Closing Flour Stock:** $100 + 60 = \mathbf{160\text{ kg}}$
- **Weighted-Average Flour Cost:**
  $$\frac{(100 \times 42) + (60 \times 45)}{160} = \frac{4200 + 2700}{160} = \mathbf{₹43.125/\text{kg}}$$

### 4.3 Step 2 — Production Execution (Batch BATCH-2026-001)
- **Planned Yield:** 200 packets
- **Actual Good Output:** **188 packets**
- **Yield Variance:** $\frac{188 - 200}{200} \times 100 = \mathbf{-6.0\%}$ *(Exceeds 3% tolerance $\rightarrow$ Flagged)*
- **Actual Consumptions:**
  - Flour: 40 kg (Variance: 0%)
  - Oil: 10.5 L vs 10.0 L planned (Variance: $\mathbf{+5.0\%}$, Exceeds 3% tolerance $\rightarrow$ Flagged)
  - Spice: 1.2 kg (Variance: 0%)
  - Pouches Drawn: 194 total (188 good packets + 6 damaged during heat sealing)
  - Cartons: 9 cartons
  - Direct Labour: ₹1,200.00
  - Power & Gas Overheads: ₹600.00
- **Closing Inventories Immediately Post-Production:**
  - Flour: $160 - 40 = \mathbf{120\text{ kg}}$
  - Oil: $30 - 10.5 = \mathbf{19.5\text{ L}}$
  - Spice: $5 - 1.2 = \mathbf{3.8\text{ kg}}$
  - Pouches: $500 - 194 = \mathbf{306\text{ pcs}}$
  - Cartons: $30 - 9 = \mathbf{21\text{ pcs}}$
  - Finished Goods: $50 + 188 = \mathbf{238\text{ packets}}$
- **Batch Costing:**
  - Material Cost: $(40 \times 43.125) + (10.5 \times 140) + (1.2 \times 200) = 1725 + 1470 + 240 = ₹3,435.00$
  - Packaging Cost: $(194 \times 2.50) + (9 \times 15) = 485 + 135 = ₹620.00$
  - Direct Labour: ₹1,200.00
  - Gas & Power: ₹600.00
  - **Total Batch Cost:** $3435 + 620 + 1200 + 600 = \mathbf{₹5,855.00}$
  - **Cost per Good Packet:** $\frac{5855}{188} = \mathbf{₹31.14}$
  - **Gross Margin per Packet:** $50.00 - 31.14 = \mathbf{₹18.86}$ ($37.71\%$ margin)

### 4.4 Step 3 — Sales Order, Invoicing & Dispatch (Retailer A)
- **Customer:** Retailer A (Tamil Nadu — Intra-State)
- **Quantity:** 150 packets @ ₹50.00
- **Taxable Value:** $150 \times ₹50 = \mathbf{₹7,500.00}$
- **CGST (2.5%):** $\mathbf{₹187.50}$
- **SGST (2.5%):** $\mathbf{₹187.50}$
- **Total Invoice Amount:** $\mathbf{₹7,875.00}$
- **Dispatch:** 150 packets dispatched
- **Finished Goods Stock:** $238 - 150 = \mathbf{88\text{ packets}}$
- **Retailer A Outstanding:** $\mathbf{₹7,875.00}$

### 4.5 Step 4 — Distributor B Shortage Detection
- **Customer:** Distributor B (Karnataka — Inter-State IGST 5%)
- **Quantity Requested:** 120 packets
- **Available Warehouse Stock:** 88 packets
- **Shortage Identified:** $\mathbf{32\text{ packets}}$
- **System Action:** System prevents accidental over-dispatch, raises a stock shortage deviation alert, and deterministically suggests launching 1 batch of 200 packets.

### 4.6 Step 5 — Payment Remittance
- **Payment Received:** ₹4,000.00 via UPI (Ref: `UPI-77401122889`)
- **Retailer A Outstanding Balance:** $7875 - 4000 = \mathbf{₹3,875.00}$

---

## 5. Audit Room: 17 Statutory & Operational Reports

The Audit Room provides read-only verification across 17 distinct reports, each exportable to CSV, Excel (XLSX), or PDF:
1. **Sales Register:** Chronological tax invoices with taxable, CGST, SGST, IGST, and gross totals.
2. **Customer-wise Sales:** Invoiced volumes and outstanding balances per customer.
3. **Product-wise Sales:** Units sold, taxable realization, and average selling price.
4. **GST Statutory Summary:** Place of supply breakdown for GSTR-1 preparation.
5. **Purchase Register:** Supplier invoices, delivery dates, and tax breakdown.
6. **Raw Material Stock Summary:** Opening, inward, consumption, and valuation.
7. **Packaging Stock Summary:** Pouches and master corrugated cartons valuation.
8. **Finished Goods Stock Summary:** Packaged food inventory ready for dispatch.
9. **Stock Movement Ledger:** Complete double-entry movement log with running balances.
10. **Production Run Report:** Batch ID, formula version, planned vs actual output.
11. **Planned vs Actual Consumption:** Ingredient-by-ingredient tolerance compliance.
12. **Yield & Wastage Report:** Food yield percentage and damaged pouch count.
13. **Cost-per-Packet Report:** Material, packaging, labour, and overhead cost breakdown.
14. **Collections Register:** Cash, UPI, Cheque, and NEFT inflow logs.
15. **Customer Receivables Report:** Credit limits, credit periods, and current balances.
16. **Outstanding Ageing Report:** Statutory 30-day buckets (0–30, 31–60, 61–90, 90+ days).
17. **Transaction Audit Log:** User ID, action timestamp, entity name, previous/new JSON states.

---

## 6. Demo Users & Role Matrix

You can switch between evaluator roles with 1 click using the Role Simulation panel in the sidebar:

At the opening login page, select the role and use that profile’s email from the table below. The demo password for all sample accounts is `noir2026`. This is a client-side prototype sign-in for evaluation only, not production authentication.

| Role | Demo User Name | Demo Email | Primary Scope |
| :--- | :--- | :--- | :--- |
| **OWNER** | K. Senthil Nathan | `owner@noir-factory.com` | Full executive visibility, margins & KPIs |
| **ADMIN** | R. Meenakshi | `admin@noir-factory.com` | Order review, dispatch & GST invoicing |
| **PRODUCTION**| M. Velmurugan | `production@noir-factory.com`| BOM recipes, batch runs & damage logs |
| **SALESMAN** | K. Rajesh (Salesman A) | `sales.a@noir-factory.com` | Fast mobile order creation (<60s) |
| **AUDITOR** | C.A. Sundaram | `auditor@auditfirm-tn.com` | Strictly read-only reports & ledger audit |

---

## 7. Local Setup & Execution Instructions

### Prerequisites
- Node.js v18+ (tested on v20.15.1)
- npm or yarn

### Installation & Run
```bash
# 1. Clone or open the workspace folder
cd "noir-factory-intelligence-os"

# 2. Dependencies are already installed; to reinstall if needed:
npm install

# 3. Start local development server (binds to http://localhost:3000)
npm run dev

# 4. Run automated test suite verifying all 22 benchmark numbers:
npm test

# 5. Build for production:
npm run build
```

---

## 8. Supabase & PostgreSQL Migration

If deploying with Supabase or PostgreSQL:
1. Schema DDL is located at: `supabase/migrations/20260101000000_init_noir_schema.sql`
2. Benchmark seed script is located at: `supabase/seed.sql`
3. Execute via Supabase CLI:
   ```bash
   supabase db reset
   ```
4. Set environment variables in `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
*(Note: NOIR automatically falls back to its persistent in-memory/localStorage relational engine when Supabase credentials are not provided, allowing offline evaluation.)*
