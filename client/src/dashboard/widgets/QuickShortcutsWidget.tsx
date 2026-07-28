import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  PiggyBank,
} from 'lucide-react';

export function QuickShortcutsWidget(): JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        variant="outline"
        className="h-auto flex-col gap-2 py-4"
        onClick={() => navigate('/transactions', { state: { mode: 'income' } })}
      >
        <ArrowDownLeft className="h-5 w-5 text-green-600" />
        <span>Add Income</span>
      </Button>
      <Button
        variant="outline"
        className="h-auto flex-col gap-2 py-4"
        onClick={() => navigate('/transactions', { state: { mode: 'expense' } })}
      >
        <ArrowUpRight className="h-5 w-5 text-red-500" />
        <span>Add Expense</span>
      </Button>
      <Button
        variant="outline"
        className="h-auto flex-col gap-2 py-4"
        onClick={() => navigate('/transactions', { state: { mode: 'transfer' } })}
      >
        <ArrowLeftRight className="h-5 w-5 text-blue-500" />
        <span>Transfer</span>
      </Button>
      <Button
        variant="outline"
        className="h-auto flex-col gap-2 py-4"
        onClick={() => navigate('/budgets')}
      >
        <PiggyBank className="h-5 w-5 text-amber-500" />
        <span>Add Budget</span>
      </Button>
    </div>
  );
}
