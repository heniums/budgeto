import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getWallets, type WalletData } from '../api/wallets';
import { WALLETS_KEY } from '../lib/queryKeys';

export function useWalletsQuery(): UseQueryResult<WalletData[], Error> {
  return useQuery({
    queryKey: WALLETS_KEY,
    queryFn: () => getWallets().then((r) => r.wallets),
  });
}
