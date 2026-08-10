import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/memphis/button';
import {
  Wallet,
  PieChart,
  Receipt,
  TrendingUp,
  LogOut,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from '../components/decor/Avatar';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="memphis-card flex flex-col items-center text-center p-8 rounded-2xl">
      <div className="mb-5 p-4 rounded-xl bg-secondary border-2 border-border">
        <Icon className="h-7 w-7 text-foreground" aria-hidden />
      </div>
      <h3 className="text-lg font-black mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export function Landing(): JSX.Element {
  const { user, status, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate('/', { replace: true });
  };
  return (
    <div className="min-h-screen bg-background canvas-dots">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b-2 border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary border-2 border-border">
                <Wallet
                  className="h-5 w-5 text-primary-foreground"
                  aria-hidden
                />
              </div>
              <span className="text-xl font-black">Budgeto</span>
            </div>
            <nav className="flex items-center gap-4">
              {status === 'authenticated' && user ? (
                <div className="flex items-center gap-3 text-sm">
                  <Avatar variant="mint" size={32} />
                  <div className="text-right leading-tight hidden sm:block">
                    <div className="font-bold text-foreground">
                      {user.name}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {user.email}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" aria-hidden />
                    Log out
                  </Button>
                </div>
              ) : status === 'loading' ? null : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-bold text-foreground hover:text-primary transition-colors"
                  >
                    Sign in
                  </Link>
                  <Button asChild size="sm">
                    <Link to="/signup">Get started</Link>
                  </Button>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 sm:py-36">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-6 memphis-pill inline-block px-3 py-1">
              Personal Finance, Elevated
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6">
              Your Money. <span className="text-primary">Under Control.</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-10 leading-relaxed max-w-xl mx-auto">
              One app for every wallet, every currency, every budget. Track,
              transfer, and thrive — without the spreadsheets.
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
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">
              Everything you need
            </h2>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="memphis-card text-center py-16 px-8 rounded-2xl">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">
              Ready to take control?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join users who have simplified their personal finance management
              with Budgeto.
            </p>
            <Button asChild size="lg">
              <Link to="/signup">
                Create free account
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-border bg-card py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary border-2 border-border">
                <Wallet
                  className="h-4 w-4 text-primary-foreground"
                  aria-hidden
                />
              </div>
              <span className="font-black">Budgeto</span>
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
