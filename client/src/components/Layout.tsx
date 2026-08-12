import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/memphis/sheet';
import { Button } from '@/components/memphis/button';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../theme/useTheme';
import {
  Home,
  List,
  PieChart,
  Wallet,
  Tag,
  User,
  LogOut,
  Menu,
  Sun,
  Moon,
  Monitor,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from './decor/Avatar';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const navItems: NavItem[] = [
  { to: '/home', label: 'Home', icon: Home, end: true },
  { to: '/transactions', label: 'Transactions', icon: List },
  { to: '/budgets', label: 'Budgets', icon: PieChart },
  { to: '/wallets', label: 'Wallets', icon: Wallet },
  { to: '/categories', label: 'Categories', icon: Tag },
  { to: '/profile', label: 'Profile', icon: User },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }): JSX.Element {
  return (
    <>
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex w-full min-w-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-bold transition-all border-2',
              isActive
                ? 'bg-primary text-primary-foreground border-border memphis-btn-shadow'
                : 'text-foreground border-transparent hover:border-border hover:bg-secondary',
            )
          }
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{label}</span>
        </NavLink>
      ))}
    </>
  );
}

interface SidebarContentProps {
  children: ReactNode;
  onNavigate?: () => void;
}

function SidebarContent({
  children,
  onNavigate,
}: SidebarContentProps): JSX.Element {
  return (
    <>
      <div className="mb-6 shrink-0 px-2 text-lg font-black text-foreground">
        Budgeto
      </div>
      <nav className="flex flex-1 flex-col gap-2 overflow-x-clip overflow-y-auto pr-1">
        <NavLinks onNavigate={onNavigate} />
      </nav>
      <div className="mt-auto flex shrink-0 flex-col gap-3 border-t-2 border-border pt-4">
        {children}
      </div>
    </>
  );
}

export function Layout(): JSX.Element {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { mode, setMode } = useTheme();

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate('/login', { replace: true });
  };

  const userBlock = user ? (
    <div className="flex items-center gap-3 border-2 border-border rounded-xl p-3 bg-card">
      <Avatar variant="mint" size={40} />
      <div className="text-sm min-w-0">
        <div className="font-bold text-foreground truncate">{user.name}</div>
        <div className="text-muted-foreground truncate">{user.email}</div>
      </div>
    </div>
  ) : null;

  const themeToggle = (
    <div
      role="radiogroup"
      aria-label="Theme mode"
      className="bg-card border-2 border-border rounded-full p-1"
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'light'}
        aria-label="Light theme"
        onClick={() => setMode('light')}
        className={cn(
          'rounded-full p-1.5 transition-colors',
          mode === 'light'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <Sun className="h-3.5 w-3.5" aria-hidden />
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'system'}
        aria-label="System theme"
        onClick={() => setMode('system')}
        className={cn(
          'rounded-full p-1.5 transition-colors',
          mode === 'system'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <Monitor className="h-3.5 w-3.5" aria-hidden />
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'dark'}
        aria-label="Dark theme"
        onClick={() => setMode('dark')}
        className={cn(
          'rounded-full p-1.5 transition-colors',
          mode === 'dark'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <Moon className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );

  const logoutButton = (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      className="justify-start"
    >
      <LogOut className="mr-2 h-4 w-4" aria-hidden />
      Log out
    </Button>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-hidden bg-card border-r-2 border-border p-4 md:flex">
        <SidebarContent>
          {userBlock}
          {themeToggle}
          {logoutButton}
        </SidebarContent>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-50 mb-6 flex items-center justify-between border-b-2 border-border bg-card px-4 py-3 memphis-btn-shadow md:hidden">
          <div className="flex items-center gap-2">
            <Avatar variant="mint" size={32} />
            <span className="font-black text-foreground">Budgeto</span>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-4">
              <div className="flex h-full flex-col overflow-hidden bg-card">
                <SidebarContent onNavigate={() => setOpen(false)}>
                  {userBlock}
                  {themeToggle}
                  {logoutButton}
                </SidebarContent>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <main className="min-w-0 flex-1 p-4 md:p-8 canvas-dots">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
