import { formatCount, formatRelativeTime } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import type { VideoView } from "@/types";
import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";

interface VideoCardProps {
  video: VideoView;
  creatorName: string;
  creatorAvatar?: string;
  index: number;
}

export function VideoCard({
  video,
  creatorName,
  creatorAvatar,
  index,
}: VideoCardProps) {
  const thumbnail = resolveMediaUrl(video.thumbnail);
  const avatar = resolveMediaUrl(creatorAvatar);
  const initial = creatorName.trim().charAt(0).toUpperCase() || "V";

  return (
    <article
      data-ocid={`feed.item.${index + 1}`}
      className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-subtle transition-smooth hover:border-primary/40 hover:shadow-nav-raised"
    >
      <Link
        to="/watch/$videoId"
        params={{ videoId: video.id.toString() }}
        data-ocid={`feed.link.${index + 1}`}
        className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <div className="relative aspect-video w-full overflow-hidden bg-secondary">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={video.title}
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-subtle">
              <Play
                className="size-10 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
          <span className="absolute bottom-2 right-2 rounded-md bg-background/85 px-2 py-0.5 font-mono text-[11px] font-medium text-foreground backdrop-blur-sm">
            {formatCount(video.viewCount)} views
          </span>
        </div>

        <div className="flex gap-3 p-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary font-display text-sm font-semibold text-primary">
            {avatar ? (
              <img
                src={avatar}
                alt=""
                className="size-full object-cover"
                loading="lazy"
              />
            ) : (
              initial
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-display text-[15px] font-semibold leading-snug text-foreground">
              {video.title}
            </h3>
            <p className="mt-1 truncate text-[13px] text-muted-foreground">
              {creatorName}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground/80">
              {formatCount(video.viewCount)} views ·{" "}
              {formatRelativeTime(video.createdAt)}
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}
