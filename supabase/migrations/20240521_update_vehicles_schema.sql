-- Add missing columns to vehicles table
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS insurance_number TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS technical_inspection TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS purchase_date DATE;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS notes TEXT;

-- Ensure RLS is enabled and policies exist (based on existing schema)
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_contracts ENABLE ROW LEVEL SECURITY;

-- Re-verify policies (using standard naming convention)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicles' AND policyname = 'Users can manage their own vehicles') THEN
        CREATE POLICY "Users can manage their own vehicles" ON public.vehicles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'auto_clients' AND policyname = 'Users can manage their own auto clients') THEN
        CREATE POLICY "Users can manage their own auto clients" ON public.auto_clients FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rental_contracts' AND policyname = 'Users can manage their own rental contracts') THEN
        CREATE POLICY "Users can manage their own rental contracts" ON public.rental_contracts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sale_contracts' AND policyname = 'Users can manage their own sale contracts') THEN
        CREATE POLICY "Users can manage their own sale contracts" ON public.sale_contracts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;