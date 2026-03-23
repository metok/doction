import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiClient, ApiError } from "../google/api-client";

describe("ApiClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("adds Authorization header to requests", async () => {
    const mockToken = "test-access-token";
    const getToken = vi.fn().mockResolvedValue(mockToken);
    const client = new ApiClient(getToken);

    const mockResponse = { data: "test" };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await client.get("https://example.com/api/data");

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://example.com/api/data",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
        }),
      }),
    );
  });

  it("limits concurrent requests to 5", async () => {
    const getToken = vi.fn().mockResolvedValue("token");
    const client = new ApiClient(getToken);

    let maxActive = 0;
    let currentActive = 0;

    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      currentActive++;
      maxActive = Math.max(maxActive, currentActive);

      // Simulate 50ms network delay
      await new Promise((resolve) => setTimeout(resolve, 50));

      currentActive--;
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    // Fire 10 concurrent requests
    const requests = Array.from({ length: 10 }, (_, i) =>
      client.get(`https://example.com/api/item/${i}`),
    );

    await Promise.all(requests);

    // At most 5 requests should be active at any point
    expect(maxActive).toBeLessThanOrEqual(5);
    // Some concurrency should actually happen
    expect(maxActive).toBeGreaterThan(1);
  });

  it("throws ApiError on 404 with structured error", async () => {
    const getToken = vi.fn().mockResolvedValue("token");
    const client = new ApiClient(getToken);

    const errorBody = {
      error: {
        code: 404,
        message: "File not found.",
        status: "NOT_FOUND",
      },
    };

    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(errorBody), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(
      client.get("https://example.com/api/missing"),
    ).rejects.toThrow(ApiError);

    try {
      await client.get("https://example.com/api/missing");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(404);
      expect(apiErr.message).toBe("File not found.");
      expect(apiErr.name).toBe("ApiError");
    }
  });
});
