import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, Smartphone } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="hero-title">
              Welcome to <span className="text-green-500">ABS REFERZONE</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto" data-testid="hero-description">
              Professional referral-based earning platform. Start earning today with our secure and transparent system.
            </p>
            <div className="space-x-4">
              <Link href="/register">
                <Button size="lg" className="bg-green-500 hover:bg-green-600 text-black px-8 py-4 text-lg font-semibold transform hover:scale-105 transition-transform" data-testid="button-get-started">
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-black px-8 py-4 text-lg font-semibold transition-colors" data-testid="button-login">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" data-testid="features-title">
              Why Choose ABS REFERZONE?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto" data-testid="features-description">
              Our platform offers secure, transparent, and profitable referral earning opportunities.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-8 bg-slate-50 hover:shadow-xl transition-shadow duration-300" data-testid="feature-security">
              <CardContent className="pt-6">
                <div className="bg-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="text-2xl text-black" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Secure Platform</h3>
                <p className="text-gray-600">Bank-level security with encrypted transactions and secure data storage.</p>
              </CardContent>
            </Card>
            <Card className="text-center p-8 bg-slate-50 hover:shadow-xl transition-shadow duration-300" data-testid="feature-referrals">
              <CardContent className="pt-6">
                <div className="bg-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="text-2xl text-black" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Referral System</h3>
                <p className="text-gray-600">Earn commission for every successful referral with our transparent system.</p>
              </CardContent>
            </Card>
            <Card className="text-center p-8 bg-slate-50 hover:shadow-xl transition-shadow duration-300" data-testid="feature-withdrawals">
              <CardContent className="pt-6">
                <div className="bg-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Smartphone className="text-2xl text-black" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Easy Withdrawals</h3>
                <p className="text-gray-600">Quick withdrawals to Easypaisa and JazzCash wallets with minimal fees.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" data-testid="how-it-works-title">
              How It Works
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center" data-testid="step-1">
              <div className="bg-green-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-black font-bold text-xl">
                1
              </div>
              <h3 className="font-semibold mb-2">Sign Up</h3>
              <p className="text-gray-600 text-sm">Create your account with email and password</p>
            </div>
            <div className="text-center" data-testid="step-2">
              <div className="bg-green-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-black font-bold text-xl">
                2
              </div>
              <h3 className="font-semibold mb-2">Deposit PKR 1000</h3>
              <p className="text-gray-600 text-sm">Make your initial deposit via Easypaisa</p>
            </div>
            <div className="text-center" data-testid="step-3">
              <div className="bg-green-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-black font-bold text-xl">
                3
              </div>
              <h3 className="font-semibold mb-2">Share & Earn</h3>
              <p className="text-gray-600 text-sm">Share your referral link and earn commissions</p>
            </div>
            <div className="text-center" data-testid="step-4">
              <div className="bg-green-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-black font-bold text-xl">
                4
              </div>
              <h3 className="font-semibold mb-2">Withdraw</h3>
              <p className="text-gray-600 text-sm">Withdraw your earnings to your mobile wallet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
