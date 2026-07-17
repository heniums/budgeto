import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '../auth/AuthContext';
import {
  Home as HomeIcon,
  Settings as SettingsIcon,
  LogOut,
  Menu,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: typeof HomeIcon;
  end?: boolean;
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Home', icon: HomeIcon, end: true },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
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

export function Layout(): JSX.Element {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = (): void => {
    logout();
    navigate('/login', { replace: true });
  };

  const userBlock = user ? (
    <div className="px-2 text-sm">
      <div className="font-medium text-foreground">{user.name}</div>
      <div className="text-muted-foreground">{user.email}</div>
    </div>
  ) : null;

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
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card p-4 md:flex">
        <div className="mb-6 px-2 text-lg font-semibold text-foreground">
          Budgeto
        </div>
        <nav className="flex flex-col gap-1">
          <NavLinks />
        </nav>
        <div className="mt-auto flex flex-col gap-3 border-t pt-4">
          {userBlock}
          {logoutButton}
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
          <span className="font-semibold text-foreground">Budgeto</span>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-4">
              <div className="mb-6 px-2 text-lg font-semibold text-foreground">
                Budgeto
              </div>
              <nav className="flex flex-col gap-1">
                <NavLinks onNavigate={() => setOpen(false)} />
              </nav>
              <div className="mt-auto flex flex-col gap-3 border-t pt-4">
                {userBlock}
                {logoutButton}
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
