import { log } from "next-axiom";

export function sendPageView(path: string, method: string, duration: number) {
  log.info("page-view", {
    service: "baluarte-next",
    path,
    method,
    duration,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  });
}

export function sendClientError(error: Error, info?: Record<string, unknown>) {
  log.error("client-error", {
    service: "baluarte-next",
    error: error.message,
    stack: error.stack,
    ...info,
  });
}
