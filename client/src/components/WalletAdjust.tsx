import { useState } from 'react';
import { adjustBalance } from '../api/wallets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';

export interface WalletAdjustProps {
  walletId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function WalletAdjust({
  walletId,
  onSuccess,
  onCancel,
}: WalletAdjustProps): JSX.Element {
  const [adjustTarget, setAdjustTarget] = useState('');
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState(false);

  const handleAdjust = async (): Promise<void> => {
    setAdjustError(null);
    const target = adjustTarget.trim();

    if (!target) {
      setAdjustError('Target balance is required.');
      return;
    }
    if (!Number.isFinite(Number(target))) {
      setAdjustError('Target balance must be a valid number.');
      return;
    }

    setAdjusting(true);
    try {
      await adjustBalance(walletId, { targetBalance: target });
      setAdjustTarget('');
      onSuccess();
    } catch (err: unknown) {
      setAdjustError(
        err instanceof Error ? err.message : 'Failed to adjust balance',
      );
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <TableRow>
      <TableCell colSpan={6}>
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            padding: '0.5rem 0',
          }}
        >
          <span className="text-sm text-muted-foreground">
            Adjust to:
          </span>
          <Input
            type="number"
            step="0.01"
            placeholder="Target balance"
            value={adjustTarget}
            onChange={(e) => setAdjustTarget(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdjust();
            }}
            style={{ maxWidth: '160px' }}
            aria-label="Target balance"
            disabled={adjusting}
          />
          <Button
            size="sm"
            onClick={() => handleAdjust()}
            disabled={adjusting || !adjustTarget.trim()}
          >
            {adjusting ? 'Adjusting…' : 'Apply'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAdjustError(null);
              onCancel();
            }}
          >
            Cancel
          </Button>
        </div>
        {adjustError && (
          <p className="text-sm text-destructive">
            {adjustError}
          </p>
        )}
      </TableCell>
    </TableRow>
  );
}
