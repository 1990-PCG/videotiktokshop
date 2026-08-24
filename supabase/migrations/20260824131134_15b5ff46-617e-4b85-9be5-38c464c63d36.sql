CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.ui_textos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave TEXT NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ui_textos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ui_textos TO authenticated;
GRANT ALL ON public.ui_textos TO service_role;

ALTER TABLE public.ui_textos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Textos visiveis para todos" ON public.ui_textos FOR SELECT USING (true);
CREATE POLICY "Admins gerenciam textos" ON public.ui_textos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_ui_textos_updated_at BEFORE UPDATE ON public.ui_textos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.ui_textos (chave, valor, descricao) VALUES
  ('editor.timeline.title', 'Linha do tempo', 'Título da linha do tempo no editor'),
  ('editor.timeline.textTrackEmpty', 'Faixa de textos — adicione legendas na aba Texto', 'Mensagem da faixa de textos vazia'),
  ('editor.timeline.start', 'Início', 'Rótulo do início do corte'),
  ('editor.timeline.end', 'Fim', 'Rótulo do fim do corte'),
  ('editor.timeline.finalDuration', 'Duração final', 'Rótulo da duração final'),
  ('editor.tab.cortar', 'Cortar', 'Aba de corte do editor'),
  ('editor.tab.texto', 'Texto', 'Aba de textos do editor'),
  ('editor.tab.audio', 'Áudio', 'Aba de áudio do editor'),
  ('editor.tab.efeitos', 'Efeitos', 'Aba de efeitos do editor'),
  ('editor.save', 'Salvar edição', 'Botão de salvar edição'),
  ('editor.reset', 'Resetar', 'Botão de resetar edição');