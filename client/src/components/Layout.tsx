import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout(): JSX.Element {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-content">
        <Outlet />
      </div>
    </div>
  );
}
