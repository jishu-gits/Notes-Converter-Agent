"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  Clock,
  Home,
  Menu,
  Moon,
  Settings,
  Sparkles,
  Sun,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { Button } from "@/shared/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

const navigationItems = [
  { label: "Dashboard", icon: Home },
  { label: "Upload", icon: Upload },
  { label: "History", icon: Clock },
  { label: "Settings", icon: Settings },
];

type Theme = "light" | "dark";

const themeStorageKey = "theme";

function getPreferredTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(themeStorageKey);

  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getServerTheme(): Theme {
  return "light";
}

function subscribeToThemeChanges(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const notifyThemeChange = () => onStoreChange();

  window.addEventListener("storage", notifyThemeChange);
  window.addEventListener("themechange", notifyThemeChange);
  mediaQuery.addEventListener("change", notifyThemeChange);

  return () => {
    window.removeEventListener("storage", notifyThemeChange);
    window.removeEventListener("themechange", notifyThemeChange);
    mediaQuery.removeEventListener("change", notifyThemeChange);
  };
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;

  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

function storeTheme(theme: Theme) {
  window.localStorage.setItem(themeStorageKey, theme);
  applyTheme(theme);
  window.dispatchEvent(new Event("themechange"));
}

function useTheme() {
  const theme = React.useSyncExternalStore(
    subscribeToThemeChanges,
    getPreferredTheme,
    getServerTheme,
  );

  React.useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return theme;
}

export function AppShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  const theme = useTheme();

  const toggleTheme = () => {
    storeTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "bg-background text-foreground relative min-h-svh overflow-hidden",
          className,
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--primary)_16%,transparent),transparent_34%),linear-gradient(135deg,color-mix(in_oklch,var(--accent)_18%,var(--background)),var(--background)_42%,color-mix(in_oklch,var(--primary)_10%,var(--surface)))]" />

        <aside className="border-border/70 bg-card/82 shadow-elevation-2 fixed inset-y-4 left-4 z-30 hidden w-72 flex-col rounded-lg border p-4 backdrop-blur-xl lg:flex">
          <ShellSidebar
            theme={theme}
            onThemeToggle={toggleTheme}
          />
        </aside>

        <header className="fixed inset-x-0 top-0 z-30 border-b bg-card/86 px-4 py-3 backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <BrandMark compact />
            <div className="flex items-center gap-2">
              <ThemeToggle
                theme={theme}
                onThemeToggle={toggleTheme}
              />
              <Button
                aria-label="Open navigation"
                size="icon"
                variant="outline"
                onClick={() => setIsMobileNavOpen(true)}
              >
                <Menu aria-hidden="true" />
              </Button>
            </div>
          </div>
        </header>

        <AnimatePresence>
          {isMobileNavOpen ? (
            <>
              <motion.button
                aria-label="Close navigation"
                className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileNavOpen(false)}
              />
              <motion.aside
                className="border-border/70 bg-card fixed inset-y-0 left-0 z-50 flex w-[min(20rem,86vw)] flex-col border-r p-4 shadow-elevation-3 lg:hidden"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="mb-6 flex items-center justify-between gap-3">
                  <BrandMark compact />
                  <Button
                    aria-label="Close navigation"
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsMobileNavOpen(false)}
                  >
                    <X aria-hidden="true" />
                  </Button>
                </div>
                <ShellSidebar
                  showBrand={false}
                  theme={theme}
                  onThemeToggle={toggleTheme}
                />
              </motion.aside>
            </>
          ) : null}
        </AnimatePresence>

        <div className="relative z-10 flex min-h-svh flex-col pt-16 lg:pl-80 lg:pt-0">
          <motion.main
            className="flex min-h-svh flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
              {children}
            </div>
          </motion.main>
        </div>
      </div>
    </TooltipProvider>
  );
}

function ShellSidebar({
  showBrand = true,
  theme,
  onThemeToggle,
}: {
  showBrand?: boolean;
  theme: Theme;
  onThemeToggle: () => void;
}) {
  return (
    <>
      {showBrand ? <BrandMark /> : null}
      <nav
        className={cn("grid gap-1", showBrand ? "mt-8" : "mt-0")}
        aria-label="Primary navigation"
      >
        {navigationItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = index === 0;

          return (
            <button
              key={item.label}
              className={cn(
                "flex h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-elevation-1"
                  : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
              )}
              type="button"
            >
              <Icon aria-hidden="true" className="size-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4">
        <div className="rounded-lg border bg-surface-raised p-4">
          <div className="bg-accent text-accent-foreground mb-3 flex size-9 items-center justify-center rounded-md">
            <Sparkles aria-hidden="true" className="size-4" />
          </div>
          <p className="text-sm font-medium">Phase 1.1 shell</p>
          <p className="text-muted-foreground mt-1 text-xs leading-5">
            Upload and conversion tools arrive in the next phase.
          </p>
        </div>
        <ThemeToggle
          theme={theme}
          onThemeToggle={onThemeToggle}
          fullWidth
        />
      </div>
    </>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-lg shadow-elevation-1">
        <BookOpen aria-hidden="true" className="size-5" />
      </div>
      <div className={cn("min-w-0", compact ? "max-w-48" : "max-w-full")}>
        <p className="truncate text-sm font-semibold">{siteConfig.name}</p>
        <p className="text-muted-foreground truncate text-xs">
          Study material studio
        </p>
      </div>
    </div>
  );
}

function ThemeToggle({
  theme,
  onThemeToggle,
  fullWidth = false,
}: {
  theme: Theme;
  onThemeToggle: () => void;
  fullWidth?: boolean;
}) {
  const isDark = theme === "dark";
  const Icon = isDark ? Moon : Sun;
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  if (fullWidth) {
    return (
      <Button
        className="w-full justify-start"
        variant="outline"
        type="button"
        onClick={onThemeToggle}
      >
        <Icon aria-hidden="true" />
        {isDark ? "Dark theme" : "Light theme"}
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          size="icon"
          variant="outline"
          type="button"
          onClick={onThemeToggle}
        >
          <Icon aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
