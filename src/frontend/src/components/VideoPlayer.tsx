import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title: string;
}

export function VideoPlayer({ src, poster, title }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUnmute, setShowUnmute] = useState(false);

  // Autoplay muted; if the browser blocks it, surface the play control.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    const attempt = video.play();
    if (attempt) {
      attempt.then(() => setShowUnmute(true)).catch(() => setIsPlaying(false));
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    if (!video.muted) setShowUnmute(false);
  }, []);

  const handleSeek = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const video = videoRef.current;
      if (!video) return;
      const next = Number(event.target.value);
      video.currentTime = next;
      setCurrentTime(next);
    },
    [],
  );

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void container.requestFullscreen();
    }
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      data-ocid="watch.player"
      className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-border/70 bg-black"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        muted
        preload="metadata"
        aria-label={title}
        className="size-full object-contain"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(event) =>
          setCurrentTime(event.currentTarget.currentTime)
        }
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onEnded={() => setIsPlaying(false)}
      />

      {showUnmute && isMuted && (
        <button
          type="button"
          data-ocid="watch.unmute_button"
          onClick={toggleMute}
          className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-background/85 px-3 py-2 text-xs font-medium text-foreground shadow-nav-raised backdrop-blur-md transition-smooth hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <VolumeX className="size-4" aria-hidden="true" />
          Tap to unmute
        </button>
      )}

      {!isPlaying && (
        <button
          type="button"
          data-ocid="watch.play_button"
          aria-label="Play video"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-background/30 transition-smooth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ring"
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-nav-raised">
            <Play className="size-7 translate-x-0.5" aria-hidden="true" />
          </span>
        </button>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-3 pt-8">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          aria-label="Seek"
          data-ocid="watch.seek_input"
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/25 accent-primary"
          style={{
            background: `linear-gradient(to right, oklch(0.78 0.16 78) ${progress}%, rgba(255,255,255,0.25) ${progress}%)`,
          }}
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            data-ocid="watch.toggle_play_button"
            aria-label={isPlaying ? "Pause video" : "Play video"}
            onClick={togglePlay}
            className="flex size-9 items-center justify-center rounded-full text-white transition-smooth hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {isPlaying ? (
              <Pause className="size-5" aria-hidden="true" />
            ) : (
              <Play className="size-5" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            data-ocid="watch.mute_button"
            aria-label={isMuted ? "Unmute video" : "Mute video"}
            onClick={toggleMute}
            className="flex size-9 items-center justify-center rounded-full text-white transition-smooth hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {isMuted ? (
              <VolumeX className="size-5" aria-hidden="true" />
            ) : (
              <Volume2 className="size-5" aria-hidden="true" />
            )}
          </button>

          <span className="font-mono text-xs tabular-nums text-white/90">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>

          <button
            type="button"
            data-ocid="watch.fullscreen_button"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            onClick={toggleFullscreen}
            className={cn(
              "ml-auto flex size-9 items-center justify-center rounded-full text-white transition-smooth hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            )}
          >
            {isFullscreen ? (
              <Minimize className="size-5" aria-hidden="true" />
            ) : (
              <Maximize className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
