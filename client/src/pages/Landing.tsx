import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Wallet,
  PieChart,
  Receipt,
  TrendingUp,
  Shield,
  ArrowRight,
} from 'lucide-react';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-xl bg-card border shadow-sm">
      <div className="mb-4 p-3 rounded-full bg-primary/10">
        <Icon className="h-6 w-6 text-primary" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function Landing(): JSX.Element {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary">
                <Wallet className="h-5 w-5 text-primary-foreground" aria-hidden />
              </div>
              <span className="text-xl font-bold">Budgeto</span>
            </div>
            <nav className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
              <Button asChild size="sm">
                <Link to="/signup">Get started</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Your Money,{' '}
              <span className="text-primary">Under Control</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed">
              Track expenses, manage multiple wallets, and understand your spending habits. 
              Simple personal finance management for everyone.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/signup">
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Simple yet powerful tools to help you take control of your finances
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Wallet}
              title="Multiple Wallets"
              description="Manage cash, bank accounts, and savings separately. See all your balances at a glance."
            />
            <FeatureCard
              icon={Receipt}
              title="Track Transactions"
              description="Record income and expenses quickly. Add notes and dates to keep context."
            />
            <FeatureCard
              icon={PieChart}
              title="Categories"
              description="Organize transactions by category. Understand where your money goes."
            />
            <FeatureCard
              icon={TrendingUp}
              title="Transfer Between Wallets"
              description="Move money between accounts. Track internal transfers without double counting."
            />
            <FeatureCard
              icon={Shield}
              title="Secure & Private"
              description="Your data stays yours. Secure authentication keeps your finances private."
            />
            <FeatureCard
              icon={ArrowRight}
              title="Easy to Start"
              description="No complex setup. Sign up and start tracking in minutes, not hours."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to take control?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of users who have simplified their personal finance management with Budgeto.
          </p>
          <Button asChild size="lg">
            <Link to="/signup">
              Create free account
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary">
                <Wallet className="h-4 w-4 text-primary-foreground" aria-hidden />
              </div>
              <span className="font-semibold">Budgeto</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Budgeto. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
