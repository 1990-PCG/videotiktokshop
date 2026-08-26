import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAllVideos } from "@/lib/roteiros.functions";
import { publishToTikTok, publishToInstagram, listSocialConnections } from "@/lib/social.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Send, ExternalLink, LinkIcon } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/dashboard/publish")({
  component: PublishView,
  head: () => ({
    meta: [
      { title: "Publicar vídeos | Roteiro TikTok Shop" },
      { name: "description", content: "Publique seus vídeos editados direto no TikTok e no Instagram." },
      { property: "og:title", content: "Publicar vídeos | Roteiro TikTok Shop" },
      { property: "og:description", content: "Publique seus vídeos editados direto no TikTok e no Instagram." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function PublishView() {
  const getVideos = useServerFn(getAllVideos);
  const getConnections = useServerFn(listSocialConnections);
  const tiktok = useServerFn(publishToTikTok);
  const instagram = useServerFn(publishToInstagram);
  const [vCaption, setCaption] = useState<Record<string, string>>({});

  const { data: videos, isLoading } = useQuery({ queryKey: ["publish-videos"], queryFn: () => getVideos() });
  const { data: connections } = useQuery({ queryKey: ["social-connections"], queryFn: () => getConnections() });

  const mutation = useMutation({
    mutationFn: async (v: { platform: "tiktok" | "instagram"; videoUrl: string }) =>
      v.platform === "tiktok"
        ? tiktok({ data: { videoUrl: v.videoUrl, caption: vCaption[v.videoUrl] || "" } })
        : instagram({ data: { videoUrl: v.videoUrl, caption: vCaption[v.videoUrl] || "" } }),
    onSuccess: (_, v) => toast.success(`Vídeo enviado para ${v.platform === "tiktok" ? "TikTok" : "Instagram"}.`),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao publicar"),
  });

  const publish = (platform: "tiktok" | "instagram", videoUrl: string) => {
    if (!connections?.[platform]) {
      toast.error(
        platform === "tiktok"
          ? "Conecte uma conta TikTok em Redes sociais antes de publicar."
          : "Conecte uma conta Instagram profissional em Redes sociais antes de publicar.",
      );
      return;
    }
    mutation.mutate({ platform, videoUrl });
  };

  if (isLoading) return <p className="text-[#D4AF37]">Carregando vídeos…</p>;

  const missing = connections && (!connections.tiktok || !connections.instagram);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-[#D4AF37] text-2xl font-light">Publicar vídeos</h2>
        <p className="text-white/60">Escolha um vídeo editado e publique nas redes conectadas.</p>
      </div>

      {missing && (
        <div className="rounded-lg border border-[#D4AF37]/30 bg-[#121212] p-4 flex flex-wrap items-center gap-3 text-sm text-white/70">
          <LinkIcon className="h-4 w-4 text-[#D4AF37]" />
          <span>
            {!connections?.tiktok && !connections?.instagram
              ? "Nenhuma rede conectada."
              : !connections?.tiktok
                ? "TikTok ainda não conectado."
                : "Instagram ainda não conectado."}
          </span>
          <Button asChild size="sm" className="bg-[#D4AF37] text-black hover:bg-[#B8962E]">
            <Link to="/dashboard/social">Conectar redes</Link>
          </Button>
        </div>
      )}

      {!videos?.length ? (
        <div className="text-center py-16 text-white/50">Você ainda não tem vídeos prontos para publicar.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map((v) => (
            <Card key={`${v.roteiroRowId}-${v.id}`} className="bg-[#121212] border-[#D4AF37]/20 overflow-hidden">
              <div className="aspect-video bg-black">
                <video src={v.video_url} controls className="w-full h-full object-contain" />
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="text-white font-medium truncate">{v.titulo || "Vídeo sem título"}</div>
                <Input
                  value={vCaption[v.video_url] || ""}
                  onChange={(e) => setCaption((s) => ({ ...s, [v.video_url]: e.target.value }))}
                  placeholder="Legenda + hashtags"
                  className="bg-black border-[#D4AF37]/20 text-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    disabled={mutation.isPending || !connections?.tiktok}
                    onClick={() => publish("tiktok", v.video_url)}
                    className="bg-white text-black hover:bg-white/90"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    TikTok
                  </Button>
                  <Button
                    disabled={mutation.isPending || !connections?.instagram}
                    onClick={() => publish("instagram", v.video_url)}
                    className="bg-[#D4AF37] text-black hover:bg-[#B8962E]"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Instagram
                  </Button>
                </div>
                <Button variant="ghost" className="w-full text-white/60" asChild>
                  <a href={v.video_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir vídeo
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
