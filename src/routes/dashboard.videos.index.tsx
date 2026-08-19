import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAllVideos, deleteScriptVideo, updateScriptTitle } from "@/lib/roteiros.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, Play, Download, Video as VideoIcon, Loader2, Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/dashboard/videos/")({
  component: MyVideosView,
});

function MyVideosView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const getVideosFn = useServerFn(getAllVideos);
  const deleteVideoFn = useServerFn(deleteScriptVideo);
  const updateTitleFn = useServerFn(updateScriptTitle);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const { data: videos, isLoading } = useQuery({
    queryKey: ["my-videos"],
    queryFn: () => getVideosFn(),
  });

  const { mutate: removeVideo, isPending: isDeleting } = useMutation({
    mutationFn: (variables: { roteiroRowId: string; scriptId: string; videoPath?: string | null }) => 
      deleteVideoFn({ data: { ...variables, videoPath: variables.videoPath ?? undefined } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-videos"] });
      toast.success("Vídeo excluído!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir vídeo.");
    },
  });

  const { mutate: updateTitle, isPending: isUpdating } = useMutation({
    mutationFn: (variables: { roteiroRowId: string; scriptId: string; newTitle: string }) => 
      updateTitleFn({ data: variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-videos"] });
      setEditingId(null);
      toast.success("Título atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar título.");
    },
  });

  const handleEdit = (video: any) => {
    setEditingId(video.id);
    setEditValue(video.titulo || "");
  };

  const handleSaveTitle = (video: any) => {
    if (!editValue.trim()) return;
    updateTitle({
      roteiroRowId: video.roteiroRowId,
      scriptId: video.id,
      newTitle: editValue
    });
  };

  const handleDelete = (video: any) => {
    if (confirm("Tem certeza que deseja excluir este vídeo? O roteiro será mantido, mas o vídeo será removido permanentemente.")) {
      // Extract path from URL if possible, or just delete from DB
      // The video_url is a signed URL, so finding the exact path might need logic
      // For now, we clear the URL in DB. Storage deletion would need the exact filename.
      let videoPath: string | undefined;
      try {
        const url = new URL(video.video_url);
        const pathParts = url.pathname.split('/videos/');
        if (pathParts.length > 1) {
          videoPath = pathParts[1].split('?')[0];
        }
      } catch (e) {}

      removeVideo({
        roteiroRowId: video.roteiroRowId,
        scriptId: video.id,
        videoPath
      });
    }
  };

  if (isLoading) {
    return <div className="text-[#D4AF37] animate-pulse">Carregando seus vídeos...</div>;
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <VideoIcon className="h-16 w-16 text-[#D4AF37]/20 mb-6" />
        <h3 className="text-[#FAFAFA] text-xl font-light mb-2">Nenhum vídeo gravado</h3>
        <p className="text-[#FAFAFA]/60 max-w-xs">
          Grave vídeos a partir dos seus roteiros na aba "Roteiros Gerados".
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-[#D4AF37] text-2xl font-light">Meus Vídeos</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <Card key={video.id} className="bg-[#121212] border-[#D4AF37]/20 overflow-hidden group">
            <div className="aspect-video bg-black relative flex items-center justify-center">
              <video 
                src={video.video_url} 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                preload="metadata"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="rounded-full bg-[#D4AF37] hover:bg-[#B8962E] text-black"
                  asChild
                >
                  <a href={video.video_url} target="_blank" rel="noopener noreferrer">
                    <Play className="h-6 w-6 fill-current" />
                  </a>
                </Button>
              </div>
            </div>
            
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60 block truncate">
                    {video.produto?.nome || "Produto"}
                  </span>
                  {editingId === video.id ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-8 bg-[#0A0A0A] border-[#D4AF37]/30 text-[#FAFAFA] text-sm"
                        autoFocus
                      />
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-green-500 hover:bg-green-500/10"
                        onClick={() => handleSaveTitle(video)}
                        disabled={isUpdating}
                      >
                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-red-500 hover:bg-red-500/10"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <CardTitle className="text-[#FAFAFA] font-light text-base truncate flex items-center gap-2">
                      {video.titulo || "Sem título"}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-[#D4AF37]/40 hover:text-[#D4AF37]"
                        onClick={() => handleEdit(video)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </CardTitle>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-4 pt-0 flex justify-between gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                asChild
              >
                <a href={video.video_url} download={`video_${video.id}.webm`}>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar
                </a>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-500/60 hover:text-red-500 hover:bg-red-500/10"
                onClick={() => handleDelete(video)}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Excluir
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
