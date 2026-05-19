import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  Link,
} from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { Sidebar, MobileNav } from "@/components/habit/sidebar";
import { HabitsProvider } from "@/hooks/use-habits";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Page not found</p>
        <Link to="/" className="inline-block mt-4 px-4 py-2 rounded-md text-white" style={{ background: "var(--gradient-primary)" }}>Go home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-4 px-4 py-2 rounded-md text-white" style={{ background: "var(--gradient-primary)" }}>Try again</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Habitus — Professional habit tracker" },
      { name: "description", content: "Track daily habits, streaks, and analytics in a sleek dark interface." },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="obsidian">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <HabitsProvider>
        <div className="flex min-h-screen w-full bg-[var(--bg-base)]">
          <Sidebar />
          <main className="flex-1 min-w-0 px-4 md:px-8 py-6 pb-24 md:pb-8">
            <Outlet />
          </main>
          <MobileNav />
          <Toaster theme="dark" position="top-right" />
        </div>
      </HabitsProvider>
    </QueryClientProvider>
  );
}
