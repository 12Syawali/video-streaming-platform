import { useCoinBalance } from "@/hooks/useQueries";
import { formatCoins } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { Coins, Flame, Home, Upload, User } from "lucide-react";
import type { ReactNode } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/trending", label: "Trending", icon: Flame },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/profile", label: "Profile", icon: User },
];

function CoinPill() {
  const { data } = useCoinBalance();
  return (
    <div
      data-ocid="header.coin_balance"
      className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/70 px-3 py-1.5"
    >
      <span className="flex size-5 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground">
        <Coins className="size-3" aria-hidden="true" />
      </span>
      <span className="font-display text-sm font-semibold tabular-nums text-foreground">
        {formatCoins(data ?? 0n)}
      </span>
    </div>
  );
}

function BottomNav() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  return (
    <nav
      aria-label="Primary"
      data-ocid="nav.bottom"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <ul className="flex w-full max-w-md items-stretch gap-1 rounded-2xl border border-border/80 bg-card/95 p-1.5 shadow-nav-raised backdrop-blur-xl">
        {NAV_ITEMS.map((item) => {
          const active =
            item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to}
                data-ocid={`nav.${item.label.toLowerCase()}.tab`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-smooth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  active
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-5 transition-transform duration-200 group-hover:-translate-y-0.5",
                    active && "drop-shadow-[0_0_10px_oklch(0.78_0.16_78/0.55)]",
                  )}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4">
          <Link
            to="/"
            data-ocid="header.logo.link"
            className="font-display text-2xl font-bold tracking-tight text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            VELOCITY
          </Link>
          <CoinPill />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-8 pt-4">
        {children}
      </main>

      <footer className="mx-auto w-full max-w-3xl px-4 pb-32 pt-2">
        <p className="text-center text-xs text-muted-foreground">
          Built with love using{" "}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noreferrer"
            data-ocid="footer.attribution_link"
            className="font-medium text-foreground underline-offset-4 transition-smooth hover:text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      <BottomNav />
    </div>
  );
}
