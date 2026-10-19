import { Button } from "@/components/ui/button";
import {
  useCoinBalance,
  useCoinPacks,
  useCreateCoinCheckout,
  useIsStripeConfigured,
} from "@/hooks/useQueries";
import { formatCoins } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Coins, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

function formatPrice(priceInCents: bigint, currency: string) {
  const amount = Number(priceInCents) / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency.toUpperCase()}`;
  }
}

export function CoinShop() {
  const { data: balance } = useCoinBalance();
  const { data: packs, isLoading: packsLoading } = useCoinPacks();
  const { data: stripeConfigured } = useIsStripeConfigured();
  const createCheckout = useCreateCoinCheckout();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleBuy(packId: string) {
    setPendingId(packId);
    try {
      const session = await createCheckout.mutateAsync(packId);
      if (!session?.url) {
        throw new Error("Stripe session missing url");
      }
      window.location.href = session.url;
    } catch {
      setPendingId(null);
    }
  }

  const packList = packs ?? [];

  return (
    <section
      data-ocid="coinshop.section"
      aria-labelledby="coinshop-heading"
      className="rounded-2xl border border-border/70 bg-card p-5 shadow-subtle"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2
            id="coinshop-heading"
            className="font-display text-lg font-semibold text-foreground"
          >
            Coin packs
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Top up your balance to support creators and unlock perks.
          </p>
        </div>
        <div
          data-ocid="coinshop.balance"
          className="flex shrink-0 items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5"
        >
          <Coins className="size-4 text-primary" aria-hidden="true" />
          <span className="font-display text-sm font-semibold tabular-nums text-primary">
            {formatCoins(balance ?? 0n)}
          </span>
        </div>
      </div>

      {packsLoading ? (
        <div
          data-ocid="coinshop.loading_state"
          className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-secondary/40 py-10 text-sm text-muted-foreground"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading coin packs…
        </div>
      ) : packList.length === 0 ? (
        <p
          data-ocid="coinshop.empty_state"
          className="mt-5 rounded-xl border border-border/70 bg-secondary/40 px-4 py-6 text-center text-sm text-muted-foreground"
        >
          No coin packs are available right now.
        </p>
      ) : (
        <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {packList.map((pack, index) => {
            const isPending = pendingId === pack.id;
            const featured = index === 2;
            return (
              <li key={pack.id}>
                <div
                  data-ocid={`coinshop.pack.${index + 1}`}
                  className={cn(
                    "relative flex h-full flex-col justify-between gap-4 rounded-xl border p-4 transition-smooth",
                    featured
                      ? "border-primary/60 bg-primary/[0.07]"
                      : "border-border/70 bg-secondary/40",
                  )}
                >
                  {featured && (
                    <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-gradient-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                      <Sparkles className="size-3" aria-hidden="true" />
                      Best value
                    </span>
                  )}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {pack.name}
                    </p>
                    <p className="mt-1 flex items-baseline gap-1.5">
                      <span className="font-display text-2xl font-bold tabular-nums text-foreground">
                        {formatCoins(pack.coins)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        coins
                      </span>
                    </p>
                    {pack.description && (
                      <p className="mt-1 text-xs font-medium text-accent">
                        {pack.description}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    data-ocid={`coinshop.buy_button.${index + 1}`}
                    disabled={isPending || stripeConfigured === false}
                    onClick={() => handleBuy(pack.id)}
                    className={cn(
                      "w-full rounded-full font-semibold",
                      featured
                        ? "bg-gradient-primary text-primary-foreground hover:opacity-90"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                    )}
                  >
                    {isPending ? (
                      <>
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                        Redirecting…
                      </>
                    ) : (
                      `Buy for ${formatPrice(pack.priceInCents, pack.currency)}`
                    )}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {stripeConfigured === false && (
        <p
          data-ocid="coinshop.unavailable_state"
          className="mt-4 rounded-lg border border-border/70 bg-secondary/40 px-3 py-2 text-sm text-muted-foreground"
        >
          Card payments are not available yet. Please check back soon.
        </p>
      )}

      {createCheckout.isError && (
        <p
          role="alert"
          data-ocid="coinshop.error_state"
          className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground"
        >
          We couldn&apos;t start that checkout. Please try again.
        </p>
      )}
    </section>
  );
}
