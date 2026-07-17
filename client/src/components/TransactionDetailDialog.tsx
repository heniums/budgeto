import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { TransactionData } from '../api/transactions';
import dayjs from 'dayjs';
import { Money } from './Money';

interface TransactionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionData;
  walletName: string;
  walletCurrency: string;
  categoryColor?: string;
  onEdit: () => void;
  onDelete: () => void;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  return dayjs(iso).format('M/D/YYYY');
}

export function TransactionDetailDialog({
  open,
  onOpenChange,
  transaction,
  walletName,
  walletCurrency,
  categoryColor,
  onEdit,
  onDelete,
}: TransactionDetailDialogProps): JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transaction details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <span className="text-sm text-muted-foreground">Date</span>
            <p className="text-sm font-medium">
              {formatDate(transaction.createdAt)}
            </p>
          </div>

          <div>
            <span className="text-sm text-muted-foreground">Wallet</span>
            <p className="text-sm font-medium">{walletName}</p>
          </div>

          <div>
            <span className="text-sm text-muted-foreground">Category</span>
            <p className="text-sm font-medium">
              {transaction.categoryName && categoryColor ? (
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: categoryColor + '20',
                    color: categoryColor,
                  }}
                >
                  {transaction.categoryName}
                </span>
              ) : (
                '—'
              )}
            </p>
          </div>

          <div>
            <span className="text-sm text-muted-foreground">Description</span>
            <p className="text-sm font-medium">
              {transaction.description || '—'}
            </p>
          </div>

          <div>
            <span className="text-sm text-muted-foreground">Amount</span>
            <p className="text-lg font-semibold">
              <Money amount={transaction.amount} currency={walletCurrency} />
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={onEdit} variant="default">
            Edit
          </Button>
          <Button onClick={onDelete} variant="destructive">
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
