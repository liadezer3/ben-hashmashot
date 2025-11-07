-- Fix RLS policy for the table that has RLS enabled but no policies
-- The table "זמני שבת וחג" appears to be empty and unused, let's add policies for it

CREATE POLICY "Allow public read access to זמני שבת וחג"
ON public."זמני שבת וחג"
FOR SELECT
USING (true);

CREATE POLICY "Only authenticated users can insert to זמני שבת וחג"
ON public."זמני שבת וחג"
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');