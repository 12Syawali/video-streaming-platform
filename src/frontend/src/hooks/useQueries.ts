import {
  type Category,
  type CoinPack,
  type ProfileView,
  type UserId,
  type VideoView,
  createActor,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const queryKeys = {
  feed: ["feed"] as const,
  trending: ["trending"] as const,
  category: (category: Category) => ["category", category] as const,
  video: (id: bigint) => ["video", id.toString()] as const,
  myVideos: ["myVideos"] as const,
  mySaved: ["mySaved"] as const,
  myProfile: ["myProfile"] as const,
  profile: (owner: string) => ["profile", owner] as const,
  following: (owner: string) => ["following", owner] as const,
  coinBalance: ["coinBalance"] as const,
  coinPacks: ["coinPacks"] as const,
  liked: (id: bigint) => ["liked", id.toString()] as const,
};

function useBackendActor() {
  return useActor(createActor);
}

export function useFeed() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<VideoView[]>({
    queryKey: queryKeys.feed,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listFeed();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTrending() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<VideoView[]>({
    queryKey: queryKeys.trending,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTrending();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useVideosByCategory(category: Category) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<VideoView[]>({
    queryKey: queryKeys.category(category),
    queryFn: async () => {
      if (!actor) return [];
      return actor.listByCategory(category);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useVideo(id: bigint | undefined) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<VideoView | null>({
    queryKey: queryKeys.video(id ?? 0n),
    queryFn: async () => {
      if (!actor || id === undefined) return null;
      return actor.getVideo(id);
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

export function useMyVideos() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<VideoView[]>({
    queryKey: queryKeys.myVideos,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMyVideos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMySaved() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<VideoView[]>({
    queryKey: queryKeys.mySaved,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMySaved();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsSaved(videoId: bigint | undefined) {
  const { data: saved } = useMySaved();
  if (videoId === undefined) return false;
  return (saved ?? []).some((video) => video.id === videoId);
}

export function useIsLiked(videoId: bigint | undefined) {
  const queryClient = useQueryClient();
  const { data } = useQuery<boolean>({
    queryKey: queryKeys.liked(videoId ?? 0n),
    queryFn: () =>
      queryClient.getQueryData<boolean>(queryKeys.liked(videoId ?? 0n)) ??
      false,
    enabled: videoId !== undefined,
    staleTime: Number.POSITIVE_INFINITY,
  });
  return data ?? false;
}

export function useMyProfile() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<ProfileView>({
    queryKey: queryKeys.myProfile,
    queryFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.getMyProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useProfile(owner: UserId | undefined) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<ProfileView | null>({
    queryKey: queryKeys.profile(owner?.toText() ?? ""),
    queryFn: async () => {
      if (!actor || !owner) return null;
      return actor.getProfile(owner);
    },
    enabled: !!actor && !isFetching && !!owner,
  });
}

export function useIsFollowing(owner: UserId | undefined) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<boolean>({
    queryKey: queryKeys.following(owner?.toText() ?? ""),
    queryFn: async () => {
      if (!actor || !owner) return false;
      return actor.isFollowing(owner);
    },
    enabled: !!actor && !isFetching && !!owner,
  });
}

export function useCoinBalance() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<bigint>({
    queryKey: queryKeys.coinBalance,
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getMyCoinBalance();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCoinPacks() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<CoinPack[]>({
    queryKey: queryKeys.coinPacks,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCoinPacks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsStripeConfigured() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<boolean>({
    queryKey: ["isStripeConfigured"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
  });
}

export interface CheckoutSession {
  id: string;
  url: string;
}

export function useCreateCoinCheckout() {
  const { actor } = useBackendActor();
  return useMutation({
    mutationFn: async (packId: string): Promise<CheckoutSession> => {
      if (!actor) throw new Error("Backend is not ready");
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}/payment-success?packId=${encodeURIComponent(packId)}&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}/payment-failure`;
      const result = await actor.createCoinCheckout(
        packId,
        successUrl,
        cancelUrl,
      );
      const session = JSON.parse(result) as CheckoutSession;
      if (!session?.url) {
        throw new Error("Stripe session missing url");
      }
      return session;
    },
  });
}

export function useConfirmCoinPurchase() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { sessionId: string; packId: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.confirmCoinPurchase(input.sessionId, input.packId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.coinBalance });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myProfile });
    },
  });
}

export function useIncrementViewCount() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.incrementViewCount(id);
    },
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.video(id) });
    },
  });
}

export function useCreateVideo() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      description: string;
      videoFile: string;
      thumbnail: string;
      category: Category;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createVideo(
        input.title,
        input.description,
        input.videoFile,
        input.thumbnail,
        input.category,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.feed });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myVideos });
    },
  });
}

export function useUpdateMyProfile() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      displayName: string;
      avatar: string | null;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateMyProfile(input.displayName, input.avatar);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.myProfile });
    },
  });
}

export function useToggleFollow() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (owner: UserId) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.toggleFollow(owner);
    },
    onSuccess: (_data, owner) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.following(owner.toText()),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.profile(owner.toText()),
      });
    },
  });
}

export function useToggleLike() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (videoId: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.toggleLike(videoId);
    },
    onSuccess: (isLiked, videoId) => {
      queryClient.setQueryData(queryKeys.liked(videoId), isLiked);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.video(videoId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.feed });
      void queryClient.invalidateQueries({ queryKey: queryKeys.trending });
    },
  });
}

export function useToggleSave() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (videoId: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.toggleSave(videoId);
    },
    onSuccess: (_data, videoId) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.video(videoId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.mySaved });
    },
  });
}

export function useCreditMyCoins() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (amount: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.creditMyCoins(amount);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.coinBalance });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myProfile });
    },
  });
}
