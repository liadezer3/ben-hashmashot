-- Fix: prevent users from self-approving their reviews; add admin moderation
-- New reviews should not be auto-approved
ALTER TABLE public.app_reviews ALTER COLUMN is_approved SET DEFAULT false;

-- Trigger to force is_approved handling: non-admins cannot set/change is_approved
CREATE OR REPLACE FUNCTION public.enforce_review_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.is_approved := false;
  ELSIF TG_OP = 'UPDATE' THEN
    -- non-admins may not change the approval flag
    NEW.is_approved := OLD.is_approved;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_review_approval_trigger ON public.app_reviews;
CREATE TRIGGER enforce_review_approval_trigger
BEFORE INSERT OR UPDATE ON public.app_reviews
FOR EACH ROW EXECUTE FUNCTION public.enforce_review_approval();

-- Admin moderation policies
CREATE POLICY "Admins can view all reviews"
ON public.app_reviews FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all reviews"
ON public.app_reviews FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all reviews"
ON public.app_reviews FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow users to delete their own notification preferences
CREATE POLICY "Users can delete their own notification preferences"
ON public.notification_preferences FOR DELETE
TO authenticated
USING (auth.uid() = user_id);