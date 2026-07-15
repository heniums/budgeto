import type { WalletData } from '../api/wallets';

interface WalletSelectListProps {
  wallets: WalletData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function WalletSelectList({
  _wallets,
  _selectedId,
  _onSelect,
}: WalletSelectListProps): JSX.Element {
  return <div data-testid="wallet-select-list" />;
}
