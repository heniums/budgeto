import dayjs from 'dayjs';
import { useWidgetData } from '../hooks/useWidgetData';
import { WidgetCard } from '../components/WidgetCard';
import { Money } from '@/components/Money';

export function RecentTransactionsWidget(): JSX.Element {
  const { data, loading, error } = useWidgetData('recent-transactions');

  const transactions = data?.transactions ?? [];
  const currency = data?.currency ?? 'USD';

  return (
    <WidgetCard loading={loading} error={error} title="Recent Transactions">
      {transactions.length > 0 ? (
        <ul className="space-y-3">
          {transactions.map((t) => (
            <li key={t.id} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium leading-none">
                  {t.description || 'Unnamed'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dayjs(t.date).format('MMM D')}
                  {t.categoryName ? ` · ${t.categoryName}` : ''}
                  {` · ${t.walletName}`}
                </p>
              </div>
              <Money
                amount={t.amount}
                currency={currency}
                className="text-sm font-medium"
              />
            </li>
          ))}
        </ul>
      ) : (
        !loading && (
          <p className="text-sm text-muted-foreground">
            No recent transactions
          </p>
        )
      )}
    </WidgetCard>
  );
}
