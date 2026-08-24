import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Scissors, Volume2, Type, Play, Pause, Save, Loader2, RotateCcw,
  Gauge, Sparkles, Plus, Trash2, Crop, SkipBack, SkipForward, ZoomIn, ZoomOut,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUiText } from "@/lib/uiText";


interface VideoEditorProps {
  videoUrl: string;
  onSave: (settings: EditorSettings) => Promise<void>;
  initialSettings?: EditorSettings;
}

export interface TextOverlay {
  id: string;
  text: string;
  start: number;
  end: number;
  size: number;
  color: string;
  background: boolean;
  y: number; // 0-100 vertical position (%)
}

export interface EditorSettings {
  startTime: number;
  endTime: number;
  volume: number;
  /** legacy single subtitle (mantido por compatibilidade) */
  subtitle?: string;
  subtitleSize?: number;
  subtitleColor?: string;
  speed?: number;
  aspect?: "original" | "9:16" | "1:1" | "16:9";
  filter?: FilterKey;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
  /** efeito dinâmico (movimento) */
  motion?: MotionKey;
  motionIntensity?: number;
  motionSpeed?: number;
  texts?: TextOverlay[];
}

type FilterKey = "none" | "vivid" | "cinema" | "bw" | "vintage" | "cool" | "warm";

const FILTERS: Record<FilterKey, { label: string; css: string }> = {
  none: { label: "Original", css: "" },
  vivid: { label: "Vívido", css: "saturate(1.5) contrast(1.1)" },
  cinema: { label: "Cinema", css: "contrast(1.2) saturate(0.9) sepia(0.15)" },
  bw: { label: "P&B", css: "grayscale(1) contrast(1.1)" },
  vintage: { label: "Vintage", css: "sepia(0.45) contrast(0.95) saturate(1.2)" },
  cool: { label: "Frio", css: "hue-rotate(-12deg) saturate(1.1)" },
  warm: { label: "Quente", css: "hue-rotate(12deg) saturate(1.2) brightness(1.05)" },
};

type MotionKey =
  | "none" | "zoomIn" | "zoomOut" | "kenburns" | "pulse"
  | "shake" | "swing" | "glitch" | "flash" | "slideIn";

const MOTIONS: Record<MotionKey, { label: string; anim: string; loop: boolean }> = {
  none: { label: "Nenhum", anim: "", loop: false },
  zoomIn: { label: "Zoom in", anim: "ve-zoom-in", loop: false },
  zoomOut: { label: "Zoom out", anim: "ve-zoom-out", loop: false },
  kenburns: { label: "Ken Burns", anim: "ve-kenburns", loop: true },
  pulse: { label: "Batida", anim: "ve-pulse", loop: true },
  shake: { label: "Tremor", anim: "ve-shake", loop: true },
  swing: { label: "Balanço", anim: "ve-swing", loop: true },
  glitch: { label: "Glitch", anim: "ve-glitch", loop: true },
  flash: { label: "Flash", anim: "ve-flash", loop: true },
  slideIn: { label: "Entrada", anim: "ve-slide-in", loop: false },
};

const ASPECTS: Record<NonNullable<EditorSettings["aspect"]>, string> = {
  original: "aspect-video",
  "9:16": "aspect-[9/16]",
  "1:1": "aspect-square",
  "16:9": "aspect-video",
};

const DEFAULTS: EditorSettings = {
  startTime: 0,
  endTime: 0,
  volume: 1,
  speed: 1,
  aspect: "original",
  filter: "none",
  brightness: 100,
  contrast: 100,
  saturation: 100,
  fadeIn: false,
  fadeOut: false,
  motion: "none",
  motionIntensity: 50,
  motionSpeed: 1,
  texts: [],
};

function migrate(s?: EditorSettings): EditorSettings {
  if (!s) return { ...DEFAULTS };
  const merged: EditorSettings = { ...DEFAULTS, ...s };
  if ((!merged.texts || merged.texts.length === 0) && s.subtitle) {
    merged.texts = [{
      id: crypto.randomUUID(),
      text: s.subtitle,
      start: s.startTime ?? 0,
      end: s.endTime ?? 0,
      size: s.subtitleSize ?? 24,
      color: s.subtitleColor ?? "#ffffff",
      background: true,
      y: 82,
    }];
  }
  return merged;
}

const fmt = (t: number) => {
  if (!isFinite(t)) return "0:00.0";
  const m = Math.floor(t / 60);
  const s = (t % 60).toFixed(1).padStart(4, "0");
  return `${m}:${s}`;
};

export function VideoEditor({ videoUrl, onSave, initialSettings }: VideoEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [drag, setDrag] = useState<null | "start" | "end" | "playhead">(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);

  const [settings, setSettings] = useState<EditorSettings>(() => migrate(initialSettings));

  const set = useCallback(<K extends keyof EditorSettings>(k: K, v: EditorSettings[K]) => {
    setSettings((s) => ({ ...s, [k]: v }));
  }, []);

  // metadata
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onMeta = () => {
      const d = video.duration || 0;
      setDuration(d);
      setSettings((s) => ({ ...s, endTime: s.endTime && s.endTime > 0 ? Math.min(s.endTime, d) : d }));
    };
    const onTime = () => {
      setCurrentTime(video.currentTime);
      const end = settings.endTime || video.duration;
      if (video.currentTime >= end) {
        video.currentTime = settings.startTime;
        video.pause();
        setIsPlaying(false);
      }
    };
    const onEnded = () => setIsPlaying(false);
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("ended", onEnded);
    if (video.readyState >= 1) onMeta();
    return () => {
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("ended", onEnded);
    };
  }, [settings.startTime, settings.endTime]);

  // apply playback props
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = settings.volume ?? 1;
    v.playbackRate = settings.speed ?? 1;
  }, [settings.volume, settings.speed]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) { v.pause(); setIsPlaying(false); return; }
    if (v.currentTime < settings.startTime || v.currentTime >= (settings.endTime || duration)) {
      v.currentTime = settings.startTime;
    }
    void v.play();
    setIsPlaying(true);
  };

  const seek = (t: number) => {
    const v = videoRef.current;
    const clamped = Math.max(0, Math.min(t, duration || 0));
    if (v) v.currentTime = clamped;
    setCurrentTime(clamped);
  };

  // timeline interactions
  const timeFromEvent = (clientX: number) => {
    const el = timelineRef.current;
    if (!el || !duration) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = (clientX - rect.left + el.scrollLeft) / (rect.width * zoom);
    return Math.max(0, Math.min(ratio * duration, duration));
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
      const t = timeFromEvent(clientX);
      if (drag === "start") setSettings((s) => ({ ...s, startTime: Math.min(t, (s.endTime || duration) - 0.2) }));
      else if (drag === "end") setSettings((s) => ({ ...s, endTime: Math.max(t, s.startTime + 0.2) }));
      else seek(t);
    };
    const up = () => setDrag(null);
    window.addEventListener("mousemove", move);
    window.addEventListener("touchmove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
  }, [drag, duration, zoom]);

  const pct = (t: number) => (duration ? (t / duration) * 100 : 0);

  const activeTexts = useMemo(
    () => (settings.texts ?? []).filter((t) => currentTime >= t.start && currentTime <= t.end),
    [settings.texts, currentTime]
  );

  const cssFilter = useMemo(() => {
    const base = FILTERS[(settings.filter ?? "none") as FilterKey].css;
    return [
      base,
      `brightness(${(settings.brightness ?? 100) / 100})`,
      `contrast(${(settings.contrast ?? 100) / 100})`,
      `saturate(${(settings.saturation ?? 100) / 100})`,
    ].filter(Boolean).join(" ");
  }, [settings.filter, settings.brightness, settings.contrast, settings.saturation]);

  const fadeOpacity = useMemo(() => {
    const start = settings.startTime;
    const end = settings.endTime || duration;
    const F = 0.6;
    if (settings.fadeIn && currentTime < start + F) return Math.max(0, (currentTime - start) / F);
    if (settings.fadeOut && currentTime > end - F) return Math.max(0, (end - currentTime) / F);
    return 1;
  }, [currentTime, settings.fadeIn, settings.fadeOut, settings.startTime, settings.endTime, duration]);

  const motionStyle = useMemo<React.CSSProperties>(() => {
    const key = (settings.motion ?? "none") as MotionKey;
    const m = MOTIONS[key];
    if (!m || !m.anim) return {};
    const i = (settings.motionIntensity ?? 50) / 100; // 0..1
    const speed = settings.motionSpeed ?? 1;
    const dur = m.loop ? Math.max(0.25, 1.6 / speed) : Math.max(1, 6 / speed);
    return {
      animationName: m.anim,
      animationDuration: `${dur}s`,
      animationTimingFunction: key === "shake" || key === "glitch" ? "steps(4, end)" : "ease-in-out",
      animationIterationCount: m.loop ? "infinite" : 1,
      animationFillMode: "both",
      animationPlayState: isPlaying ? "running" : "paused",
      transformOrigin: "center",
      willChange: "transform, filter",
      ["--ve-amt" as string]: 1 + 0.35 * i,
      ["--ve-px" as string]: `${Math.round(2 + 14 * i)}px`,
      ["--ve-deg" as string]: `${(0.5 + 4 * i).toFixed(2)}deg`,
      ["--ve-bright" as string]: 1 + 1.2 * i,
    };
  }, [settings.motion, settings.motionIntensity, settings.motionSpeed, isPlaying]);


  const addText = () => {
    const t: TextOverlay = {
      id: crypto.randomUUID(),
      text: "Novo texto",
      start: Math.round(currentTime * 10) / 10,
      end: Math.min((settings.endTime || duration), currentTime + 3),
      size: 28,
      color: "#ffffff",
      background: true,
      y: 82,
    };
    setSettings((s) => ({ ...s, texts: [...(s.texts ?? []), t] }));
    setSelectedTextId(t.id);
  };

  const updateText = (id: string, patch: Partial<TextOverlay>) =>
    setSettings((s) => ({ ...s, texts: (s.texts ?? []).map((t) => (t.id === id ? { ...t, ...patch } : t)) }));

  const removeText = (id: string) =>
    setSettings((s) => ({ ...s, texts: (s.texts ?? []).filter((t) => t.id !== id) }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const first = settings.texts?.[0];
      await onSave({
        ...settings,
        // mantém compatibilidade com a exibição legada
        subtitle: first?.text ?? "",
        subtitleSize: first?.size ?? 24,
        subtitleColor: first?.color ?? "#ffffff",
      });
      toast.success("Edição salva com sucesso!");
    } catch {
      toast.error("Erro ao salvar a edição.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedText = (settings.texts ?? []).find((t) => t.id === selectedTextId) ?? null;
  const { t: ui } = useUiText();

  return (
    <div className="space-y-3 sm:space-y-4 w-full min-w-0 overflow-x-hidden">
      {/* PREVIEW */}
      <div className="flex justify-center">
        <div
          className={cn(
            "relative bg-black rounded-xl overflow-hidden border border-[#D4AF37]/20 group w-full max-h-[34dvh] sm:max-h-[45dvh]",
            ASPECTS[settings.aspect ?? "original"],
            settings.aspect === "9:16" && "max-w-[200px] sm:max-w-[280px]",
            settings.aspect === "1:1" && "max-w-[320px] sm:max-w-[440px]"
          )}
        >

          <div className="absolute inset-0 overflow-hidden" style={motionStyle}>
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              style={{ filter: cssFilter, opacity: fadeOpacity }}
              playsInline
              onClick={togglePlay}
            />
          </div>

          {activeTexts.map((t) => (
            <div
              key={t.id}
              className="absolute left-0 right-0 text-center px-4 pointer-events-none"
              style={{ top: `${t.y}%`, transform: "translateY(-50%)" }}
            >
              <span
                className="inline-block font-bold leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                style={{
                  fontSize: `${t.size}px`,
                  color: t.color,
                  background: t.background ? "rgba(0,0,0,0.55)" : "transparent",
                  padding: t.background ? "2px 10px" : 0,
                  borderRadius: 8,
                }}
              >
                {t.text}
              </span>
            </div>
          ))}

          <div className="absolute inset-0 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-black/30 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
              <Button size="icon" variant="ghost" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-black/60 text-[#D4AF37]"
                onClick={() => seek(currentTime - 1)}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost"
                className="h-11 w-11 sm:h-14 sm:w-14 rounded-full bg-[#D4AF37] text-black hover:bg-[#B8962E]" onClick={togglePlay}>
                {isPlaying ? <Pause className="h-6 w-6 sm:h-7 sm:w-7" /> : <Play className="h-6 w-6 sm:h-7 sm:w-7 fill-current" />}
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-black/60 text-[#D4AF37]"
                onClick={() => seek(currentTime + 1)}>
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>


          <div className="absolute top-2 right-3 text-[10px] font-mono text-[#D4AF37] bg-black/60 px-2 py-0.5 rounded">
            {fmt(currentTime)} / {fmt(duration)}
          </div>
        </div>
      </div>

      {/* TIMELINE */}
      <Card className="bg-[#0A0A0A] border-[#D4AF37]/20 overflow-hidden">
        <CardContent className="p-2 sm:p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60 truncate min-w-0">{ui("editor.timeline.title")}</span>

            <div className="flex items-center gap-1 shrink-0">
              <Button size="icon" variant="ghost" className="h-7 w-7 text-[#D4AF37]"
                onClick={() => setZoom((z) => Math.max(1, z - 0.5))}><ZoomOut className="h-3.5 w-3.5" /></Button>
              <span className="text-[10px] text-[#D4AF37]/60 w-8 text-center">{zoom}x</span>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-[#D4AF37]"
                onClick={() => setZoom((z) => Math.min(6, z + 0.5))}><ZoomIn className="h-3.5 w-3.5" /></Button>
            </div>
          </div>

          <div ref={timelineRef} className="overflow-x-auto pb-2">
            <div className="relative select-none" style={{ width: `${zoom * 100}%`, minWidth: "100%" }}>
              {/* video track */}
              <div
                className="relative h-10 sm:h-14 rounded-md bg-gradient-to-r from-[#1a1a1a] to-[#111] border border-[#262626] overflow-hidden"

                onMouseDown={(e) => { setDrag("playhead"); seek(timeFromEvent(e.clientX)); }}
              >
                <div className="absolute inset-0 flex">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="flex-1 border-r border-[#D4AF37]/5" />
                  ))}
                </div>
                {/* trimmed-out zones */}
                <div className="absolute top-0 bottom-0 left-0 bg-black/70" style={{ width: `${pct(settings.startTime)}%` }} />
                <div className="absolute top-0 bottom-0 right-0 bg-black/70"
                  style={{ width: `${100 - pct(settings.endTime || duration)}%` }} />
                {/* selection */}
                <div
                  className="absolute top-0 bottom-0 border-y-2 border-[#D4AF37]/70 bg-[#D4AF37]/10"
                  style={{ left: `${pct(settings.startTime)}%`, width: `${pct((settings.endTime || duration) - settings.startTime)}%` }}
                />
                {/* handles */}
                <div
                  className="absolute top-0 bottom-0 w-3 -ml-1.5 bg-[#D4AF37] rounded cursor-ew-resize flex items-center justify-center"
                  style={{ left: `${pct(settings.startTime)}%` }}
                  onMouseDown={(e) => { e.stopPropagation(); setDrag("start"); }}
                  onTouchStart={(e) => { e.stopPropagation(); setDrag("start"); }}
                >
                  <div className="h-5 w-[2px] bg-black/60" />
                </div>
                <div
                  className="absolute top-0 bottom-0 w-3 -ml-1.5 bg-[#D4AF37] rounded cursor-ew-resize flex items-center justify-center"
                  style={{ left: `${pct(settings.endTime || duration)}%` }}
                  onMouseDown={(e) => { e.stopPropagation(); setDrag("end"); }}
                  onTouchStart={(e) => { e.stopPropagation(); setDrag("end"); }}
                >
                  <div className="h-5 w-[2px] bg-black/60" />
                </div>
                {/* playhead */}
                <div className="absolute top-0 bottom-0 w-[2px] bg-white pointer-events-none" style={{ left: `${pct(currentTime)}%` }}>
                  <div className="w-2 h-2 -ml-[3px] rounded-full bg-white" />
                </div>
              </div>

              {/* text track */}
              <div className="relative h-8 mt-1.5 rounded-md bg-[#111] border border-[#262626]">
                {(settings.texts ?? []).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTextId(t.id)}
                    className={cn(
                      "absolute top-1 bottom-1 rounded px-2 text-[10px] truncate text-left",
                      selectedTextId === t.id ? "bg-[#D4AF37] text-black" : "bg-[#D4AF37]/25 text-[#FAFAFA]"
                    )}
                    style={{ left: `${pct(t.start)}%`, width: `${Math.max(pct(t.end - t.start), 4)}%` }}
                  >
                    {t.text || "Texto"}
                  </button>
                ))}
                {(settings.texts ?? []).length === 0 && (
                  <span className="absolute inset-0 flex items-center pl-3 pr-2 text-[10px] text-[#D4AF37]/40 truncate">
                    {ui("editor.timeline.textTrackEmpty")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-[10px] font-mono text-[#D4AF37]/60">
            <span>{ui("editor.timeline.start")} {fmt(settings.startTime)}</span>
            <span>{ui("editor.timeline.finalDuration")} {fmt(Math.max(0, ((settings.endTime || duration) - settings.startTime) / (settings.speed ?? 1)))}</span>
            <span>{ui("editor.timeline.end")} {fmt(settings.endTime || duration)}</span>
          </div>

        </CardContent>
      </Card>

      {/* TOOLS */}
      <Tabs defaultValue="cortar">
        <TabsList className="bg-[#0A0A0A] border border-[#D4AF37]/20 w-full grid grid-cols-4 h-auto p-1">
          <TabsTrigger value="cortar" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-[10px] sm:text-xs px-1 py-1.5 min-w-0">
            <Scissors className="h-3.5 w-3.5 mr-1 shrink-0 hidden sm:inline" /> <span className="truncate">{ui("editor.tab.cortar")}</span>
          </TabsTrigger>
          <TabsTrigger value="texto" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-[10px] sm:text-xs px-1 py-1.5 min-w-0">
            <Type className="h-3.5 w-3.5 mr-1 shrink-0 hidden sm:inline" /> <span className="truncate">{ui("editor.tab.texto")}</span>
          </TabsTrigger>
          <TabsTrigger value="audio" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-[10px] sm:text-xs px-1 py-1.5 min-w-0">
            <Volume2 className="h-3.5 w-3.5 mr-1 shrink-0 hidden sm:inline" /> <span className="truncate">{ui("editor.tab.audio")}</span>
          </TabsTrigger>
          <TabsTrigger value="efeitos" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-[10px] sm:text-xs px-1 py-1.5 min-w-0">
            <Sparkles className="h-3.5 w-3.5 mr-1 shrink-0 hidden sm:inline" /> <span className="truncate">{ui("editor.tab.efeitos")}</span>
          </TabsTrigger>
        </TabsList>


        {/* CORTAR */}
        <TabsContent value="cortar">
          <Card className="bg-[#0A0A0A] border-[#D4AF37]/20">
            <CardContent className="p-4 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                  onClick={() => set("startTime", Math.min(currentTime, (settings.endTime || duration) - 0.2))}>
                  Cortar início aqui
                </Button>
                <Button variant="outline" className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                  onClick={() => set("endTime", Math.max(currentTime, settings.startTime + 0.2))}>
                  Cortar fim aqui
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-[#FAFAFA] flex items-center gap-2 text-sm">
                    <Gauge className="h-4 w-4 text-[#D4AF37]" /> Velocidade
                  </Label>
                  <span className="text-[10px] text-[#D4AF37]/60">{(settings.speed ?? 1).toFixed(2)}x</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((sp) => (
                    <Button key={sp} size="sm" variant={settings.speed === sp ? "default" : "outline"}
                      className={cn("h-7 text-[11px]", settings.speed === sp
                        ? "bg-[#D4AF37] text-black hover:bg-[#B8962E]"
                        : "border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10")}
                      onClick={() => set("speed", sp)}>{sp}x</Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#FAFAFA] flex items-center gap-2 text-sm">
                  <Crop className="h-4 w-4 text-[#D4AF37]" /> Proporção
                </Label>
                <div className="flex gap-2 flex-wrap">
                  {(["original", "9:16", "1:1", "16:9"] as const).map((a) => (
                    <Button key={a} size="sm" variant={settings.aspect === a ? "default" : "outline"}
                      className={cn("h-7 text-[11px]", settings.aspect === a
                        ? "bg-[#D4AF37] text-black hover:bg-[#B8962E]"
                        : "border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10")}
                      onClick={() => set("aspect", a)}>{a === "original" ? "Original" : a}</Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEXTO */}
        <TabsContent value="texto">
          <Card className="bg-[#0A0A0A] border-[#D4AF37]/20">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[#FAFAFA] text-sm">Legendas e textos</Label>
                <Button size="sm" className="bg-[#D4AF37] text-black hover:bg-[#B8962E] h-7" onClick={addText}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                </Button>
              </div>

              {(settings.texts ?? []).length === 0 && (
                <p className="text-xs text-[#D4AF37]/50">Nenhum texto ainda. Posicione a linha do tempo e clique em Adicionar.</p>
              )}

              <div className="space-y-2">
                {(settings.texts ?? []).map((t) => (
                  <div key={t.id}
                    className={cn("rounded-lg border p-3 space-y-3 cursor-pointer",
                      selectedTextId === t.id ? "border-[#D4AF37]/60 bg-[#D4AF37]/5" : "border-[#262626]")}
                    onClick={() => setSelectedTextId(t.id)}>
                    <div className="flex gap-2">
                      <Input value={t.text} onChange={(e) => updateText(t.id, { text: e.target.value })}
                        placeholder="Digite o texto..." className="bg-black border-[#262626] text-[#FAFAFA] h-8 text-sm" />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:bg-red-500/10"
                        onClick={(e) => { e.stopPropagation(); removeText(t.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase tracking-widest text-[#D4AF37]/60">Início (s)</Label>
                        <Input type="number" step="0.1" value={t.start}
                          onChange={(e) => updateText(t.id, { start: Number(e.target.value) })}
                          className="bg-black border-[#262626] text-[#FAFAFA] h-8 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase tracking-widest text-[#D4AF37]/60">Fim (s)</Label>
                        <Input type="number" step="0.1" value={t.end}
                          onChange={(e) => updateText(t.id, { end: Number(e.target.value) })}
                          className="bg-black border-[#262626] text-[#FAFAFA] h-8 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase tracking-widest text-[#D4AF37]/60">Tamanho</Label>
                        <Input type="number" value={t.size}
                          onChange={(e) => updateText(t.id, { size: Number(e.target.value) })}
                          className="bg-black border-[#262626] text-[#FAFAFA] h-8 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase tracking-widest text-[#D4AF37]/60">Cor</Label>
                        <Input type="color" value={t.color}
                          onChange={(e) => updateText(t.id, { color: e.target.value })}
                          className="bg-black border-[#262626] p-1 h-8 w-full" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <Label className="text-[9px] uppercase tracking-widest text-[#D4AF37]/60">Posição vertical</Label>
                        <span className="text-[10px] text-[#D4AF37]/60">{t.y}%</span>
                      </div>
                      <Slider min={5} max={95} step={1} value={[t.y]}
                        onValueChange={(v) => updateText(t.id, { y: v[0] ?? 82 })} />
                    </div>
                    <Button size="sm" variant="outline"
                      className={cn("h-7 text-[11px]", t.background
                        ? "bg-[#D4AF37] text-black hover:bg-[#B8962E] border-transparent"
                        : "border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10")}
                      onClick={(e) => { e.stopPropagation(); updateText(t.id, { background: !t.background }); }}>
                      Fundo escuro
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AUDIO */}
        <TabsContent value="audio">
          <Card className="bg-[#0A0A0A] border-[#D4AF37]/20">
            <CardContent className="p-4 space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-[#FAFAFA] text-sm">Volume</Label>
                  <span className="text-[10px] text-[#D4AF37]/60">{Math.round((settings.volume ?? 1) * 100)}%</span>
                </div>
                <Slider min={0} max={1} step={0.01} value={[settings.volume ?? 1]}
                  onValueChange={(v) => set("volume", v[0] ?? 1)} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline"
                  className={cn("h-8 text-[11px]", settings.fadeIn
                    ? "bg-[#D4AF37] text-black hover:bg-[#B8962E] border-transparent"
                    : "border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10")}
                  onClick={() => set("fadeIn", !settings.fadeIn)}>Fade de entrada</Button>
                <Button size="sm" variant="outline"
                  className={cn("h-8 text-[11px]", settings.fadeOut
                    ? "bg-[#D4AF37] text-black hover:bg-[#B8962E] border-transparent"
                    : "border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10")}
                  onClick={() => set("fadeOut", !settings.fadeOut)}>Fade de saída</Button>
                <Button size="sm" variant="outline" className="h-8 text-[11px] border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                  onClick={() => set("volume", 0)}>Mudo</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EFEITOS */}
        <TabsContent value="efeitos">
          <Card className="bg-[#0A0A0A] border-[#D4AF37]/20">
            <CardContent className="p-4 space-y-5">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {(Object.keys(FILTERS) as FilterKey[]).map((k) => (
                  <Button key={k} size="sm" variant="outline"
                    className={cn("h-8 text-[11px]", settings.filter === k
                      ? "bg-[#D4AF37] text-black hover:bg-[#B8962E] border-transparent"
                      : "border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10")}
                    onClick={() => set("filter", k)}>{FILTERS[k].label}</Button>
                ))}
              </div>
              {([
                ["brightness", "Brilho"],
                ["contrast", "Contraste"],
                ["saturation", "Saturação"],
              ] as const).map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-[#FAFAFA] text-sm">{label}</Label>
                    <span className="text-[10px] text-[#D4AF37]/60">{settings[key] ?? 100}%</span>
                  </div>
                  <Slider min={20} max={200} step={1} value={[settings[key] ?? 100]}
                    onValueChange={(v) => set(key, v[0] ?? 100)} />
                </div>
              ))}

              {/* EFEITOS DINÂMICOS */}
              <div className="space-y-3 pt-2 border-t border-[#D4AF37]/15">
                <Label className="text-[#FAFAFA] text-sm">Efeito dinâmico</Label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {(Object.keys(MOTIONS) as MotionKey[]).map((k) => (
                    <Button key={k} size="sm" variant="outline"
                      className={cn("h-8 text-[11px] px-1 truncate", (settings.motion ?? "none") === k
                        ? "bg-[#D4AF37] text-black hover:bg-[#B8962E] border-transparent"
                        : "border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10")}
                      onClick={() => set("motion", k)}>{MOTIONS[k].label}</Button>
                  ))}
                </div>

                {(settings.motion ?? "none") !== "none" && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-[#FAFAFA] text-sm">Intensidade</Label>
                        <span className="text-[10px] text-[#D4AF37]/60">{settings.motionIntensity ?? 50}%</span>
                      </div>
                      <Slider min={10} max={100} step={5} value={[settings.motionIntensity ?? 50]}
                        onValueChange={(v) => set("motionIntensity", v[0] ?? 50)} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-[#FAFAFA] text-sm">Velocidade do efeito</Label>
                        <span className="text-[10px] text-[#D4AF37]/60">{(settings.motionSpeed ?? 1).toFixed(1)}x</span>
                      </div>
                      <Slider min={0.5} max={3} step={0.1} value={[settings.motionSpeed ?? 1]}
                        onValueChange={(v) => set("motionSpeed", v[0] ?? 1)} />
                    </div>
                    <p className="text-[10px] text-[#D4AF37]/50">
                      Dê play no preview para ver o efeito em movimento.
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Button onClick={handleSave} disabled={isSaving} className="flex-1 bg-[#D4AF37] text-black hover:bg-[#B8962E]">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {ui("editor.save")}
        </Button>
        <Button variant="outline" onClick={() => { setSettings({ ...DEFAULTS, endTime: duration }); seek(0); }}
          className="border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/10">
          <RotateCcw className="mr-2 h-4 w-4" /> {ui("editor.reset")}
        </Button>
      </div>

    </div>
  );
}
