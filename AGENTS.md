# Project Guidance

## User Preferences

- Wants a polished, attractive YouTube-like look and feel
- Wants a four-button bottom navigation bar
- Wants videos to autoplay

## Accepted Requirements

[Filled after each deployed build — what the user asked for and the build delivered]

## Verified Commands

- **typecheck**: `pnpm typecheck`
- **fix**: `pnpm fix`
- **build**: `pnpm build`

## Learnings

- Backend: Motoko with Enhanced Migration; extend the single pending migration src/backend/migrations/00000000_000000.mo to initialize every stable field, never add a second migration file.
- src/backend/main.mo composes domain mixins (videos-api, profiles-api, engagement-api, coins-api, api-doc) with OQL Expose and the Stripe mixin; MixinStripe already declares public query transform, so reference it instead of redeclaring in main.mo.
- Frontend: React 19 + TanStack Router + React Query; routes /, /trending, /upload, /profile, /watch/$videoId, /payment-success, /payment-failure; Layout owns the floating four-button bottom nav; hooks in src/frontend/src/hooks/useQueries.ts; types in src/frontend/src/types/index.ts.
- Backend UserId is Principal; hooks take UserId and use .toText() for query keys, never string casts.
- Uploads use the object-storage extension: ExternalBlob.fromBytes(bytes, type, name).withUploadProgress(cb) and pass blob.getDirectURL() as the FileRef string.
- Coin packs use the Stripe checkout flow: createCoinCheckout returns a session URL, the success URL embeds session_id={CHECKOUT_SESSION_ID}, and confirmCoinPurchase verifies payment_status paid before crediting.
- The backend has no isLiked query; derive saved state from listMySaved and liked state from toggleLike's returned boolean cached via setQueryData.
- Use <output> instead of a div with role=status to satisfy biome useSemanticElements; add motion-reduce:animate-none to decorative animations.
