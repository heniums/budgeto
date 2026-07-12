import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { routes } from './router';

const router = createBrowserRouter(routes);

export function App(): JSX.Element {
  return <RouterProvider router={router} />;
}
