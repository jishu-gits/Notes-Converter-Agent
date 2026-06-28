const requestTimeoutMs = 30000;

export type JobStatusValue =
  | "queued"
  | "uploading"
  | "extracting"
  | "generating"
  | "formatting"
  | "processing"
  | "completed"
  | "failed";

export type AIProviderStatus = {
  id: string;
  label: string;
  model: string;
  configured: boolean;
  selected: boolean;
  reason?: string;
};

export type ProviderListResponse = {
  defaultProvider: string;
  fallbackEnabled: boolean;
  providers: AIProviderStatus[];
};

export type UploadJob = {
  jobId: string;
  provider?: string;
};

export type JobStatus = {
  jobId: string;
  status: JobStatusValue;
  rawStatus: string;
  progress?: number;
  markdown?: string;
  error?: string;
  provider?: string;
  providerLabel?: string;
  fallbackProvider?: string;
};

export class UploadApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadApiError";
  }
}

export async function getProviderStatus(): Promise<ProviderListResponse> {
  return normalizeProviderList(await requestJson("/providers"));
}

export async function validateProviders(): Promise<ProviderListResponse> {
  return normalizeProviderList(
    await requestJson("/providers/validate", {
      method: "POST",
    }),
  );
}

export async function uploadPDF(
  file: File,
  providerId?: string,
): Promise<UploadJob> {
  const formData = new FormData();
  formData.append("file", file);

  if (providerId) {
    formData.append("provider", providerId);
  }

  const data = await requestJson("/upload", {
    method: "POST",
    body: formData,
  });
  const jobId = readString(data, ["job_id", "jobId", "id"]);

  if (!jobId) {
    throw new UploadApiError("Upload response did not include a job id.");
  }

  return {
    jobId,
    provider: readString(data, ["provider"]),
  };
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const data = await requestJson(`/jobs/${encodeURIComponent(jobId)}`);
  const rawStatus = readString(data, ["status", "state"]) ?? "processing";
  const responseJobId = readString(data, ["job_id", "jobId", "id"]) ?? jobId;

  return {
    jobId: responseJobId,
    status: normalizeStatus(rawStatus),
    rawStatus,
    progress: readProgress(data),
    markdown: readMarkdown(data),
    error: readString(data, ["error", "message", "detail"]),
    provider: readString(data, ["provider"]),
    providerLabel: readString(data, ["provider_label", "providerLabel"]),
    fallbackProvider: readString(data, ["fallback_provider", "fallbackProvider"]),
  };
}

export async function getGeneratedMarkdown(
  jobId: string,
  completedStatus?: JobStatus,
): Promise<string> {
  if (completedStatus?.markdown) {
    return completedStatus.markdown;
  }

  const response = await request(`/jobs/${encodeURIComponent(jobId)}/markdown`, {
    headers: {
      Accept: "text/markdown, application/json, text/plain",
    },
  });
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data: unknown = await response.json();
    const markdown = readMarkdown(data);

    if (!markdown) {
      throw new UploadApiError("Markdown response did not include content.");
    }

    return markdown;
  }

  const markdown = await response.text();

  if (!markdown.trim()) {
    throw new UploadApiError("Markdown response was empty.");
  }

  return markdown;
}

export async function downloadMarkdown(jobId: string): Promise<Blob> {
  return requestBlob(`/jobs/${encodeURIComponent(jobId)}/download/md`, {
    headers: {
      Accept: "text/markdown, application/octet-stream",
    },
  });
}

export async function downloadPDF(jobId: string): Promise<Blob> {
  return requestBlob(`/jobs/${encodeURIComponent(jobId)}/download/pdf`, {
    headers: {
      Accept: "application/pdf, application/octet-stream",
    },
  });
}

export async function deleteJob(jobId: string): Promise<void> {
  await request(`/jobs/${encodeURIComponent(jobId)}`, {
    method: "DELETE",
  });
}

async function requestJson(
  path: string,
  init: RequestInit = {},
): Promise<unknown> {
  const response = await request(path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
  });

  try {
    return await response.json();
  } catch {
    throw new UploadApiError("Backend returned an invalid JSON response.");
  }
}

async function requestBlob(path: string, init: RequestInit = {}) {
  const response = await request(path, init);
  return response.blob();
}

async function request(path: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new UploadApiError(await readErrorMessage(response));
    }

    return response;
  } catch (error) {
    if (error instanceof UploadApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new UploadApiError("Backend request timed out. Please retry.");
    }

    throw new UploadApiError("Unable to reach the backend. Please retry.");
  } finally {
    window.clearTimeout(timeout);
  }
}

async function readErrorMessage(response: Response) {
  const text = await response.text();

  try {
    const data: unknown = JSON.parse(text);
    const message = readString(data, ["detail", "message", "error"]);

    if (message) {
      return message;
    }
  } catch {
    if (text.trim()) {
      return text;
    }
  }

  return `Backend request failed with status ${response.status}.`;
}

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw new UploadApiError("NEXT_PUBLIC_API_BASE_URL is not configured.");
  }

  return baseUrl.replace(/\/$/, "");
}

function normalizeStatus(status: string): JobStatusValue {
  const normalized = status.toLowerCase().replace(/[\s_-]+/g, "");

  if (["queued", "pending"].includes(normalized)) {
    return "queued";
  }

  if (["uploading", "uploaded"].includes(normalized)) {
    return "uploading";
  }

  if (["extracting", "extractingtext", "textextraction"].includes(normalized)) {
    return "extracting";
  }

  if (
    ["generating", "generatingmarkdown", "markdown", "converting"].includes(
      normalized,
    )
  ) {
    return "generating";
  }

  if (["formatting", "finalizing", "finalising"].includes(normalized)) {
    return "formatting";
  }

  if (["completed", "complete", "done", "success", "succeeded"].includes(normalized)) {
    return "completed";
  }

  if (["failed", "failure", "error", "errored"].includes(normalized)) {
    return "failed";
  }

  return "processing";
}

function normalizeProviderList(data: unknown): ProviderListResponse {
  if (!isRecord(data)) {
    throw new UploadApiError("Provider response was invalid.");
  }

  const providers = Array.isArray(data.providers) ? data.providers : [];
  const defaultProvider =
    readString(data, ["default_provider", "defaultProvider"]) ?? "gemini";

  return {
    defaultProvider,
    fallbackEnabled: readBoolean(data, ["fallback_enabled", "fallbackEnabled"]),
    providers: providers
      .map((provider): AIProviderStatus | null => {
        if (!isRecord(provider)) {
          return null;
        }

        const id = readString(provider, ["id"]);
        const label = readString(provider, ["label"]) ?? id;

        if (!id || !label) {
          return null;
        }

        return {
          id,
          label,
          model: readString(provider, ["model"]) ?? "custom",
          configured: readBoolean(provider, ["configured"]),
          selected: readBoolean(provider, ["selected"]),
          reason: readString(provider, ["reason"]),
        };
      })
      .filter((provider): provider is AIProviderStatus => provider !== null),
  };
}

function readProgress(data: unknown) {
  const progress = readNumber(data, ["progress", "percent", "percentage"]);

  if (typeof progress !== "number") {
    return undefined;
  }

  return Math.min(Math.max(progress > 1 ? progress : progress * 100, 0), 100);
}

function readMarkdown(data: unknown) {
  const direct = readString(data, [
    "markdown",
    "content",
    "result",
    "result_markdown",
  ]);

  if (direct) {
    return direct;
  }

  if (!isRecord(data)) {
    return undefined;
  }

  const nested = data.result ?? data.data ?? data.output;
  return readString(nested, ["markdown", "content", "text"]);
}

function readString(data: unknown, keys: string[]) {
  if (!isRecord(data)) {
    return undefined;
  }

  for (const key of keys) {
    const value = data[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return undefined;
}

function readNumber(data: unknown, keys: string[]) {
  if (!isRecord(data)) {
    return undefined;
  }

  for (const key of keys) {
    const value = data[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return undefined;
}

function readBoolean(data: unknown, keys: string[]) {
  if (!isRecord(data)) {
    return false;
  }

  for (const key of keys) {
    const value = data[key];

    if (typeof value === "boolean") {
      return value;
    }
  }

  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
