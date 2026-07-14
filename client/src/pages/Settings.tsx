import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function Settings(): JSX.Element {
  const { pathname } = useLocation();
  const tab = pathname.startsWith('/settings/categories')
    ? 'categories'
    : pathname.startsWith('/settings/user')
      ? 'user'
      : 'wallets';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your wallets, categories, and account.
        </p>
      </div>

      <Tabs value={tab}>
        <TabsList>
          <TabsTrigger value="wallets" asChild>
            <NavLink to="/settings" end>
              Wallets
            </NavLink>
          </TabsTrigger>
          <TabsTrigger value="categories" asChild>
            <NavLink to="/settings/categories">Categories</NavLink>
          </TabsTrigger>
          <TabsTrigger value="user" asChild>
            <NavLink to="/settings/user">User</NavLink>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Outlet />
    </div>
  );
}
