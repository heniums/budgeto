import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function Home(): JSX.Element {
  return (
    <main className="home-page">
      <h1 className="text-2xl font-semibold text-foreground">Home</h1>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The dashboard is being built for the next release. Use the{' '}
            <strong>Transactions</strong> tab to manage your activity.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
