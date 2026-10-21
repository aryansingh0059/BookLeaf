import { env } from "./env.js";

export function corsOrigin(origin, callback) {
  callback(null, Boolean(origin && env.CLIENT_ORIGIN.includes(origin)));
}
