import { Plus, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingActionButtonProps {
  onClick: () => void;
  label: string;
  icon?: LucideIcon;
}

export function FloatingActionButton({
  onClick,
  label,
  icon: Icon = Plus,
}: FloatingActionButtonProps): JSX.Element {
  return (
    <Button
      size="icon"
      className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-primary shadow-lg shadow-primary/25 text-primary-foreground hover:bg-primary/90"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Icon className="h-6 w-6" aria-hidden />
    </Button>
  );
}
