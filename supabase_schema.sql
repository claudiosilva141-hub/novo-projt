-- Script para criar todas as tabelas necessárias no Supabase
-- Cole este código no "SQL Editor" do painel do seu projeto Supabase e clique em "Run".

-- 1. company_info
CREATE TABLE IF NOT EXISTS company_info (
  key text PRIMARY KEY,
  name text NOT NULL,
  logo text
);

-- 2. user_permissions
CREATE TABLE IF NOT EXISTS user_permissions (
  key text PRIMARY KEY,
  can_add_product boolean DEFAULT false,
  can_edit_product boolean DEFAULT false,
  can_delete_product boolean DEFAULT false,
  can_view_product_cost_price boolean DEFAULT false,
  can_finalize_sale boolean DEFAULT false,
  can_generate_budget boolean DEFAULT false,
  can_create_service_order boolean DEFAULT false,
  can_edit_order_items boolean DEFAULT false,
  can_edit_service_order boolean DEFAULT false,
  can_edit_order_status boolean DEFAULT false,
  can_edit_production_details boolean DEFAULT false,
  can_edit_budget boolean DEFAULT false,
  can_edit_budget_status boolean DEFAULT false,
  can_add_raw_material boolean DEFAULT false,
  can_edit_raw_material boolean DEFAULT false,
  can_delete_raw_material boolean DEFAULT false,
  can_add_client boolean DEFAULT false,
  can_edit_client boolean DEFAULT false,
  can_delete_client boolean DEFAULT false,
  can_view_reports boolean DEFAULT false,
  can_generate_ai_summary boolean DEFAULT false,
  can_edit_company_settings boolean DEFAULT false,
  can_manage_users boolean DEFAULT false,
  can_use_ai boolean DEFAULT false,
  can_print_or_send_order boolean DEFAULT false
);

-- 3. users
CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'user'
);

-- 4. products
CREATE TABLE IF NOT EXISTS products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0.0,
  cost_price numeric NOT NULL DEFAULT 0.0,
  stock numeric NOT NULL DEFAULT 0.0,
  image_url text
);

-- 5. raw_materials
CREATE TABLE IF NOT EXISTS raw_materials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  unit text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0.0,
  cost_per_unit numeric NOT NULL DEFAULT 0.0,
  supplier text
);

-- 6. clients
CREATE TABLE IF NOT EXISTS clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  contact text,
  cpf text,
  zip_code text,
  street text,
  number text,
  neighborhood text,
  city text,
  state text
);

-- 7. orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL,
  client_name text NOT NULL,
  client_contact text,
  client_cpf text,
  client_zip_code text,
  client_street text,
  client_number text,
  client_neighborhood text,
  client_city text,
  client_state text,
  items jsonb DEFAULT '[]'::jsonb,
  total numeric NOT NULL DEFAULT 0.0,
  production_details jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL,
  created_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text) NOT NULL,
  updated_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text) NOT NULL
);

-- Permissões Padrão de Segurança (RLS - Permite acesso de leitura/escrita público para propósitos de teste)
-- ATENÇÃO: Em produção, você deve criar políticas de segurança reais!
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access for company_info" ON company_info FOR ALL USING (true);
CREATE POLICY "Allow public access for user_permissions" ON user_permissions FOR ALL USING (true);
CREATE POLICY "Allow public access for users" ON users FOR ALL USING (true);
CREATE POLICY "Allow public access for products" ON products FOR ALL USING (true);
CREATE POLICY "Allow public access for raw_materials" ON raw_materials FOR ALL USING (true);
CREATE POLICY "Allow public access for clients" ON clients FOR ALL USING (true);
CREATE POLICY "Allow public access for orders" ON orders FOR ALL USING (true);
