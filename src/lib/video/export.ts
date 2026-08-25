import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type { EditorSettings } from "@/components/video/VideoEditor";

let ffmpeg: FFmpeg | null = null;
let loading: Promise<FFmpeg> | null = null;

async function getFFmpeg(onProgress?: (progress: number) => void) {
  if (ffmpeg?.loaded) return ffmpeg;
  if (loading) return loading;

  loading = (async () => {
    const instance = new FFmpeg();
    instance.on("progress", ({ progress }) => onProgress?.(Math.max(0, Math.min(1, progress))));
    const base = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
    await instance.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpeg = instance;
    return instance;
  })();

  try { return await loading; } finally { loading = null; }
}

function esc(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/:/g, "\\:").replace(/,/g, "\\,").replace(/\[/g, "\\[").replace(/\]/g, "\\]");
}

function filter(settings: EditorSettings) {
  const parts: string[] = [];
  const brightness = ((settings.brightness ?? 100) - 100) / 100;
  const contrast = (settings.contrast ?? 100) / 100;
  const saturation = (settings.saturation ?? 100) / 100;
  if (brightness || contrast !== 1 || saturation !== 1) {
    parts.push(`eq=brightness=${brightness}:contrast=${contrast}:saturation=${saturation}`);
  }
  if (settings.filter === "bw") parts.push("hue=s=0");
  if (settings.filter === "vivid") parts.push("eq=contrast=1.1:saturation=1.5");
  if (settings.filter === "cinema") parts.push("eq=contrast=1.2:saturation=0.9");
  if (settings.filter === "vintage") parts.push("colorbalance=rs=.08:gs=.02:bs=-.04,eq=saturation=1.2");
  if (settings.filter === "warm") parts.push("colorbalance=rs=.08:gs=.02:bs=-.05");
  if (settings.filter === "cool") parts.push("colorbalance=rs=-.04:gs=.02:bs=.08");
  return parts.join(",");
}

function aspect(settings: EditorSettings) {
  if (settings.aspect === "9:16") return "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:black";
  if (settings.aspect === "1:1") return "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2:black";
  if (settings.aspect === "16:9") return "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black";
  return "scale=trunc(iw/2)*2:trunc(ih/2)*2";
}

/** Exporta um projeto para MP4 no navegador usando FFmpeg WASM. */
export async function exportVideo(
  source: File | Blob | string,
  settings: EditorSettings,
  onProgress?: (progress: number) => void,
) {
  const engine = await getFFmpeg(onProgress);
  const input = "source.mp4";
  const output = "export.mp4";
  const sourceData = typeof source === "string" ? await fetchFile(source) : await fetchFile(source);
  await engine.writeFile(input, sourceData);

  const vf: string[] = [aspect(settings)];
  const color = filter(settings);
  if (color) vf.push(color);
  if (settings.speed && settings.speed !== 1) vf.push(`setpts=${(1 / settings.speed).toFixed(4)}*PTS`);
  if (settings.fadeIn) vf.push("fade=t=in:st=0:d=0.6");
  const duration = Math.max(0, (settings.endTime || 0) - (settings.startTime || 0));
  if (settings.fadeOut && duration > 0) vf.push(`fade=t=out:st=${Math.max(0, duration - 0.6)}:d=0.6`);

  for (const text of settings.texts ?? []) {
    if (!text.text.trim()) continue;
    const start = Math.max(0, text.start - (settings.startTime || 0));
    const end = Math.max(start, text.end - (settings.startTime || 0));
    const y = `(h*${Math.max(0, Math.min(100, text.y))}/100)-text_h/2`;
    const bg = text.background ? ":box=1:boxcolor=black@0.55:boxborderw=10" : "";
    vf.push(`drawtext=text='${esc(text.text)}':fontcolor=${text.color}:fontsize=${Math.max(12, text.size)}:x=(w-text_w)/2:y=${y}:enable='between(t,${start},${end})':shadowcolor=black@0.9:shadowx=2:shadowy=2${bg}`);
  }

  const args = ["-i", input];
  if (settings.startTime > 0) args.push("-ss", String(settings.startTime));
  if (settings.endTime > settings.startTime) args.push("-to", String(settings.endTime));
  args.push("-vf", vf.join(","), "-af", `volume=${Math.max(0, Math.min(1, settings.volume ?? 1))}`, "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-y", output);

  await engine.exec(args);
  const data = await engine.readFile(output);
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data as ArrayBuffer);
  return new Blob([bytes.buffer as ArrayBuffer], { type: "video/mp4" });
}
