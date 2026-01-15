import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "admin" | "user" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("scans router", () => {
  it("should return empty stats for new user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.scans.stats();

    expect(stats).toBeDefined();
    expect(stats.scans.total).toBe(0);
    expect(stats.vulnerabilities.total).toBe(0);
  });

  it("should return empty scan list for new user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const scans = await caller.scans.list();

    expect(scans).toBeDefined();
    expect(Array.isArray(scans)).toBe(true);
    expect(scans.length).toBe(0);
  });

  it("should validate scan creation input", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Valid scan creation
    const result = await caller.scans.create({
      scanType: "http_smuggling",
      target: "https://example.com",
      scope: "*.example.com",
    });

    expect(result).toBeDefined();
    expect(result.scanId).toBeGreaterThan(0);
    expect(result.status).toBe("pending");
  });

  it("should allow admin to view all scans", async () => {
    const adminCtx = createAuthContext("admin");
    const adminCaller = appRouter.createCaller(adminCtx);

    const scans = await adminCaller.scans.list();

    expect(scans).toBeDefined();
    expect(Array.isArray(scans)).toBe(true);
  });

  it("should enforce authentication for protected routes", async () => {
    const unauthCtx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(unauthCtx);

    // Should throw UNAUTHORIZED error
    await expect(caller.scans.list()).rejects.toThrow();
  });
});

describe("auth router", () => {
  it("should return user info for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).toBeDefined();
    expect(user?.email).toBe("test@example.com");
    expect(user?.role).toBe("user");
  });

  it("should return null for unauthenticated user", async () => {
    const unauthCtx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(unauthCtx);
    const user = await caller.auth.me();

    expect(user).toBeNull();
  });
});
