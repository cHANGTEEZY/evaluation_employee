import { useQuery } from "@tanstack/react-query";
import { fetchBanks } from "../lib/banks-api";
export const banksQueryKey = ["banks"] as const;
export function useBanks() {
    return useQuery({
        queryKey: banksQueryKey,
        queryFn: fetchBanks,
        staleTime: 1000 * 60 * 5,
    });
}
