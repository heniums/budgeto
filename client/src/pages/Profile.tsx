import { useAuth } from '../auth/AuthContext';

export function Profile(): JSX.Element {
  const { user } = useAuth();
  return (
    <main>
      <h1>Profile</h1>
      <p data-testid="profile-name">{user?.name ?? ''}</p>
    </main>
  );
}
