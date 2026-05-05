import dns from "node:dns";
import https from "node:https";

dns.setDefaultResultOrder("ipv4first");

/**
 * Stricter timeout + optional IPv4-only DNS for openid-client (Windows / bad IPv6 paths).
 * Set OAUTH_IPV4_AGENT=false to use Node defaults.
 */
export function createGoogleOAuthHttpsAgent(): https.Agent | undefined {
  if (process.env.OAUTH_IPV4_AGENT === "false") {
    return undefined;
  }

  return new https.Agent({
    keepAlive: true,
    lookup(hostname, _options, callback) {
      const host =
        typeof hostname === "string"
          ? hostname.trim()
          : hostname != null
            ? String(hostname).trim()
            : "";
      if (!host) {
        (callback as (e: NodeJS.ErrnoException | null, a: string, f: number) => void)(
          Object.assign(new TypeError("OAuth: empty hostname"), {
            code: "ENOTFOUND",
          }) as NodeJS.ErrnoException,
          "",
          0,
        );
        return;
      }
      dns.lookup(host, { family: 4 }, callback);
    },
  });
}
