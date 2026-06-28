"use client";

import * as React from "react";
import {
  getProviderStatus,
  validateProviders,
  type AIProviderStatus,
  type ProviderListResponse,
} from "@/components/upload/upload-api";

const providerStorageKey = "remarker-ai-provider";

type ProviderConfigContextValue = {
  providers: AIProviderStatus[];
  selectedProvider: string | null;
  selectedProviderDetail: AIProviderStatus | null;
  defaultProvider: string | null;
  fallbackEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  setSelectedProvider: (providerId: string) => void;
  refreshProviders: () => Promise<void>;
  validateProviderConfig: () => Promise<void>;
};

const ProviderConfigContext =
  React.createContext<ProviderConfigContextValue | null>(null);

export function ProviderConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [providers, setProviders] = React.useState<AIProviderStatus[]>([]);
  const [selectedProvider, setSelectedProviderState] = React.useState<
    string | null
  >(null);
  const [defaultProvider, setDefaultProvider] = React.useState<string | null>(
    null,
  );
  const [fallbackEnabled, setFallbackEnabled] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const applyProviderList = React.useCallback((list: ProviderListResponse) => {
    setProviders(list.providers);
    setDefaultProvider(list.defaultProvider);
    setFallbackEnabled(list.fallbackEnabled);
    setError(null);
    setSelectedProviderState((currentProvider) => {
      const storedProvider = readStoredProvider();
      const candidate =
        currentProvider ?? storedProvider ?? list.defaultProvider ?? null;

      if (candidate && list.providers.some((provider) => provider.id === candidate)) {
        return candidate;
      }

      const firstConfiguredProvider = list.providers.find(
        (provider) => provider.configured,
      );
      return firstConfiguredProvider?.id ?? list.providers[0]?.id ?? null;
    });
  }, []);

  const refreshProviders = React.useCallback(async () => {
    setIsLoading(true);

    try {
      applyProviderList(await getProviderStatus());
    } catch (refreshError) {
      setError(getErrorMessage(refreshError));
    } finally {
      setIsLoading(false);
    }
  }, [applyProviderList]);

  const validateProviderConfig = React.useCallback(async () => {
    setIsLoading(true);

    try {
      applyProviderList(await validateProviders());
    } catch (validationError) {
      setError(getErrorMessage(validationError));
    } finally {
      setIsLoading(false);
    }
  }, [applyProviderList]);

  React.useEffect(() => {
    void refreshProviders();
  }, [refreshProviders]);

  const setSelectedProvider = React.useCallback((providerId: string) => {
    setSelectedProviderState(providerId);
    writeStoredProvider(providerId);
  }, []);

  const selectedProviderDetail = React.useMemo(
    () =>
      providers.find((provider) => provider.id === selectedProvider) ??
      providers.find((provider) => provider.id === defaultProvider) ??
      null,
    [defaultProvider, providers, selectedProvider],
  );

  const value = React.useMemo<ProviderConfigContextValue>(
    () => ({
      providers,
      selectedProvider,
      selectedProviderDetail,
      defaultProvider,
      fallbackEnabled,
      isLoading,
      error,
      setSelectedProvider,
      refreshProviders,
      validateProviderConfig,
    }),
    [
      providers,
      selectedProvider,
      selectedProviderDetail,
      defaultProvider,
      fallbackEnabled,
      isLoading,
      error,
      setSelectedProvider,
      refreshProviders,
      validateProviderConfig,
    ],
  );

  return (
    <ProviderConfigContext.Provider value={value}>
      {children}
    </ProviderConfigContext.Provider>
  );
}

export function useProviderConfig() {
  const context = React.useContext(ProviderConfigContext);

  if (!context) {
    throw new Error("useProviderConfig must be used within ProviderConfigProvider.");
  }

  return context;
}

function readStoredProvider() {
  try {
    return window.localStorage.getItem(providerStorageKey);
  } catch {
    return null;
  }
}

function writeStoredProvider(providerId: string) {
  try {
    window.localStorage.setItem(providerStorageKey, providerId);
  } catch {
    return;
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Provider configuration could not be loaded.";
}
