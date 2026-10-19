import type { Category, ProfileView, VideoView } from "@/backend";

export type { Category, ProfileView, VideoView };
export { Category as CategoryEnum } from "@/backend";

/** A video row enriched with the creator's display name for feed rendering. */
export interface FeedVideo extends VideoView {
  creatorName: string;
  creatorAvatar?: string;
}

export interface ProfileSummary {
  displayName: string;
  owner: string;
  coinBalance: bigint;
  followerCount: bigint;
  followingCount: bigint;
  avatar?: string;
}

export type { ProfileView as BackendProfileView };
