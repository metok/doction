export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ApiClient {
  private getToken: () => Promise<string>;
  private activeRequests = 0;
  private queue: Array<() => void> = [];
  private maxConcurrent = 5;

  constructor(getToken: () => Promise<string>) {
    this.getToken = getToken;
  }

  private async acquireSlot(): Promise<void> {
    if (this.activeRequests < this.maxConcurrent) {
      this.activeRequests++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.activeRequests++;
        resolve();
      });
    });
  }

  private releaseSlot(): void {
    this.activeRequests--;
    const next = this.queue.shift();
    if (next) next();
  }

  async get<T = unknown>(url: string): Promise<T> {
    await this.acquireSlot();
    try {
      const token = await this.getToken();
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message =
          (errorBody as { error?: { message?: string } })?.error?.message ||
          `HTTP ${response.status}`;
        throw new ApiError(message, response.status, errorBody);
      }
      return response.json() as Promise<T>;
    } finally {
      this.releaseSlot();
    }
  }

  async patch<T = unknown>(url: string, body: unknown): Promise<T> {
    await this.acquireSlot();
    try {
      const token = await this.getToken();
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message =
          (errorBody as { error?: { message?: string } })?.error?.message ||
          `HTTP ${response.status}`;
        throw new ApiError(message, response.status, errorBody);
      }
      return response.json() as Promise<T>;
    } finally {
      this.releaseSlot();
    }
  }

  async getBlob(url: string): Promise<Blob> {
    await this.acquireSlot();
    try {
      const token = await this.getToken();
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok)
        throw new ApiError(`HTTP ${response.status}`, response.status);
      return response.blob();
    } finally {
      this.releaseSlot();
    }
  }
}
