"use client";

import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Home,
  Menu,
  Moon,
  RefreshCw,
  Settings,
  Sun,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { useProviderConfig } from "@/services/provider-config";
import { Badge } from "@/shared/ui/badge";
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

  React.useEffect(() => {
    if (!isMobileNavOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileNavOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileNavOpen]);

  const toggleTheme = () => {
    storeTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <TooltipProvider>
      <div
          className={cn(
          "relative min-h-svh overflow-hidden bg-background text-foreground",
          className,
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--accent)_18%,transparent),transparent_34%),linear-gradient(135deg,color-mix(in_oklch,var(--surface)_76%,var(--background)),var(--background)_44%,color-mix(in_oklch,var(--primary)_8%,var(--surface)))]" />

        <aside className="fixed inset-y-4 left-4 z-30 hidden w-72 flex-col rounded-lg border border-border/70 bg-card/82 p-4 shadow-elevation-2 backdrop-blur-xl lg:flex">
          <ShellSidebar
            theme={theme}
            onThemeToggle={toggleTheme}
          />
        </aside>

        <header className="fixed inset-x-0 top-0 z-30 border-b border-border/70 bg-card/86 px-4 py-3 backdrop-blur-xl lg:hidden">
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
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-[background-color,color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive
                  ? "bg-primary text-primary-foreground shadow-elevation-1"
                  : "text-muted-foreground hover:-translate-y-0.5 hover:bg-secondary hover:text-secondary-foreground",
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
        <ProviderSettingsPanel />
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
      <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/70 bg-card shadow-elevation-1">
        <Image
          src="/logo/logo.png"
          alt=""
          width={40}
          height={40}
          className="h-full w-full object-contain p-1.5"
          priority={compact}
        />
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

function ProviderSettingsPanel() {
  const {
    providers,
    selectedProvider,
    selectedProviderDetail,
    fallbackEnabled,
    isLoading,
    error,
    setSelectedProvider,
    validateProviderConfig,
  } = useProviderConfig();

  const handleValidate = async () => {
    await validateProviderConfig();
    toast.message("Provider configuration refreshed");
  };

  return (
    <section
      id="settings"
      aria-labelledby="provider-settings-title"
      className="rounded-lg border border-border/70 bg-surface-raised/90 p-4 shadow-elevation-1"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p
            id="provider-settings-title"
            className="text-sm font-semibold text-foreground"
          >
            AI provider
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {selectedProviderDetail
              ? selectedProviderDetail.model
              : "Checking provider configuration"}
          </p>
        </div>
        <Button
          aria-label="Validate providers"
          size="icon"
          type="button"
          variant="ghost"
          disabled={isLoading}
          onClick={handleValidate}
        >
          <RefreshCw
            aria-hidden="true"
            className={cn(isLoading && "animate-spin")}
          />
        </Button>
      </div>

      <div
        aria-label="AI provider"
        className="grid gap-2"
        role="radiogroup"
      >
        {providers.map((provider) => {
          const isSelected = provider.id === selectedProvider;

          return (
            <button
              key={provider.id}
              aria-checked={isSelected}
              className={cn(
                "rounded-md border p-3 text-left transition-[background-color,border-color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isSelected
                  ? "border-primary bg-primary/10 shadow-elevation-1"
                  : "border-border/70 bg-card/70 hover:-translate-y-0.5 hover:border-primary/50",
                !provider.configured && "opacity-50 cursor-not-allowed hover:translate-y-0 hover:border-border/70",
              )}
              role="radio"
              type="button"
              disabled={!provider.configured}
              onClick={() => setSelectedProvider(provider.id)}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{provider.label}</span>
                <Badge
                  variant={provider.configured ? "success" : "warning"}
                  className="shrink-0"
                >
                  {provider.configured ? (
                    <CheckCircle2 aria-hidden="true" className="size-3.5" />
                  ) : (
                    <AlertTriangle aria-hidden="true" className="size-3.5" />
                  )}
                  {provider.configured ? "Ready" : "Missing"}
                </Badge>
              </span>
              {provider.reason ? (
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  {provider.reason}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant={fallbackEnabled ? "secondary" : "warning"}>
          {fallbackEnabled ? "Fallback on" : "Fallback off"}
        </Badge>
        {error ? (
          <Badge variant="destructive">
            <AlertTriangle aria-hidden="true" className="size-3.5" />
            Offline
          </Badge>
        ) : null}
      </div>
    </section>
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
