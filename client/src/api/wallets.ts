import { apiClient } from './client';

export interface WalletData {
  id: string;
  name: string;
  description: string;
  color: string;
  balance: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWalletInput {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateWalletInput {
  name?: string;
  description?: string;
  color?: string;
}

export async function createWallet(
  input: CreateWalletInput,
): Promise<WalletData> {
  const response = await apiClient.post<WalletData>('/wallets', input);
  return response.data;
}

export async function getWallets(): Promise<{ wallets: WalletData[] }> {
  const response = await apiClient.get<{ wallets: WalletData[] }>('/wallets');
  return response.data;
}

export async function getWallet(id: string): Promise<WalletData> {
  const response = await apiClient.get<WalletData>(`/wallets/${id}`);
  return response.data;
}

export async function updateWallet(
  id: string,
  input: UpdateWalletInput,
): Promise<WalletData> {
  const response = await apiClient.put<WalletData>(`/wallets/${id}`, input);
  return response.data;
}

export async function deleteWallet(id: string): Promise<void> {
  await apiClient.delete(`/wallets/${id}`);
}
