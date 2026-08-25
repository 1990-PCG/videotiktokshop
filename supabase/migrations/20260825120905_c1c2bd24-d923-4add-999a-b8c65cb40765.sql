DROP POLICY IF EXISTS "Public View" ON storage.objects;

DROP POLICY IF EXISTS "Users can manage history of their customers" ON public.cliente_historico;
CREATE POLICY "Users can manage history of their customers"
ON public.cliente_historico FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = cliente_historico.cliente_id AND c.user_id = auth.uid())
  AND (
    cliente_historico.roteiro_id IS NULL
    OR EXISTS (SELECT 1 FROM public.roteiros r WHERE r.id = cliente_historico.roteiro_id AND r.user_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = cliente_historico.cliente_id AND c.user_id = auth.uid())
  AND (
    cliente_historico.roteiro_id IS NULL
    OR EXISTS (SELECT 1 FROM public.roteiros r WHERE r.id = cliente_historico.roteiro_id AND r.user_id = auth.uid())
  )
);