import { VideoCard } from "@/components/VideoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeed, useProfile } from "@/hooks/useQueries";
import type { VideoView } from "@/types";
import { Link } from "@tanstack/react-router";
import { Video } from "lucide-react";

const SKELETON_IDS = Array.from({ length: 4 }, (_, i) => `feed-skeleton-${i}`);

function FeedVideoCard({ video, index }: { video: VideoView; index: number }) {
  const { data: creator } = useProfile(video.owner);
  const creatorName =
    creator?.displayName ?? `Creator ${video.owner.toText().slice(0, 6)}`;
  return (
    <VideoCard
      video={video}
      creatorName={creatorName}
      creatorAvatar={creator?.avatar}
      index={index}
    />
  );
}

function FeedSkeleton() {
  return (
    <div data-ocid="home.loading_state" className="space-y-4">
      {SKELETON_IDS.map((id) => (
        <div
          key={id}
          className="overflow-hidden rounded-2xl border border-border/70 bg-card"
        >
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="flex gap-3 p-3.5">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-2/5" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { data: videos, isLoading, isError, refetch } = useFeed();

  return (
    <section data-ocid="home.page" aria-label="Home feed" className="space-y-5">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Home
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Fresh uploads from creators you follow
          </p>
        </div>
        <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent">
          Live feed
        </span>
      </header>

      {isLoading && <FeedSkeleton />}

      {isError && (
        <div
          data-ocid="home.error_state"
          className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-center"
        >
          <p className="text-sm text-foreground">
            We couldn&apos;t load the feed.
          </p>
          <button
            type="button"
            data-ocid="home.retry_button"
            onClick={() => void refetch()}
            className="mt-3 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-smooth hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && videos && videos.length === 0 && (
        <div
          data-ocid="home.empty_state"
          className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center"
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
            <Video className="size-7" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
            No videos yet
          </h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Be the first to publish something worth watching on Velocity.
          </p>
          <Link
            to="/upload"
            data-ocid="home.upload_button"
            className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-smooth hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Upload a video
          </Link>
        </div>
      )}

      {!isLoading && !isError && videos && videos.length > 0 && (
        <div data-ocid="home.list" className="space-y-4">
          {videos.map((video, index) => (
            <FeedVideoCard
              key={video.id.toString()}
              video={video}
              index={index}
            />
          ))}
        </div>
      )}
    </section>
  );
}
