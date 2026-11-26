-- Supabase Row-Level Security (RLS) SQL Script for Prepped 4 Prep
-- Run this script in the Supabase SQL Editor to enforce database-level access controls.

-- Note: The Next.js apps connect to Postgres. In Supabase, the default 'authenticated' role represents logged-in users.
-- We enable RLS on sensitive tables so that a parent's Supabase authenticated session can only query their own data,
-- and cannot access staff-only tables like "Supplier" or "AuditLog".

-- =========================================================================
-- 1. Enable RLS on tables
-- =========================================================================
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Student" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SalesOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderLine" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Delivery" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Supplier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuickBooksToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "School" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SchoolTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TemplateLine" ENABLE ROW LEVEL SECURITY;

-- FORCE RLS for all roles (including owner if needed, but usually postgres/service_role bypasses RLS by default in Supabase)
ALTER TABLE "Customer" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Student" FORCE ROW LEVEL SECURITY;
ALTER TABLE "SalesOrder" FORCE ROW LEVEL SECURITY;
ALTER TABLE "OrderLine" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Delivery" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Supplier" FORCE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;
ALTER TABLE "QuickBooksToken" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Product" FORCE ROW LEVEL SECURITY;
ALTER TABLE "School" FORCE ROW LEVEL SECURITY;
ALTER TABLE "SchoolTemplate" FORCE ROW LEVEL SECURITY;
ALTER TABLE "TemplateLine" FORCE ROW LEVEL SECURITY;


-- =========================================================================
-- 2. Customer Table Policies
-- =========================================================================
-- Customers can only read and write their own profile
CREATE POLICY customer_self_access ON "Customer"
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- Staff/Admin can manage all Customer records
CREATE POLICY staff_all_customer ON "Customer"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- =========================================================================
-- 3. Student Table Policies
-- =========================================================================
-- Customers can only access their own children's student profiles
CREATE POLICY customer_student_access ON "Student"
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = "customerId")
  WITH CHECK (auth.uid()::text = "customerId");

-- Staff/Admin can manage all Student records
CREATE POLICY staff_all_student ON "Student"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- =========================================================================
-- 4. SalesOrder Table Policies
-- =========================================================================
-- Customers can only view/create their own orders
CREATE POLICY customer_sales_order_access ON "SalesOrder"
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = "customerId")
  WITH CHECK (auth.uid()::text = "customerId");

-- Staff/Admin can manage all SalesOrders
CREATE POLICY staff_all_sales_order ON "SalesOrder"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- =========================================================================
-- 5. OrderLine Table Policies
-- =========================================================================
-- Customers can only access order lines belonging to their own orders
CREATE POLICY customer_order_line_access ON "OrderLine"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "SalesOrder"
      WHERE "SalesOrder".id = "OrderLine"."orderId"
        AND "SalesOrder"."customerId" = auth.uid()::text
    )
  );

-- Staff/Admin can manage all OrderLines
CREATE POLICY staff_all_order_line ON "OrderLine"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- =========================================================================
-- 6. Delivery Table Policies
-- =========================================================================
-- Customers can only view deliveries associated with their own orders
CREATE POLICY customer_delivery_access ON "Delivery"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "SalesOrder"
      WHERE "SalesOrder".id = "Delivery"."orderId"
        AND "SalesOrder"."customerId" = auth.uid()::text
    )
  );

-- Staff/Driver/Admin can manage all deliveries
CREATE POLICY staff_all_delivery ON "Delivery"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- =========================================================================
-- 7. Supplier (Staff-Only) Table Policies
-- =========================================================================
-- Block regular customer authentication roles from reading supplier info
CREATE POLICY block_customers_supplier ON "Supplier"
  FOR ALL
  TO authenticated
  USING (false);

-- Staff/Admin can manage suppliers
CREATE POLICY staff_all_supplier ON "Supplier"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- =========================================================================
-- 8. AuditLog (Staff-Only) Table Policies
-- =========================================================================
-- Block regular customer authentication roles from viewing or tampering with audit logs
CREATE POLICY block_customers_audit_log ON "AuditLog"
  FOR ALL
  TO authenticated
  USING (false);

-- Staff/Admin can write/view audit logs
CREATE POLICY staff_all_audit_log ON "AuditLog"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- =========================================================================
-- 9. QuickBooksToken (Staff-Only) Table Policies
-- =========================================================================
CREATE POLICY block_customers_qb_token ON "QuickBooksToken"
  FOR ALL
  TO authenticated
  USING (false);

CREATE POLICY staff_all_qb_token ON "QuickBooksToken"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- =========================================================================
-- 10. Catalog & Templates (Read-Only for Customers, Write for Staff)
-- =========================================================================
CREATE POLICY public_read_product ON "Product"
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY staff_all_product ON "Product"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY public_read_school ON "School"
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY staff_all_school ON "School"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY public_read_school_template ON "SchoolTemplate"
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY staff_all_school_template ON "SchoolTemplate"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY public_read_template_line ON "TemplateLine"
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY staff_all_template_line ON "TemplateLine"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
