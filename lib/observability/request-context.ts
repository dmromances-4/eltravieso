import { AsyncLocalStorage } from "async_hooks";

export type RequestContext = {
  requestId: string;
  path?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
};

const storage = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}

export function runWithRequestContext<T>(context: RequestContext, fn: () => T): T {
  return storage.run(context, fn);
}

export function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || undefined;
  }
  return request.headers.get("x-real-ip") ?? undefined;
}

export function buildRequestContext(request: Request, userId?: string): RequestContext {
  return {
    requestId: request.headers.get("x-request-id") ?? crypto.randomUUID(),
    path: new URL(request.url).pathname,
    userId,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}

export function mergeRequestContext(partial: Partial<RequestContext>): void {
  const current = storage.getStore();
  if (!current) return;
  Object.assign(current, partial);
}

type RouteHandler = (request: Request, ...args: unknown[]) => Promise<Response>;

export function withRequestContext(handler: RouteHandler): RouteHandler {
  return async (request: Request, ...args: unknown[]) => {
    const context = buildRequestContext(request);
    return runWithRequestContext(context, () => handler(request, ...args));
  };
}
