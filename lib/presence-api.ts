import { apiClient } from "./api-client";

export const PRESENCE_STATUSES = [
  { value: "on_site", label: "On-site" },
  { value: "office", label: "Office" },
  { value: "leave", label: "Leave" },
  { value: "others", label: "Others" },
] as const;

export type PresenceStatusValue =
  (typeof PRESENCE_STATUSES)[number]["value"];

export interface PresenceResponse {
  success: boolean;
  presenceStatus: string | null;
  presenceClientName: string | null;
}

export async function getPresence(): Promise<PresenceResponse> {
  const response = await apiClient.get("/api/user-management/presence");
  return response.data;
}

export async function updatePresence(
  presenceStatus: PresenceStatusValue | null,
  presenceClientName?: string | null
): Promise<PresenceResponse> {
  const response = await apiClient.patch("/api/user-management/presence", {
    presenceStatus,
    presenceClientName:
      presenceStatus === "on_site" ? presenceClientName ?? null : null,
  });
  return response.data;
}
