import React, { useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Scissors, Volume2, Type, Play, Pause, Save, Loader2, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface VideoEditorProps {
  videoUrl: string;
  onSave: (settings: EditorSettings) => Promise<void>;
  initialSettings?: EditorSettings;
}

export interface EditorSettings {
  startTime: number;
  endTime: number;
  volume: number;
  subtitle: string;
  subtitleSize: number;
  subtitleColor: string;
}

export function VideoEditor({ videoUrl, onSave, initialSettings }: VideoEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState<EditorSettings>(initialSettings || {
    startTime: 0,
    endTime: 0,
    volume: 1,
    subtitle: "",
    subtitleSize: 24,
    subtitleColor: "#ffffff"
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (!initialSettings) {
        setSettings(s => ({ ...s, endTime: video.duration }));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // Loop if we exceed end time
      if (video.currentTime >= settings.endTime) {
        video.currentTime = settings.startTime;
        if (!isPlaying) video.pause();
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [settings.startTime, settings.endTime, isPlaying, initialSettings]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      const time = value[0] ?? 0;
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleTrimChange = (value: number[]) => {
    const startTime = value[0] ?? 0;
    const endTime = value[1] ?? duration;
    setSettings(s => ({
      ...s,
      startTime,
      endTime
    }));
  };

  const handleVolumeChange = (value: number[]) => {
    const vol = value[0] ?? 1;
    setSettings(s => ({ ...s, volume: vol }));
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(settings);
      toast.success("Ajustes salvos com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar ajustes.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-[#D4AF37]/20 group">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          playsInline
        />
        
        {/* Visual Subtitle Preview */}
        {settings.subtitle && (
          <div 
            className="absolute bottom-10 left-0 right-0 text-center px-4 pointer-events-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
            style={{ 
              fontSize: `${settings.subtitleSize}px`,
              color: settings.subtitleColor,
              fontWeight: 'bold'
            }}
          >
            {settings.subtitle}
          </div>
        )}

        {/* Playback Controls Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
          <Button
            size="icon"
            variant="ghost"
            className="h-16 w-16 rounded-full bg-[#D4AF37] text-black hover:bg-[#B8962E]"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 fill-current" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trimming & Volume */}
        <Card className="bg-[#0A0A0A] border-[#D4AF37]/20">
          <CardContent className="p-4 space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-[#FAFAFA] flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-[#D4AF37]" />
                  Cortar Vídeo
                </Label>
                <span className="text-[10px] text-[#D4AF37]/60">
                  {formatTime(settings.startTime)} - {formatTime(settings.endTime)}
                </span>
              </div>
              <Slider
                min={0}
                max={duration || 100}
                step={0.1}
                value={[settings.startTime, settings.endTime]}
                onValueChange={handleTrimChange}
                className="py-4"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-[#FAFAFA] flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-[#D4AF37]" />
                  Volume do Áudio
                </Label>
                <span className="text-[10px] text-[#D4AF37]/60">{Math.round(settings.volume * 100)}%</span>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={[settings.volume]}
                onValueChange={handleVolumeChange}
                className="py-4"
              />
            </div>
          </CardContent>
        </Card>

        {/* Subtitles */}
        <Card className="bg-[#0A0A0A] border-[#D4AF37]/20">
          <CardContent className="p-4 space-y-4">
            <Label className="text-[#FAFAFA] flex items-center gap-2">
              <Type className="h-4 w-4 text-[#D4AF37]" />
              Legenda
            </Label>
            <Input
              placeholder="Digite a legenda..."
              value={settings.subtitle}
              onChange={(e) => setSettings(s => ({ ...s, subtitle: e.target.value }))}
              className="bg-black border-[#262626] text-[#FAFAFA]"
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] text-[#D4AF37]/60 uppercase tracking-widest">Tamanho</Label>
                <Input
                  type="number"
                  value={settings.subtitleSize}
                  onChange={(e) => setSettings(s => ({ ...s, subtitleSize: Number(e.target.value) }))}
                  className="bg-black border-[#262626] text-[#FAFAFA] h-8"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] text-[#D4AF37]/60 uppercase tracking-widest">Cor</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={settings.subtitleColor}
                    onChange={(e) => setSettings(s => ({ ...s, subtitleColor: e.target.value }))}
                    className="bg-black border-[#262626] p-1 h-8 w-12"
                  />
                  <Input
                    value={settings.subtitleColor}
                    onChange={(e) => setSettings(s => ({ ...s, subtitleColor: e.target.value }))}
                    className="bg-black border-[#262626] text-[#FAFAFA] h-8 text-[10px]"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 bg-[#D4AF37] text-black hover:bg-[#B8962E]"
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Aplicar Ajustes
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setSettings({
              startTime: 0,
              endTime: duration,
              volume: 1,
              subtitle: "",
              subtitleSize: 24,
              subtitleColor: "#ffffff"
            });
            if (videoRef.current) {
              videoRef.current.volume = 1;
              videoRef.current.currentTime = 0;
            }
          }}
          className="border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/10"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Resetar
        </Button>
      </div>
    </div>
  );
}
