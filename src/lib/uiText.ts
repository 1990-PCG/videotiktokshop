import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Valores padrão usados enquanto o banco não responde ou quando a chave não existe. */
export const UI_TEXT_DEFAULTS: Record<string, string> = {
  "editor.timeline.title": "Linha do tempo",
  "editor.timeline.textTrackEmpty": "Faixa de textos — adicione legendas na aba Texto",
  "editor.timeline.start": "Início",
  "editor.timeline.end": "Fim",
  "editor.timeline.finalDuration": "Duração final",
  "editor.tab.cortar": "Cortar",
  "editor.tab.texto": "Texto",
  "editor.tab.audio": "Áudio",
  "editor.tab.efeitos": "Efeitos",
  "editor.save": "Salvar edição",
  "editor.reset": "Resetar",
};

export interface UiTexto {
  id: string;
  chave: string;
  valor: string;
  descricao: string | null;
}

export async function fetchUiTextos(): Promise<UiTexto[]> {
  const { data, error } = await supabase
    .from("ui_textos")
    .select("id, chave, valor, descricao")
    .order("chave");
  if (error) throw error;
  return (data ?? []) as UiTexto[];
}

/** Hook de tradução: `t("editor.timeline.title")` */
export function useUiText() {
  const { data } = useQuery({
    queryKey: ["ui-textos"],
    queryFn: fetchUiTextos,
    staleTime: 60_000,
  });

  const map = new Map((data ?? []).map((r) => [r.chave, r.valor]));

  const t = (key: string, fallback?: string) =>
    map.get(key) ?? UI_TEXT_DEFAULTS[key] ?? fallback ?? key;

  return { t, textos: data ?? [] };
}
