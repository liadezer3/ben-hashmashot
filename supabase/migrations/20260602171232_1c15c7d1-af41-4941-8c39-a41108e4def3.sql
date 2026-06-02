-- 1 & 2: Clean up community-images storage policies
DROP POLICY IF EXISTS "Insert function 1sthiho_0" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload community images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload community images" ON storage.objects;

CREATE POLICY "Users can upload their own community images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'community-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own community images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'community-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'community-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3: Restrict INSERT on the Shabbat times table to admins only
DROP POLICY IF EXISTS "Only authenticated users can insert to זמני שבת וחג" ON public."זמני שבת וחג";

CREATE POLICY "Only admins can insert to זמני שבת וחג"
ON public."זמני שבת וחג"
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));