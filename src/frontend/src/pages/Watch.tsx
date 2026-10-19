import { SignInButton } from "@/components/InternetIdentity";
import { VideoPlayer } from "@/components/VideoPlayer";
import {
  useIncrementViewCount,
  useIsFollowing,
  useIsLiked,
  useIsSaved,
  useProfile,
  useToggleFollow,
  useToggleLike,
  useToggleSave,
  useVideo,
} from "@/hooks/useQueries";
import { formatCount, formatRelativeTime } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link, useParams } from "@tanstack/react-router";
import { Bookmark, Heart, Loader2, UserCheck, UserPlus } from "lucide-react";
import { useEffect, useRef } from "react";

function SignInPrompt({ action }: { action: string }) {
  return (
    <div
      data-ocid="watch.signin_prompt"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
    >
      <p className="text-sm text-muted-foreground">
        Sign in to {action} this video.
      </p>
      <SignInButton className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-smooth hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60" />
    </div>
  );
}

export default function WatchPage() {
  const { videoId } = useParams({ from: "/watch/$videoId" });
  const id = videoId ? BigInt(videoId) : undefined;

  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal();
  const isSignedIn = !!principal && !principal.isAnonymous();
  const myPrincipal = isSignedIn ? principal.toText() : undefined;

  const { data: video, isLoading, isError } = useVideo(id);
  const { data: creator } = useProfile(video?.owner);
  const { data: isFollowing } = useIsFollowing(
    isSignedIn ? video?.owner : undefined,
  );
  const isLiked = useIsLiked(video?.id);
  const isSaved = useIsSaved(video?.id);

  const incrementView = useIncrementViewCount();
  const toggleLike = useToggleLike();
  const toggleSave = useToggleSave();
  const toggleFollow = useToggleFollow();

  const countedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!video || !id) return;
    const key = id.toString();
    if (countedRef.current === key) return;
    countedRef.current = key;
    incrementView.mutate(id);
  }, [video, id, incrementView]);

  if (isLoading) {
    return (
      <section data-ocid="watch.page" aria-label="Watch video">
        <output
          data-ocid="watch.loading_state"
          className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-20 text-sm text-muted-foreground"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading video…
        </output>
      </section>
    );
  }

  if (isError || !video) {
    return (
      <section data-ocid="watch.page" aria-label="Watch video">
        <div
          data-ocid="watch.error_state"
          className="flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-16 text-center"
        >
          <h1 className="font-display text-lg font-semibold text-foreground">
            Video unavailable
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This video may have been removed or the link is incorrect.
          </p>
          <Link
            to="/"
            data-ocid="watch.back_button"
            className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-smooth hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Back to feed
          </Link>
        </div>
      </section>
    );
  }

  const videoSrc = resolveMediaUrl(video.videoFile);
  const poster = resolveMediaUrl(video.thumbnail);
  const creatorName =
    creator?.displayName ?? `Creator ${video.owner.toText().slice(0, 6)}`;
  const creatorAvatar = creator?.avatar;
  const isOwnVideo = myPrincipal === video.owner.toText();
  const likeCount = video.likeCount;

  return (
    <section
      data-ocid="watch.page"
      aria-label="Watch video"
      className="space-y-5"
    >
      {videoSrc ? (
        <VideoPlayer src={videoSrc} poster={poster} title={video.title} />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-border bg-card text-sm text-muted-foreground">
          Video file unavailable
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h1 className="font-display text-xl font-bold leading-snug text-foreground">
            {video.title}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {formatCount(video.viewCount)} views ·{" "}
            {formatRelativeTime(video.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary font-display text-sm font-semibold text-primary">
            {creatorAvatar ? (
              <img
                src={resolveMediaUrl(creatorAvatar)}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              creatorName.trim().charAt(0).toUpperCase() || "V"
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-semibold text-foreground">
              {creatorName}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatCount(creator?.followerCount ?? 0n)} followers
            </p>
          </div>

          {isSignedIn && !isOwnVideo && (
            <button
              type="button"
              data-ocid="watch.follow_button"
              disabled={toggleFollow.isPending}
              onClick={() => toggleFollow.mutate(video.owner)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-smooth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60",
                isFollowing
                  ? "border border-border bg-secondary text-foreground hover:bg-secondary/80"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              {isFollowing ? (
                <UserCheck className="size-4" aria-hidden="true" />
              ) : (
                <UserPlus className="size-4" aria-hidden="true" />
              )}
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-ocid="watch.like_button"
            aria-pressed={isLiked}
            disabled={toggleLike.isPending}
            onClick={() => {
              if (!isSignedIn) return;
              toggleLike.mutate(video.id);
            }}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-smooth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60",
              isLiked
                ? "border-primary/60 bg-primary/15 text-primary"
                : "border-border bg-card text-foreground hover:border-primary/50 hover:text-primary",
            )}
          >
            <Heart
              className={cn("size-4", isLiked && "fill-current")}
              aria-hidden="true"
            />
            {formatCount(likeCount)}
          </button>

          <button
            type="button"
            data-ocid="watch.save_button"
            aria-pressed={isSaved}
            disabled={toggleSave.isPending}
            onClick={() => {
              if (!isSignedIn) return;
              toggleSave.mutate(video.id);
            }}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-smooth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60",
              isSaved
                ? "border-accent/60 bg-accent/15 text-accent"
                : "border-border bg-card text-foreground hover:border-accent/60 hover:text-accent",
            )}
          >
            <Bookmark
              className={cn("size-4", isSaved && "fill-current")}
              aria-hidden="true"
            />
            {isSaved ? "Saved" : "Save"}
          </button>
        </div>

        {!isSignedIn && <SignInPrompt action="like, save and follow" />}

        {video.description && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="font-display text-sm font-semibold text-foreground">
              Description
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {video.description}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
