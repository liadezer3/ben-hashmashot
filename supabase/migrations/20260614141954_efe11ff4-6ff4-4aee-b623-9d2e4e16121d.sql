ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Family members can listen to their group channels" ON realtime.messages;

CREATE POLICY "Family members can listen to their group channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.family_group_members m
    WHERE m.user_id = auth.uid()
      AND (
        realtime.topic() = 'shared_tasks_' || m.group_id::text
        OR realtime.topic() = 'shopping-' || m.group_id::text
      )
  )
);