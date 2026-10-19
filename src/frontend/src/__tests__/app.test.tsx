import { setIdentityForTest } from "@/__tests__/setup";
import { renderWithActor } from "@/__tests__/test-utils";
import type { ProfileView, VideoView, backendInterface } from "@/backend";
import { Category } from "@/backend";
import HomePage from "@/pages/Home";
import ProfilePage from "@/pages/Profile";
import TrendingPage from "@/pages/Trending";
import UploadPage from "@/pages/Upload";
import WatchPage from "@/pages/Watch";
import type { Principal } from "@icp-sdk/core/principal";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

// jsdom has no object-storage transport. Replace the blob factory with a
// deterministic stub so upload/profile flows reach the actor calls they test.
const blobMock = vi.hoisted(() => {
  const blob = {
    withUploadProgress: () => blob,
    getDirectURL: () => "https://cdn.example/uploaded.mp4",
  };
  return { blob };
});
vi.mock("@caffeineai/object-storage", () => ({
  ExternalBlob: {
    fromBytes: () => blobMock.blob,
    fromURL: () => blobMock.blob,
  },
}));

// jsdom's File does not implement arrayBuffer(); the upload flow reads it.
if (typeof File.prototype.arrayBuffer !== "function") {
  File.prototype.arrayBuffer = function arrayBuffer(this: File) {
    return Promise.resolve(new ArrayBuffer(this.size));
  };
}

// ---------------------------------------------------------------------------
// Typed actor seam. Each method is a vi.fn with the generated signature so the
// mock keeps its argument/return types and per-test overrides.
// ---------------------------------------------------------------------------

type ActorMethods =
  | "listFeed"
  | "listTrending"
  | "listByCategory"
  | "getVideo"
  | "incrementViewCount"
  | "createVideo"
  | "listMyVideos"
  | "getMyProfile"
  | "getProfile"
  | "updateMyProfile"
  | "toggleFollow"
  | "isFollowing"
  | "toggleLike"
  | "toggleSave"
  | "listMySaved"
  | "getMyCoinBalance"
  | "listCoinPacks"
  | "isStripeConfigured"
  | "createCoinCheckout"
  | "confirmCoinPurchase";

type Actor = Pick<backendInterface, ActorMethods>;

function makeActor(): { [K in ActorMethods]: ReturnType<typeof vi.fn> } {
  return {
    listFeed: vi.fn<backendInterface["listFeed"]>(),
    listTrending: vi.fn<backendInterface["listTrending"]>(),
    listByCategory: vi.fn<backendInterface["listByCategory"]>(),
    getVideo: vi.fn<backendInterface["getVideo"]>(),
    incrementViewCount: vi.fn<backendInterface["incrementViewCount"]>(),
    createVideo: vi.fn<backendInterface["createVideo"]>(),
    listMyVideos: vi.fn<backendInterface["listMyVideos"]>(),
    getMyProfile: vi.fn<backendInterface["getMyProfile"]>(),
    getProfile: vi.fn<backendInterface["getProfile"]>(),
    updateMyProfile: vi.fn<backendInterface["updateMyProfile"]>(),
    toggleFollow: vi.fn<backendInterface["toggleFollow"]>(),
    isFollowing: vi.fn<backendInterface["isFollowing"]>(),
    toggleLike: vi.fn<backendInterface["toggleLike"]>(),
    toggleSave: vi.fn<backendInterface["toggleSave"]>(),
    listMySaved: vi.fn<backendInterface["listMySaved"]>(),
    getMyCoinBalance: vi.fn<backendInterface["getMyCoinBalance"]>(),
    listCoinPacks: vi.fn<backendInterface["listCoinPacks"]>(),
    isStripeConfigured: vi.fn<backendInterface["isStripeConfigured"]>(),
    createCoinCheckout: vi.fn<backendInterface["createCoinCheckout"]>(),
    confirmCoinPurchase: vi.fn<backendInterface["confirmCoinPurchase"]>(),
  };
}

/** A principal-like value with the two methods the app reads. */
function fakePrincipal(text: string, anonymous = false): Principal {
  return {
    isAnonymous: () => anonymous,
    toText: () => text,
  } as unknown as Principal;
}

const OWNER = fakePrincipal("owner-principal");

function makeVideo(overrides: Partial<VideoView> = {}): VideoView {
  return {
    id: 1n,
    title: "First clip",
    likeCount: 0n,
    thumbnail: "https://cdn.example/thumb.jpg",
    owner: OWNER,
    createdAt: BigInt(Date.now()) * 1_000_000n,
    description: "",
    videoFile: "https://cdn.example/video.mp4",
    viewCount: 0n,
    category: Category.game,
    ...overrides,
  };
}

function makeProfile(overrides: Partial<ProfileView> = {}): ProfileView {
  return {
    displayName: "Ada",
    owner: OWNER,
    coinBalance: 0n,
    followerCount: 0n,
    followingCount: 0n,
    ...overrides,
  };
}

/** A signed-in identity whose principal is not anonymous. */
function signedInIdentity() {
  return { getPrincipal: () => fakePrincipal("signed-in-principal") } as never;
}

/**
 * Render a page inside a real memory router so TanStack Router hooks
 * (`useParams`, `Link`, `useNavigate`) resolve. The page is mounted at the
 * given path; a catch-all route keeps navigation targets valid.
 */
function renderRoute(
  path: string,
  component: () => React.ReactElement,
  actor: Actor,
  initialEntry = path,
) {
  const rootRoute = createRootRoute();
  const pageRoute = createRoute({
    getParentRoute: () => rootRoute,
    path,
    component,
  });
  const catchAll = createRoute({
    getParentRoute: () => rootRoute,
    path: "$",
    component: () => <div data-ocid="route.placeholder" />,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([pageRoute, catchAll]),
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  });
  return renderWithActor(<RouterProvider router={router} />, actor);
}

// ---------------------------------------------------------------------------
// Home feed
// ---------------------------------------------------------------------------

describe("home feed", () => {
  it("renders video cards with title, creator display name and view count", async () => {
    const actor = makeActor();
    actor.listFeed.mockResolvedValue([
      makeVideo({ id: 1n, title: "Alpha", viewCount: 1500n }),
      makeVideo({ id: 2n, title: "Beta", viewCount: 3n }),
    ]);
    // The accepted change: cards show the creator's display name, not a
    // truncated principal.
    actor.getProfile.mockResolvedValue(makeProfile({ displayName: "Ada" }));

    renderRoute("/", HomePage, actor);

    expect(await screen.findByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("1.5K views · Just now")).toBeInTheDocument();
    expect(screen.getByText("3 views · Just now")).toBeInTheDocument();
    // The creator profile resolves after the feed, so await the display name.
    expect(await screen.findAllByText("Ada")).toHaveLength(2);
    expect(screen.queryByText(/^Creator /)).not.toBeInTheDocument();
  });

  it("falls back to a short creator label when no profile exists", async () => {
    const actor = makeActor();
    actor.listFeed.mockResolvedValue([makeVideo({ id: 1n, title: "Alpha" })]);
    actor.getProfile.mockResolvedValue(null);

    renderRoute("/", HomePage, actor);

    expect(await screen.findByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Creator owner-")).toBeInTheDocument();
  });

  it("shows an empty state when no videos exist", async () => {
    const actor = makeActor();
    actor.listFeed.mockResolvedValue([]);

    renderRoute("/", HomePage, actor);

    expect(await screen.findByText("No videos yet")).toBeInTheDocument();
    expect(screen.getByText("Upload a video")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Trending
// ---------------------------------------------------------------------------

describe("trending", () => {
  it("ranks videos by view count and shows viral sections", async () => {
    const actor = makeActor();
    actor.listTrending.mockResolvedValue([
      makeVideo({ id: 1n, title: "Top", viewCount: 9000n }),
      makeVideo({ id: 2n, title: "Second", viewCount: 400n }),
    ]);
    actor.listByCategory.mockImplementation(async (category) =>
      category === Category.game
        ? [makeVideo({ id: 3n, title: "Game clip" })]
        : [makeVideo({ id: 4n, title: "Fun clip" })],
    );

    renderRoute("/trending", TrendingPage, actor);

    expect(await screen.findByText("Top")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("Viral games")).toBeInTheDocument();
    expect(screen.getByText("Viral entertainment")).toBeInTheDocument();
    expect(await screen.findByText("Game clip")).toBeInTheDocument();
    expect(await screen.findByText("Fun clip")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Watch: autoplay, unmute, view increment, like/save/follow
// ---------------------------------------------------------------------------

describe("watch page", () => {
  it("autoplays muted, exposes unmute, and increments the view count", async () => {
    const actor = makeActor();
    actor.getVideo.mockResolvedValue(makeVideo({ id: 7n, title: "Watch me" }));
    actor.getProfile.mockResolvedValue(makeProfile());
    actor.incrementViewCount.mockResolvedValue(undefined);
    actor.isFollowing.mockResolvedValue(false);

    const playSpy = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockResolvedValue(undefined);

    renderRoute("/watch/$videoId", WatchPage, actor, "/watch/7");

    expect(await screen.findByText("Watch me")).toBeInTheDocument();
    const video = screen.getByLabelText("Watch me") as HTMLVideoElement;
    expect(video.muted).toBe(true);
    expect(playSpy).toHaveBeenCalled();

    expect(
      await screen.findByRole("button", { name: "Unmute video" }),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(actor.incrementViewCount).toHaveBeenCalledWith(7n),
    );
  });

  it("prompts signed-out users to sign in for like, save and follow", async () => {
    const actor = makeActor();
    actor.getVideo.mockResolvedValue(makeVideo({ id: 7n, title: "Watch me" }));
    actor.getProfile.mockResolvedValue(makeProfile());
    actor.incrementViewCount.mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);

    renderRoute("/watch/$videoId", WatchPage, actor, "/watch/7");

    expect(await screen.findByText("Watch me")).toBeInTheDocument();
    expect(
      screen.getByText("Sign in to like, save and follow this video."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign in with Internet Identity" }),
    ).toBeInTheDocument();
  });

  it("lets a signed-in user like, save and follow with immediate state updates", async () => {
    setIdentityForTest({ identity: signedInIdentity() });
    const actor = makeActor();
    actor.getVideo.mockResolvedValue(
      makeVideo({ id: 7n, title: "Watch me", likeCount: 4n }),
    );
    actor.getProfile.mockResolvedValue(makeProfile());
    actor.incrementViewCount.mockResolvedValue(undefined);
    actor.isFollowing.mockResolvedValue(false);
    // Stateful saved list: the real backend returns the saved video after a
    // successful toggle, and the button reflects that refetched state. Return
    // fresh records (never structuredClone: the fake principal holds functions).
    let savedIds: bigint[] = [];
    actor.listMySaved.mockImplementation(async () =>
      savedIds.map((id) => makeVideo({ id })),
    );
    actor.toggleLike.mockResolvedValue(true);
    actor.toggleSave.mockImplementation(async (videoId) => {
      savedIds = [videoId];
      return true;
    });
    actor.toggleFollow.mockResolvedValue(true);
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);

    renderRoute("/watch/$videoId", WatchPage, actor, "/watch/7");

    expect(await screen.findByText("Watch me")).toBeInTheDocument();

    const user = userEvent.setup();
    const likeButton = screen.getByTestId("watch.like_button");
    expect(likeButton).toHaveAttribute("aria-pressed", "false");
    await user.click(likeButton);
    await waitFor(() => expect(actor.toggleLike).toHaveBeenCalledWith(7n));
    // The accepted change: the button reflects the viewer's new state.
    await waitFor(() =>
      expect(screen.getByTestId("watch.like_button")).toHaveAttribute(
        "aria-pressed",
        "true",
      ),
    );

    const saveButton = screen.getByTestId("watch.save_button");
    expect(saveButton).toHaveAttribute("aria-pressed", "false");
    await user.click(saveButton);
    await waitFor(() => expect(actor.toggleSave).toHaveBeenCalledWith(7n));
    // The saved list is refetched after the toggle, so the button reflects it.
    await waitFor(() =>
      expect(actor.listMySaved.mock.calls.length).toBeGreaterThan(1),
    );
    await waitFor(() =>
      expect(screen.getByTestId("watch.save_button")).toHaveAttribute(
        "aria-pressed",
        "true",
      ),
    );

    await user.click(screen.getByRole("button", { name: "Follow" }));
    await waitFor(() => expect(actor.toggleFollow).toHaveBeenCalledWith(OWNER));
  });

  it("reflects an already-liked and already-saved video for the viewer", async () => {
    setIdentityForTest({ identity: signedInIdentity() });
    const actor = makeActor();
    actor.getVideo.mockResolvedValue(
      makeVideo({ id: 7n, title: "Watch me", likeCount: 4n }),
    );
    actor.getProfile.mockResolvedValue(makeProfile());
    actor.incrementViewCount.mockResolvedValue(undefined);
    actor.isFollowing.mockResolvedValue(true);
    // The viewer has already saved this video.
    actor.listMySaved.mockResolvedValue([makeVideo({ id: 7n })]);
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);

    renderRoute("/watch/$videoId", WatchPage, actor, "/watch/7");

    expect(await screen.findByText("Watch me")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId("watch.save_button")).toHaveAttribute(
        "aria-pressed",
        "true",
      ),
    );
    expect(screen.getByTestId("watch.save_button")).toHaveTextContent("Saved");
    expect(
      await screen.findByRole("button", { name: "Following" }),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

describe("upload", () => {
  it("prompts signed-out users to sign in", async () => {
    const actor = makeActor();
    renderRoute("/upload", UploadPage, actor);
    expect(await screen.findByText("Sign in to upload")).toBeInTheDocument();
  });
  it("validates a missing title and file before publishing", async () => {
    setIdentityForTest({ identity: signedInIdentity() });
    const actor = makeActor();
    renderRoute("/upload", UploadPage, actor);

    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Publish video" }),
    );

    expect(
      await screen.findByText("Add a title for your video."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Choose a video file to upload."),
    ).toBeInTheDocument();
    expect(actor.createVideo).not.toHaveBeenCalled();
  });

  it("publishes a video with a title and file", async () => {
    setIdentityForTest({ identity: signedInIdentity() });
    const actor = makeActor();
    actor.createVideo.mockResolvedValue(
      makeVideo({ id: 42n, title: "My clip" }),
    );

    renderRoute("/upload", UploadPage, actor);

    const user = userEvent.setup();
    const file = new File(["video-bytes"], "clip.mp4", { type: "video/mp4" });
    await user.upload(await screen.findByTestId("upload.file_input"), file);
    await user.type(screen.getByTestId("upload.title_input"), "My clip");
    await user.click(screen.getByRole("button", { name: "Publish video" }));

    await waitFor(() =>
      expect(actor.createVideo).toHaveBeenCalledWith(
        "My clip",
        "",
        "https://cdn.example/uploaded.mp4",
        "https://cdn.example/uploaded.mp4",
        Category.game,
      ),
    );
    expect(screen.queryByTestId("upload.error_state")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

describe("profile", () => {
  it("prompts signed-out users to sign in", async () => {
    const actor = makeActor();
    renderRoute("/profile", ProfilePage, actor);
    expect(
      await screen.findByText("Sign in to see your profile"),
    ).toBeInTheDocument();
  });

  it("shows counts, own videos, saved videos and coin balance", async () => {
    setIdentityForTest({ identity: signedInIdentity() });
    const actor = makeActor();
    actor.getMyProfile.mockResolvedValue(
      makeProfile({
        displayName: "Ada",
        followerCount: 12n,
        followingCount: 3n,
        coinBalance: 250n,
      }),
    );
    actor.listMyVideos.mockResolvedValue([
      makeVideo({ id: 1n, title: "My upload" }),
    ]);
    actor.listMySaved.mockResolvedValue([
      makeVideo({ id: 2n, title: "Saved clip" }),
    ]);
    actor.getMyCoinBalance.mockResolvedValue(250n);

    renderRoute("/profile", ProfilePage, actor);

    expect(await screen.findByText("Ada")).toBeInTheDocument();
    expect(screen.getByTestId("profile.follower_count")).toHaveTextContent(
      "12",
    );
    expect(screen.getByTestId("profile.following_count")).toHaveTextContent(
      "3",
    );
    expect(screen.getByTestId("profile.coin_balance")).toHaveTextContent("250");
    expect(await screen.findByText("My upload")).toBeInTheDocument();
    expect(await screen.findByText("Saved clip")).toBeInTheDocument();
  });

  it("updates the display name and persists the change", async () => {
    setIdentityForTest({ identity: signedInIdentity() });
    const actor = makeActor();
    let profile = makeProfile({ displayName: "Ada" });
    actor.getMyProfile.mockImplementation(async () => profile);
    actor.listMyVideos.mockResolvedValue([]);
    actor.listMySaved.mockResolvedValue([]);
    actor.getMyCoinBalance.mockResolvedValue(0n);
    actor.updateMyProfile.mockImplementation(async (displayName) => {
      profile = makeProfile({ displayName });
      return profile;
    });

    renderRoute("/profile", ProfilePage, actor);

    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: /Edit profile/ }),
    );
    const nameInput = screen.getByTestId("profile.name_input");
    await user.clear(nameInput);
    await user.type(nameInput, "Ada Lovelace");
    await user.click(screen.getByRole("button", { name: /Save changes/ }));

    await waitFor(() =>
      expect(actor.updateMyProfile).toHaveBeenCalledWith("Ada Lovelace", null),
    );
    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("starts a card checkout for a coin pack instead of crediting directly", async () => {
    setIdentityForTest({ identity: signedInIdentity() });
    const actor = makeActor();
    actor.getMyProfile.mockResolvedValue(makeProfile({ coinBalance: 0n }));
    actor.listMyVideos.mockResolvedValue([]);
    actor.listMySaved.mockResolvedValue([]);
    actor.getMyCoinBalance.mockResolvedValue(0n);
    actor.isStripeConfigured.mockResolvedValue(true);
    actor.listCoinPacks.mockResolvedValue([
      {
        id: "pack-100",
        name: "Starter",
        coins: 100n,
        description: "",
        currency: "usd",
        priceInCents: 99n,
      },
    ]);
    actor.createCoinCheckout.mockResolvedValue(
      JSON.stringify({
        id: "cs_test_1",
        url: "https://checkout.stripe.test/1",
      }),
    );

    renderRoute("/profile", ProfilePage, actor);

    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Buy for $0.99" }),
    );

    // The accepted change: the pack goes through the platform card checkout.
    await waitFor(() =>
      expect(actor.createCoinCheckout).toHaveBeenCalledWith(
        "pack-100",
        expect.stringContaining("/payment-success?packId=pack-100"),
        expect.stringContaining("/payment-failure"),
      ),
    );
  });

  it("shows a checkout error when the session cannot be created", async () => {
    setIdentityForTest({ identity: signedInIdentity() });
    const actor = makeActor();
    actor.getMyProfile.mockResolvedValue(makeProfile({ coinBalance: 0n }));
    actor.listMyVideos.mockResolvedValue([]);
    actor.listMySaved.mockResolvedValue([]);
    actor.getMyCoinBalance.mockResolvedValue(0n);
    actor.isStripeConfigured.mockResolvedValue(true);
    actor.listCoinPacks.mockResolvedValue([
      {
        id: "pack-100",
        name: "Starter",
        coins: 100n,
        description: "",
        currency: "usd",
        priceInCents: 99n,
      },
    ]);
    actor.createCoinCheckout.mockRejectedValue(new Error("stripe down"));

    renderRoute("/profile", ProfilePage, actor);

    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Buy for $0.99" }),
    );

    expect(
      await screen.findByText(
        "We couldn't start that checkout. Please try again.",
      ),
    ).toBeInTheDocument();
  });
});
