import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getScriptById, uploadScriptVideo } from "@/lib/roteiros.functions";
import { Button } from "@/components/ui/button";
import { Video, StopCircle, Upload, ArrowLeft, Loader2, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/record/$roteiroRowId/$scriptId")({
  component: RecordView,
});

function RecordView() {
  const { roteiroRowId, scriptId } = Route.useParams();
  const navigate = useNavigate();
  const getScriptFn = useServerFn(getScriptById);
  const uploadVideoFn = useServerFn(uploadScriptVideo);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [chunks, setChunks] = useState<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const { data: script, isLoading } = useQuery({
    queryKey: ["script", roteiroRowId, scriptId],
    queryFn: () => getScriptFn({ data: { roteiroRowId, scriptId } }),
  });

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startStream = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: true 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      toast.error("Erro ao acessar câmera/microfone");
      console.error(err);
    }
  };

  const startRecording = () => {
    if (!stream) return;
    
    setChunks([]);
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        setChunks(prev => [...prev, e.data]);
      }
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
    };
    
    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
    setRecordedUrl(null);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleUpload = async () => {
    if (chunks.length === 0) return;
    
    setIsUploading(true);
    try {
      const blob = new Blob(chunks, { type: "video/webm" });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const fileName = `${user.id}/${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("videos")
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data: { signedUrl }, error: urlError } = await supabase.storage
        .from("videos")
        .createSignedUrl(fileName, 60 * 60 * 24 * 365 * 10); // 10 years signed URL

      if (urlError) throw urlError;

      await uploadVideoFn({
        data: {
          roteiroRowId,
          scriptId,
          videoUrl: signedUrl
        }
      });

      toast.success("Vídeo salvo com sucesso!");
      navigate({ to: "/dashboard/roteiros" as any });
    } catch (error: any) {
      toast.error("Erro ao salvar vídeo: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) return <div className="p-8 text-[#D4AF37] animate-pulse">Carregando roteiro...</div>;
  if (!script) return <div>Roteiro não encontrado</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate({ to: "/dashboard/roteiros" as any })}
          className="text-[#D4AF37] hover:bg-[#D4AF37]/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h2 className="text-[#D4AF37] text-2xl font-light">Gravar Vídeo</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recording Area */}
        <div className="space-y-4">
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-[#D4AF37]/20 shadow-2xl">
            {recordedUrl ? (
              <video 
                src={recordedUrl} 
                controls 
                className="w-full h-full object-cover"
              />
            ) : (
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                className="w-full h-full object-cover"
              />
            )}

            {/* Subtitle Overlay (Teleprompter style) */}
            {isRecording && (
              <div className="absolute bottom-8 left-0 right-0 px-8 text-center bg-black/40 backdrop-blur-sm py-4">
                <p className="text-white text-lg md:text-xl font-medium leading-relaxed animate-pulse">
                  {script.roteiro}
                </p>
              </div>
            )}
            
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full text-white text-xs font-bold animate-pulse">
                <div className="h-2 w-2 bg-white rounded-full" />
                GRAVANDO
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            {!stream && (
              <Button onClick={startStream} className="bg-[#D4AF37] text-[#0A0A0A] hover:bg-[#D4AF37]/90">
                <Video className="h-4 w-4 mr-2" />
                Ativar Câmera
              </Button>
            )}
            
            {stream && !isRecording && !recordedUrl && (
              <Button onClick={startRecording} className="bg-red-600 text-white hover:bg-red-700">
                <Play className="h-4 w-4 mr-2" />
                Iniciar Gravação
              </Button>
            )}

            {isRecording && (
              <Button onClick={stopRecording} variant="destructive">
                <StopCircle className="h-4 w-4 mr-2" />
                Parar Gravação
              </Button>
            )}

            {recordedUrl && !isRecording && (
              <>
                <Button onClick={() => setRecordedUrl(null)} variant="outline" className="border-[#D4AF37] text-[#D4AF37]">
                  Gravar Novamente
                </Button>
                <Button 
                  onClick={handleUpload} 
                  disabled={isUploading}
                  className="bg-[#D4AF37] text-[#0A0A0A] hover:bg-[#D4AF37]/90"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  Salvar Vídeo
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Script Info */}
        <div className="space-y-6 bg-[#121212] p-6 rounded-xl border border-[#D4AF37]/10">
          <div>
            <h3 className="text-[#D4AF37] text-lg font-light mb-1">{script.titulo}</h3>
            <p className="text-[#FAFAFA]/40 text-xs uppercase tracking-widest">{script.produto?.nome}</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60">Hook (Ganchos)</span>
              <p className="text-[#FAFAFA] text-sm italic p-3 bg-black/20 rounded border-l-2 border-[#D4AF37]">
                "{script.hook}"
              </p>
            </div>
            
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60">Roteiro Completo</span>
              <div className="text-[#FAFAFA]/80 text-base leading-relaxed whitespace-pre-wrap p-4 bg-black/20 rounded max-h-[300px] overflow-y-auto font-light">
                {script.roteiro}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60">CTA</span>
              <p className="text-[#FAFAFA] text-sm font-medium p-3 bg-black/20 rounded border-l-2 border-[#D4AF37]">
                {script.cta}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
