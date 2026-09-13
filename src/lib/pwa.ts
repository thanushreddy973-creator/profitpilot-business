// Single, guarded registrar for the generated service worker (/sw.js).
// Never registers in dev, inside an iframe, on Lovable preview hosts, or with ?sw=off.

const SW_URL = "/sw.js";

function isLovablePreviewHost(hostname: string): boolean {
  return (
    hostname.startsWith("id-preview--") ||
    hostname.startsWith("preview--") ||
    hostname === "lovableproject.com" ||
    hostname.endsWith(".lovableproject.com") ||
    hostname === "lovableproject-dev.com" ||
    hostname.endsWith(".lovableproject-dev.com") ||
    hostname === "beta.lovable.dev" ||
    hostname.endsWith(".beta.lovable.dev")
  );
}

function shouldRegister(): boolean {
  if (!import.meta.env.PROD) return false;
  if (window.self !== window.top) return false;
  if (isLovablePreviewHost(window.location.hostname)) return false;
  if (new URLSearchParams(window.location.search).has("sw")) {
    return new URLSearchParams(window.location.search).get("sw") !== "off";
  }
  return true;
}

async function unregisterAppServiceWorkers(): Promise<void> {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations
      .filter((registration) => {
        const scriptUrl =
          registration.active?.scriptURL ??
          registration.waiting?.scriptURL ??
          registration.installing?.scriptURL ??
          "";
        return scriptUrl.endsWith(SW_URL);
      })
      .map((registration) => registration.unregister()),
  );
}

export function setupPwa(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  if (!shouldRegister()) {
    void unregisterAppServiceWorkers();
    return;
  }

  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(SW_URL, { scope: "/" }).catch(() => {
      // Registration failures must never break the app.
    });
  });
}
