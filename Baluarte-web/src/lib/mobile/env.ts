const ENV_API_BASE_URLS = {
  development: "http://localhost:8080",
  staging: "https://staging-api.example.com",
  production: "https://api.example.com"
} as const;

type RuntimeEnvironment = keyof typeof ENV_API_BASE_URLS;

function toRuntimeEnvironment(value: string | undefined): RuntimeEnvironment {
  if (value === "staging") {
    return "staging";
  }

  if (value === "production") {
    return "production";
  }

  return "development";
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export function resolveApiBaseUrl(): string {
  const explicitValue = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (explicitValue && explicitValue.trim().length > 0) {
    return trimTrailingSlash(explicitValue.trim());
  }

  const runtimeEnvironment = toRuntimeEnvironment(process.env.EXPO_PUBLIC_ENV ?? process.env.NODE_ENV);
  return ENV_API_BASE_URLS[runtimeEnvironment];
}

export function resolveApiV1BaseUrl(): string {
  return `${resolveApiBaseUrl()}/api/v1`;
}

export function shouldUseMockCategories(): boolean {
  const explicit = process.env.EXPO_PUBLIC_USE_MOCK_CATEGORIES;
  if (explicit === "true") {
    return true;
  }

  if (explicit === "false") {
    return false;
  }

  return false;
}

export const DEFAULT_API_TIMEOUT_MS = 8000;
