import { NostrEvent } from "./nostr-event";

export type NostrOutgoingEvent = ["EVENT", NostrEvent];
export type NostrOutgoingRequest = ["REQ", string, ...NostrQuery[]];
export type NostrOutgoingCount = ["COUNT", string, ...NostrQuery[]];
export type NostrOutgoingClose = ["CLOSE", string];

export type NostrOutgoingMessage = NostrOutgoingEvent | NostrOutgoingRequest | NostrOutgoingClose | NostrOutgoingCount;

export type NostrQuery = {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  "#e"?: string[];
  "#a"?: string[];
  "#p"?: string[];
  "#d"?: string[];
  "#t"?: string[];
  "#r"?: string[];
  "#l"?: string[];
  "#g"?: string[];
  since?: number;
  until?: number;
  limit?: number;
  search?: string;
};

export type NostrRequestFilter = NostrQuery | NostrQuery[];
