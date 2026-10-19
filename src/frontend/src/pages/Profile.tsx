import { CoinShop } from "@/components/CoinShop";
import { RequireSignIn, SignInButton } from "@/components/InternetIdentity";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMyProfile,
  useMySaved,
  useMyVideos,
  useUpdateMyProfile,
} from "@/hooks/useQueries";
import { formatCoins, formatCount, formatRelativeTime } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { VideoView } from "@/types";
import { ExternalBlob } from "@caffeineai/object-storage";
import { Link } from "@tanstack/react-router";
import {
  Camera,
  Check,
  Coins,
  Loader2,
  Pencil,
  PlaySquare,
  Users,
  X,
} from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function VideoCard({ video, index }: { video: VideoView; index: number }) {
  const thumbnail = resolveMediaUrl(video.thumbnail);
  return (
    <li>
      <Link
        to="/watch/$videoId"
        params={{ videoId: video.id.toString() }}
        data-ocid={`profile.video.item.${index + 1}`}
        className="group block overflow-hidden rounded-xl border border-border/70 bg-card transition-smooth hover:border-primary/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <div className="relative aspect-video w-full overflow-hidden bg-secondary">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={video.title}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <PlaySquare className="size-8" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="line-clamp-2 text-sm font-medium text-foreground">
            {video.title}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatCount(video.viewCount)} views ·{" "}
            {formatRelativeTime(video.createdAt)}
          </p>
        </div>
      </Link>
    </li>
  );
}

function VideoSection({
  title,
  videos,
  isLoading,
  emptyTitle,
  emptyBody,
  ocid,
}: {
  title: string;
  videos: VideoView[];
  isLoading: boolean;
  emptyTitle: string;
  emptyBody: string;
  ocid: string;
}) {
  return (
    <section data-ocid={ocid} aria-label={title}>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-foreground">
          {title}
        </h2>
        {!isLoading && videos.length > 0 && (
          <span className="text-xs font-medium text-muted-foreground">
            {videos.length} {videos.length === 1 ? "video" : "videos"}
          </span>
        )}
      </div>

      {isLoading ? (
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }, (_, i) => `skeleton-${i}`).map((id) => (
            <li key={id}>
              <Skeleton className="aspect-video w-full rounded-xl" />
              <Skeleton className="mt-3 h-4 w-3/4" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </li>
          ))}
        </ul>
      ) : videos.length === 0 ? (
        <div
          data-ocid={`${ocid}.empty_state`}
          className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/70 bg-secondary/30 px-6 py-10 text-center"
        >
          <PlaySquare
            className="size-7 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="font-medium text-foreground">{emptyTitle}</p>
          <p className="max-w-xs text-sm text-muted-foreground">{emptyBody}</p>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {videos.map((video, index) => (
            <VideoCard key={video.id.toString()} video={video} index={index} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ProfileContent() {
  const { data: profile, isLoading } = useMyProfile();
  const { data: myVideos, isLoading: videosLoading } = useMyVideos();
  const { data: savedVideos, isLoading: savedLoading } = useMySaved();
  const updateProfile = useUpdateMyProfile();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftAvatar, setDraftAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const avatarUrl = resolveMediaUrl(profile?.avatar);
  const displayName = profile?.displayName?.trim() || "Your channel";

  function startEditing() {
    setDraftName(profile?.displayName ?? "");
    setDraftAvatar(profile?.avatar ?? null);
    setUploadError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setUploadError(null);
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Choose an image file (PNG, JPG or WebP).");
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes, file.type, file.name);
      setDraftAvatar(blob.getDirectURL());
    } catch {
      setUploadError("That image could not be read. Please try another.");
    } finally {
      setUploading(false);
    }
  }

  function handleSave() {
    const name = draftName.trim();
    if (name.length === 0) return;
    updateProfile.mutate(
      { displayName: name, avatar: draftAvatar },
      { onSuccess: () => setEditing(false) },
    );
  }

  if (isLoading) {
    return (
      <div data-ocid="profile.loading_state" className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section
        data-ocid="profile.header"
        className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-subtle"
      >
        <div className="h-24 bg-gradient-subtle" />
        <div className="px-5 pb-5">
          <div className="-mt-12 flex items-end justify-between gap-4">
            <Avatar className="size-24 border-4 border-card shadow-elevated">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
              <AvatarFallback className="bg-gradient-primary font-display text-2xl font-bold text-primary-foreground">
                {initials(displayName)}
              </AvatarFallback>
            </Avatar>
            {!editing && (
              <Button
                type="button"
                variant="outline"
                data-ocid="profile.edit_button"
                onClick={startEditing}
                className="rounded-full border-border bg-secondary/60"
              >
                <Pencil className="size-4" aria-hidden="true" />
                Edit profile
              </Button>
            )}
          </div>

          {editing ? (
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleAvatarChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  data-ocid="profile.upload_button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full border-border bg-secondary/60"
                >
                  {uploading ? (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Camera className="size-4" aria-hidden="true" />
                  )}
                  {uploading ? "Uploading…" : "Change picture"}
                </Button>
                {draftAvatar && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Check
                      className="size-3.5 text-success"
                      aria-hidden="true"
                    />
                    New picture ready
                  </span>
                )}
              </div>
              {uploadError && (
                <p
                  role="alert"
                  data-ocid="profile.upload_error"
                  className="text-sm text-destructive-foreground"
                >
                  {uploadError}
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="profile-display-name">Display name</Label>
                <Input
                  id="profile-display-name"
                  data-ocid="profile.name_input"
                  value={draftName}
                  maxLength={60}
                  placeholder="Your channel name"
                  onChange={(event) => setDraftName(event.target.value)}
                />
              </div>

              {updateProfile.isError && (
                <p
                  role="alert"
                  data-ocid="profile.save_error"
                  className="text-sm text-destructive-foreground"
                >
                  We couldn&apos;t save your profile. Please try again.
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  data-ocid="profile.save_button"
                  disabled={
                    updateProfile.isPending ||
                    uploading ||
                    draftName.trim().length === 0
                  }
                  onClick={handleSave}
                  className="rounded-full bg-gradient-primary font-semibold text-primary-foreground hover:opacity-90"
                >
                  {updateProfile.isPending ? (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Check className="size-4" aria-hidden="true" />
                  )}
                  Save changes
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  data-ocid="profile.cancel_button"
                  onClick={cancelEditing}
                  className="rounded-full"
                >
                  <X className="size-4" aria-hidden="true" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                {displayName}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Your channel, saved videos and coin balance.
              </p>
            </div>
          )}

          <dl className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border/60 bg-secondary/40 px-3 py-2.5">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="size-3.5" aria-hidden="true" />
                Followers
              </dt>
              <dd
                data-ocid="profile.follower_count"
                className="mt-1 font-display text-lg font-semibold tabular-nums text-foreground"
              >
                {formatCount(profile?.followerCount ?? 0n)}
              </dd>
            </div>
            <div className="rounded-xl border border-border/60 bg-secondary/40 px-3 py-2.5">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="size-3.5" aria-hidden="true" />
                Following
              </dt>
              <dd
                data-ocid="profile.following_count"
                className="mt-1 font-display text-lg font-semibold tabular-nums text-foreground"
              >
                {formatCount(profile?.followingCount ?? 0n)}
              </dd>
            </div>
            <div className="rounded-xl border border-primary/40 bg-primary/10 px-3 py-2.5">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Coins className="size-3.5" aria-hidden="true" />
                Coins
              </dt>
              <dd
                data-ocid="profile.coin_balance"
                className="mt-1 font-display text-lg font-semibold tabular-nums text-primary"
              >
                {formatCoins(profile?.coinBalance ?? 0n)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <CoinShop />

      <VideoSection
        title="Your videos"
        videos={myVideos ?? []}
        isLoading={videosLoading}
        emptyTitle="No uploads yet"
        emptyBody="Publish your first video to see it on your channel."
        ocid="profile.my_videos"
      />

      <VideoSection
        title="Saved videos"
        videos={savedVideos ?? []}
        isLoading={savedLoading}
        emptyTitle="Nothing saved yet"
        emptyBody="Videos you save will appear here for later."
        ocid="profile.saved_videos"
      />
    </div>
  );
}

function SignedOutPrompt() {
  return (
    <section
      data-ocid="profile.signed_out"
      aria-label="Sign in to view your profile"
      className={cn(
        "flex flex-col items-center gap-4 rounded-2xl border border-border/70 bg-card px-6 py-12 text-center shadow-subtle",
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground">
        <Users className="size-6" aria-hidden="true" />
      </span>
      <div>
        <h1 className="font-display text-xl font-semibold text-foreground">
          Sign in to see your profile
        </h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Your channel, saved videos and coin balance are private to your
          Internet Identity.
        </p>
      </div>
      <SignInButton className="rounded-full bg-gradient-primary px-5 py-3 font-semibold text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60" />
    </section>
  );
}

export default function ProfilePage() {
  return (
    <RequireSignIn fallback={<SignedOutPrompt />}>
      <ProfileContent />
    </RequireSignIn>
  );
}
