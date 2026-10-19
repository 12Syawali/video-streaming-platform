import { PocketIc, createIdentity } from "@dfinity/pic";
import type { Actor, CanisterFixture } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";
import { registerCaller } from "./test-utils";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

let pic: PocketIc | undefined;
let actor: Actor<_SERVICE>;
let canisterId: CanisterFixture<_SERVICE>["canisterId"];

const alice = createIdentity("alice");
const bob = createIdentity("bob");

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  const installed = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM,
  });
  ({ actor, canisterId } = installed);
  await registerCaller(actor, alice);
});

afterAll(async () => {
  await pic?.tearDown();
});

it("answers empty-state reads instead of trapping", async () => {
  await expect(actor.listFeed()).resolves.toEqual([]);
  await expect(actor.listTrending()).resolves.toEqual([]);
  await expect(actor.listByCategory({ game: null })).resolves.toEqual([]);
  await expect(actor.listByCategory({ entertainment: null })).resolves.toEqual(
    [],
  );
  await expect(actor.getVideo(999n)).resolves.toEqual([]);
  await expect(actor.getProfile(alice.getPrincipal())).resolves.toEqual([]);
});

it("round-trips a video through the real canister", async () => {
  actor.setIdentity(alice);
  const created = await actor.createVideo(
    "Alice clip",
    "desc",
    "https://cdn.example/a.mp4",
    "https://cdn.example/a.jpg",
    { game: null },
  );
  expect(created.title).toBe("Alice clip");
  expect(created.owner).toEqual(alice.getPrincipal());

  const feed = await actor.listFeed();
  expect(feed).toHaveLength(1);
  expect(feed[0]).toMatchObject({ id: created.id, title: "Alice clip" });

  const fetched = await actor.getVideo(created.id);
  expect(fetched).toHaveLength(1);
  expect(fetched[0].title).toBe("Alice clip");
});

it("increments the view count and ranks the video in trending", async () => {
  actor.setIdentity(alice);
  const created = await actor.createVideo(
    "Trending clip",
    "",
    "https://cdn.example/t.mp4",
    "https://cdn.example/t.jpg",
    { entertainment: null },
  );

  await actor.incrementViewCount(created.id);
  await actor.incrementViewCount(created.id);

  const trending = await actor.listTrending();
  const ranked = trending.find((v) => v.id === created.id);
  expect(ranked?.viewCount).toBe(2n);
});

it("toggles like, save and follow and reflects them in reads", async () => {
  actor.setIdentity(alice);
  const created = await actor.createVideo(
    "Engage me",
    "",
    "https://cdn.example/e.mp4",
    "https://cdn.example/e.jpg",
    { game: null },
  );

  await expect(actor.toggleLike(created.id)).resolves.toBe(true);
  await expect(actor.toggleSave(created.id)).resolves.toBe(true);
  await expect(actor.toggleFollow(bob.getPrincipal())).resolves.toBe(true);
  await expect(actor.isFollowing(bob.getPrincipal())).resolves.toBe(true);

  const saved = await actor.listMySaved();
  expect(saved.map((v) => v.id)).toContain(created.id);
});

it("updates the profile and credits coins", async () => {
  actor.setIdentity(alice);
  const updated = await actor.updateMyProfile("Alice", [
    "https://cdn.example/avatar.jpg",
  ]);
  expect(updated.displayName).toBe("Alice");

  const balance = await actor.creditMyCoins(100n);
  expect(balance).toBe(100n);
  await expect(actor.getMyCoinBalance()).resolves.toBe(100n);
});

it("keeps one caller's data isolated from another", async () => {
  const aliceActor = await registerCaller(
    pic!.createActor<_SERVICE>(idlFactory, canisterId),
    alice,
  );
  const bobActor = await registerCaller(
    pic!.createActor<_SERVICE>(idlFactory, canisterId),
    bob,
  );

  const aliceVideo = await aliceActor.createVideo(
    "Alice private",
    "",
    "https://cdn.example/p.mp4",
    "https://cdn.example/p.jpg",
    { game: null },
  );
  await aliceActor.toggleSave(aliceVideo.id);

  // Bob sees none of Alice's private state.
  await expect(bobActor.listMyVideos()).resolves.toEqual([]);
  await expect(bobActor.listMySaved()).resolves.toEqual([]);
  await expect(bobActor.isFollowing(alice.getPrincipal())).resolves.toBe(
    false,
  );

  // Alice still sees her own upload and saved list.
  const aliceMine = await aliceActor.listMyVideos();
  expect(aliceMine.map((v) => v.id)).toContain(aliceVideo.id);
  const aliceSaved = await aliceActor.listMySaved();
  expect(aliceSaved.map((v) => v.id)).toContain(aliceVideo.id);
});
