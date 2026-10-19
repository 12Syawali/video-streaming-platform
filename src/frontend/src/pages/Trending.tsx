import { useTrending, useVideosByCategory } from "@/hooks/useQueries";
import { formatCount, formatRelativeTime } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { CategoryEnum, type VideoView } from "@/types";
import { Link } from "@tanstack/react-router";
import { Flame, Gamepad2, Play, Sparkles, TrendingUp } from "lucide-react";

const SKELETON_IDS = Array.from(
  { length: 5 },
  (_, i) => `trending-skeleton-${i}`,
);

function RankBadge({ rank }: { rank: number }) {
  const isTop = rank <= 3;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg font-display text-sm font-bold tabular-nums",
        isTop
          ? "bg-gradient-primary text-primary-foreground shadow-[0_0_18px_oklch(0.78_0.16_78/0.45)]"
          : "border border-border bg-secondary/70 text-muted-foreground",
      )}
    >
      {rank}
    </span>
  );
}

function TrendingRow({ video, rank }: { video: VideoView; rank: number }) {
  const thumbnail = resolveMediaUrl(video.thumbnail);
  return (
    <li data-ocid={`trending.item.${rank}`}>
      <Link
        to="/watch/$videoId"
        params={{ videoId: video.id.toString() }}
        className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-2.5 transition-smooth hover:border-primary/50 hover:bg-secondary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <RankBadge rank={rank} />
        <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-xl bg-secondary">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt=""
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-subtle">
              <Play
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Play className="size-4 translate-x-px" aria-hidden="true" />
            </span>
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-display text-sm font-semibold leading-snug text-foreground">
            {video.title}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="size-3.5 text-primary" aria-hidden="true" />
            <span className="font-semibold tabular-nums text-foreground">
              {formatCount(video.viewCount)}
            </span>
            <span>views</span>
            <span aria-hidden="true">·</span>
            <span>{formatRelativeTime(video.createdAt)}</span>
          </p>
        </div>
      </Link>
    </li>
  );
}

function TrendingSkeleton() {
  return (
    <ul
      data-ocid="trending.loading_state"
      aria-busy="true"
      aria-label="Loading trending videos"
      className="space-y-2.5"
    >
      {SKELETON_IDS.map((id) => (
        <li
          key={id}
          className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-2.5"
        >
          <div className="size-8 shrink-0 animate-pulse rounded-lg bg-secondary motion-reduce:animate-none" />
          <div className="aspect-video w-28 shrink-0 animate-pulse rounded-xl bg-secondary motion-reduce:animate-none" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-4/5 animate-pulse rounded bg-secondary motion-reduce:animate-none" />
            <div className="h-3 w-2/5 animate-pulse rounded bg-secondary motion-reduce:animate-none" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState() {
  return (
    <div
      data-ocid="trending.empty_state"
      className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center"
    >
      <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground">
        <Flame className="size-7" aria-hidden="true" />
      </span>
      <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
        Nothing is trending yet
      </h2>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
        Once videos start collecting views, the hottest clips will climb this
        chart. Be the first to spark a trend.
      </p>
      <Link
        to="/upload"
        data-ocid="trending.empty_state.upload_button"
        className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-5 font-display text-sm font-semibold text-primary-foreground transition-smooth hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Sparkles className="size-4" aria-hidden="true" />
        Upload a video
      </Link>
    </div>
  );
}

function ViralSection({
  title,
  subtitle,
  icon: Icon,
  videos,
  isLoading,
  ocid,
}: {
  title: string;
  subtitle: string;
  icon: typeof Flame;
  videos: VideoView[];
  isLoading: boolean;
  ocid: string;
}) {
  return (
    <section data-ocid={ocid} aria-label={title} className="mt-8">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">
            {title}
          </h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-3 flex gap-3 overflow-hidden">
          {SKELETON_IDS.slice(0, 3).map((id) => (
            <div
              key={id}
              className="w-40 shrink-0 animate-pulse rounded-2xl border border-border/70 bg-card p-2 motion-reduce:animate-none"
            >
              <div className="aspect-video w-full rounded-xl bg-secondary" />
              <div className="mt-2 h-3 w-4/5 rounded bg-secondary" />
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <p
          data-ocid={`${ocid}.empty_state`}
          className="mt-3 rounded-2xl border border-dashed border-border bg-card/60 px-4 py-6 text-center text-sm text-muted-foreground"
        >
          No viral clips here yet — check back soon.
        </p>
      ) : (
        <ul className="mt-3 flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          {videos.map((video) => {
            const thumbnail = resolveMediaUrl(video.thumbnail);
            return (
              <li
                key={video.id.toString()}
                data-ocid={`${ocid}.item.${video.id.toString()}`}
                className="w-40 shrink-0"
              >
                <Link
                  to="/watch/$videoId"
                  params={{ videoId: video.id.toString() }}
                  className="group block rounded-2xl border border-border/70 bg-card p-2 transition-smooth hover:border-accent/50 hover:bg-secondary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-secondary">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-gradient-subtle">
                        <Play
                          className="size-5 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </div>
                    )}
                    <span className="absolute bottom-1.5 right-1.5 rounded-md bg-background/85 px-1.5 py-0.5 font-mono text-[10px] font-medium tabular-nums text-foreground">
                      {formatCount(video.viewCount)}
                    </span>
                  </div>
                  <h3 className="mt-2 line-clamp-2 font-display text-xs font-semibold leading-snug text-foreground">
                    {video.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatRelativeTime(video.createdAt)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function TrendingPage() {
  const trending = useTrending();
  const games = useVideosByCategory(CategoryEnum.game);
  const entertainment = useVideosByCategory(CategoryEnum.entertainment);

  const ranked = trending.data ?? [];
  const isLoading = trending.isLoading;
  const hasError = trending.isError;

  const viralGames = (games.data ?? []).slice(0, 8);
  const viralEntertainment = (entertainment.data ?? []).slice(0, 8);

  return (
    <section data-ocid="trending.page" aria-label="Trending videos">
      <header className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-[0_0_22px_oklch(0.78_0.16_78/0.4)]">
          <Flame className="size-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Trending
          </h1>
          <p className="text-sm text-muted-foreground">
            The most-watched videos right now
          </p>
        </div>
      </header>

      <div className="mt-5">
        {isLoading ? (
          <TrendingSkeleton />
        ) : hasError ? (
          <div
            data-ocid="trending.error_state"
            className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-6 text-center"
          >
            <p className="text-sm font-medium text-foreground">
              We couldn't load trending videos.
            </p>
            <button
              type="button"
              data-ocid="trending.retry_button"
              onClick={() => void trending.refetch()}
              className="mt-3 inline-flex min-h-[44px] items-center rounded-full border border-border bg-secondary px-5 font-display text-sm font-semibold text-foreground transition-smooth hover:bg-secondary/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Try again
            </button>
          </div>
        ) : ranked.length === 0 ? (
          <EmptyState />
        ) : (
          <ol data-ocid="trending.list" className="space-y-2.5">
            {ranked.map((video, index) => (
              <TrendingRow
                key={video.id.toString()}
                video={video}
                rank={index + 1}
              />
            ))}
          </ol>
        )}
      </div>

      <ViralSection
        title="Viral games"
        subtitle="Gameplay clips blowing up"
        icon={Gamepad2}
        videos={viralGames}
        isLoading={games.isLoading}
        ocid="trending.viral_games"
      />

      <ViralSection
        title="Viral entertainment"
        subtitle="Entertainment moments everyone's watching"
        icon={Sparkles}
        videos={viralEntertainment}
        isLoading={entertainment.isLoading}
        ocid="trending.viral_entertainment"
      />
    </section>
  );
}
