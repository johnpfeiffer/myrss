export const trackedItemStatuses = [
  "todo",
  "in progress",
  "completed",
  "cancelled",
] as const;

export type TrackedItemStatus = (typeof trackedItemStatuses)[number];

export interface TrackedItem {
  _id: string;
  userId: string;
  uniqueId: string;
  status: TrackedItemStatus;
  dateStarted: string;
  dateUpdated: string;
  dateCompleted?: string;
  dateCancelled?: string;
}

const uuidV1Pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function assertUuidV1(userId: string): void {
  if (!uuidV1Pattern.test(userId)) {
    throw new Error("userId must be a UUIDv1 string");
  }
}

export function assertLinkUrl(url: string): void {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error("A valid link URL is required");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Link URL must use http or https");
  }
}

export function statusDatePatch(
  status: TrackedItemStatus,
  timestamp: string,
): { dateCompleted?: string; dateCancelled?: string } {
  if (status === "completed") {
    return { dateCompleted: timestamp };
  }
  if (status === "cancelled") {
    return { dateCancelled: timestamp };
  }
  return {};
}

