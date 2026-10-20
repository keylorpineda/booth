-- Row-level security: a second barrier for tenant isolation (the API already filters by store).
--
-- The API keeps connecting as the database owner, which is not subject to these policies, so public
-- routes, sign in, jobs, the seed and migrations work as before. Owner requests run inside a
-- transaction that switches to `booth_app` with `SET LOCAL ROLE` and sets `booth.store_id` from the
-- signed-in user's token; there, Postgres only exposes rows of that store, even if a query forgets
-- its `where: { storeId }`.
--
-- `booth_app` cannot log in and has no password: nothing new to configure in any environment.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'booth_app') THEN
    CREATE ROLE booth_app NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
END
$$;

-- The migrating role (the API's role) must be able to switch to booth_app.
DO $$
BEGIN
  EXECUTE format('GRANT booth_app TO %I WITH SET TRUE, INHERIT FALSE', current_user);
END
$$;

GRANT USAGE ON SCHEMA public TO booth_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO booth_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO booth_app;
-- Tables created by later migrations (run by this same role) get the same grants.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO booth_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO booth_app;

-- The store the current owner request is scoped to; NULL (no rows) when it was not set.
CREATE OR REPLACE FUNCTION booth_current_store() RETURNS text
  LANGUAGE sql STABLE
  AS $$ SELECT NULLIF(current_setting('booth.store_id', true), '') $$;

-- Tables with their own storeId column.
ALTER TABLE "Store" ENABLE ROW LEVEL SECURITY;
CREATE POLICY store_tenant ON "Store" FOR ALL TO booth_app
  USING ("id" = booth_current_store()) WITH CHECK ("id" = booth_current_store());

ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
CREATE POLICY category_tenant ON "Category" FOR ALL TO booth_app
  USING ("storeId" = booth_current_store()) WITH CHECK ("storeId" = booth_current_store());

ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
CREATE POLICY product_tenant ON "Product" FOR ALL TO booth_app
  USING ("storeId" = booth_current_store()) WITH CHECK ("storeId" = booth_current_store());

ALTER TABLE "DeliveryZone" ENABLE ROW LEVEL SECURITY;
CREATE POLICY delivery_zone_tenant ON "DeliveryZone" FOR ALL TO booth_app
  USING ("storeId" = booth_current_store()) WITH CHECK ("storeId" = booth_current_store());

ALTER TABLE "BusinessHour" ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_hour_tenant ON "BusinessHour" FOR ALL TO booth_app
  USING ("storeId" = booth_current_store()) WITH CHECK ("storeId" = booth_current_store());

ALTER TABLE "PaymentMethod" ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_method_tenant ON "PaymentMethod" FOR ALL TO booth_app
  USING ("storeId" = booth_current_store()) WITH CHECK ("storeId" = booth_current_store());

ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
CREATE POLICY order_tenant ON "Order" FOR ALL TO booth_app
  USING ("storeId" = booth_current_store()) WITH CHECK ("storeId" = booth_current_store());

ALTER TABLE "ReceiptVerification" ENABLE ROW LEVEL SECURITY;
CREATE POLICY receipt_verification_tenant ON "ReceiptVerification" FOR ALL TO booth_app
  USING ("storeId" = booth_current_store()) WITH CHECK ("storeId" = booth_current_store());

ALTER TABLE "CustomDomain" ENABLE ROW LEVEL SECURITY;
CREATE POLICY custom_domain_tenant ON "CustomDomain" FOR ALL TO booth_app
  USING ("storeId" = booth_current_store()) WITH CHECK ("storeId" = booth_current_store());

ALTER TABLE "StoreMembership" ENABLE ROW LEVEL SECURITY;
CREATE POLICY store_membership_tenant ON "StoreMembership" FOR ALL TO booth_app
  USING ("storeId" = booth_current_store()) WITH CHECK ("storeId" = booth_current_store());

ALTER TABLE "StoreInvitation" ENABLE ROW LEVEL SECURITY;
CREATE POLICY store_invitation_tenant ON "StoreInvitation" FOR ALL TO booth_app
  USING ("storeId" = booth_current_store()) WITH CHECK ("storeId" = booth_current_store());

-- Child tables follow their parent (the parent lookup is itself filtered by its policy).
ALTER TABLE "ProductImage" ENABLE ROW LEVEL SECURITY;
CREATE POLICY product_image_tenant ON "ProductImage" FOR ALL TO booth_app
  USING (EXISTS (SELECT 1 FROM "Product" p WHERE p."id" = "productId"))
  WITH CHECK (EXISTS (SELECT 1 FROM "Product" p WHERE p."id" = "productId"));

ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
CREATE POLICY order_item_tenant ON "OrderItem" FOR ALL TO booth_app
  USING (EXISTS (SELECT 1 FROM "Order" o WHERE o."id" = "orderId"))
  WITH CHECK (EXISTS (SELECT 1 FROM "Order" o WHERE o."id" = "orderId"));

ALTER TABLE "OrderStatusEvent" ENABLE ROW LEVEL SECURITY;
CREATE POLICY order_status_event_tenant ON "OrderStatusEvent" FOR ALL TO booth_app
  USING (EXISTS (SELECT 1 FROM "Order" o WHERE o."id" = "orderId"))
  WITH CHECK (EXISTS (SELECT 1 FROM "Order" o WHERE o."id" = "orderId"));

ALTER TABLE "PaymentReceipt" ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_receipt_tenant ON "PaymentReceipt" FOR ALL TO booth_app
  USING (EXISTS (SELECT 1 FROM "Order" o WHERE o."id" = "orderId"))
  WITH CHECK (EXISTS (SELECT 1 FROM "Order" o WHERE o."id" = "orderId"));
