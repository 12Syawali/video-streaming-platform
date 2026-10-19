import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useConfirmCoinPurchase } from "@/hooks/useQueries";
import { formatCoins } from "@/lib/format";
import HomePage from "@/pages/Home";
import ProfilePage from "@/pages/Profile";
import TrendingPage from "@/pages/Trending";
import UploadPage from "@/pages/Upload";
import WatchPage from "@/pages/Watch";
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useSearch,
} from "@tanstack/react-router";
import { Check, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const trendingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/trending",
  component: TrendingPage,
});

const uploadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/upload",
  component: UploadPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const watchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/watch/$videoId",
  component: WatchPage,
});

function PaymentSuccessPage() {
  const search = useSearch({ strict: false }) as {
    session_id?: string;
    packId?: string;
  };
  const confirm = useConfirmCoinPurchase();
  const [balance, setBalance] = useState<bigint | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    const sessionId = search.session_id;
    const packId = search.packId;
    if (!sessionId || !packId) return;
    started.current = true;
    confirm.mutate(
      { sessionId, packId },
      {
        onSuccess: (newBalance) => setBalance(newBalance),
      },
    );
  }, [search.session_id, search.packId, confirm]);

  const missing = !search.session_id || !search.packId;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      {confirm.isPending && (
        <>
          <Loader2
            className="size-10 animate-spin text-primary"
            aria-hidden="true"
          />
          <h1 className="font-display text-xl font-semibold text-foreground">
            Confirming your payment…
          </h1>
          <p className="text-sm text-muted-foreground">
            This only takes a moment.
          </p>
        </>
      )}

      {!confirm.isPending && balance !== null && (
        <>
          <span className="flex size-12 items-center justify-center rounded-full bg-success/15">
            <Check className="size-6 text-success" aria-hidden="true" />
          </span>
          <h1 className="font-display text-xl font-semibold text-foreground">
            Payment complete
          </h1>
          <p className="text-sm text-muted-foreground">
            Your new balance is {formatCoins(balance)} coins.
          </p>
          <Button asChild className="rounded-full">
            <Link to="/profile">Back to profile</Link>
          </Button>
        </>
      )}

      {!confirm.isPending &&
        balance === null &&
        (confirm.isError || missing) && (
          <>
            <span className="flex size-12 items-center justify-center rounded-full bg-destructive/15">
              <X className="size-6 text-destructive" aria-hidden="true" />
            </span>
            <h1 className="font-display text-xl font-semibold text-foreground">
              We couldn&apos;t confirm your purchase
            </h1>
            <p className="text-sm text-muted-foreground">
              If you were charged, your coins will appear shortly. Otherwise,
              please try again.
            </p>
            <Button asChild variant="secondary" className="rounded-full">
              <Link to="/profile">Back to profile</Link>
            </Button>
          </>
        )}
    </div>
  );
}

function PaymentFailurePage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/15">
        <X className="size-6 text-destructive" aria-hidden="true" />
      </span>
      <h1 className="font-display text-xl font-semibold text-foreground">
        Payment cancelled
      </h1>
      <p className="text-sm text-muted-foreground">
        No charge was made. You can try again whenever you&apos;re ready.
      </p>
      <Button asChild variant="secondary" className="rounded-full">
        <Link to="/profile">Back to profile</Link>
      </Button>
    </div>
  );
}

const paymentSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/payment-success",
  component: PaymentSuccessPage,
});

const paymentFailureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/payment-failure",
  component: PaymentFailurePage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  trendingRoute,
  uploadRoute,
  profileRoute,
  watchRoute,
  paymentSuccessRoute,
  paymentFailureRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
