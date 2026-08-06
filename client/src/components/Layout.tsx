import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
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
            [
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            ].join(' ')
          }
        >
          <Icon className="h-4 w-4" aria-hidden />
          {label}
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
      <div className="mb-6 shrink-0 px-2 text-lg font-semibold text-foreground">
        Budgeto
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        <NavLinks onNavigate={onNavigate} />
      </nav>
      <div className="mt-auto flex shrink-0 flex-col gap-3 border-t pt-4">
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
    <div className="px-2 text-sm">
      <div className="font-medium text-foreground">{user.name}</div>
      <div className="text-muted-foreground">{user.email}</div>
    </div>
  ) : null;

  const themeToggle = (
    <div
      role="radiogroup"
      aria-label="Theme mode"
      className="flex items-center gap-1 rounded-lg border border-white/10 bg-background/80 p-1"
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'light'}
        aria-label="Light theme"
        onClick={() => setMode('light')}
        className={`rounded-md p-1.5 transition-colors ${mode === 'light' ? 'bg-primary/20 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
      >
        <Sun className="h-3.5 w-3.5" aria-hidden />
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'system'}
        aria-label="System theme"
        onClick={() => setMode('system')}
        className={`rounded-md p-1.5 transition-colors ${mode === 'system' ? 'bg-primary/20 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
      >
        <Monitor className="h-3.5 w-3.5" aria-hidden />
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'dark'}
        aria-label="Dark theme"
        onClick={() => setMode('dark')}
        className={`rounded-md p-1.5 transition-colors ${mode === 'dark' ? 'bg-primary/20 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
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
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-hidden glass-strong p-4 md:flex">
        <SidebarContent>
          {userBlock}
          {themeToggle}
          {logoutButton}
        </SidebarContent>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b glass-strong px-4 py-3 md:hidden">
          <span className="font-semibold text-foreground">Budgeto</span>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-4">
              <div className="flex h-full flex-col overflow-hidden">
                <SidebarContent onNavigate={() => setOpen(false)}>
                  {userBlock}
                  {themeToggle}
                  {logoutButton}
                </SidebarContent>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <main className="min-w-0 flex-1 p-4 md:p-8 gradient-mesh">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
