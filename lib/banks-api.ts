import { apiClient } from "./api-client";
export interface BankBranch {
    id: string;
    bankId: string;
    name: string;
    address: string | null;
    createdAt: string;
}
export interface Bank {
    id: string;
    name: string;
    organizationId: string;
    createdAt: string;
    updatedAt: string;
    branches: BankBranch[];
}
export interface BanksListResponse {
    success: boolean;
    banks: Bank[];
}
export async function fetchBanks(): Promise<Bank[]> {
    const response = await apiClient.get<BanksListResponse>("/api/bank-management/list");
    if (!response.data?.success || !Array.isArray(response.data.banks)) {
        return [];
    }
    return response.data.banks;
}
