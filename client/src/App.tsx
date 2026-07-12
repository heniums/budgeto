import { useState } from 'react';

export function App(): JSX.Element {
  const [taps] = useState(0);
  return (
    <main>
      <h1>Budgeto</h1>
      <p>Your personal finance companion.</p>
      <p>Taps: {taps}</p>
    </main>
  );
}
