import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Users, TrendingUp, Clock, Copy, ArrowUp, ArrowDown, Plus } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const user = authService.getUser();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/user/profile"],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/user/transactions"],
  });

  const { data: referrals, isLoading: referralsLoading } = useQuery({
    queryKey: ["/api/user/referrals"],
  });

  const { data: deposits } = useQuery({
    queryKey: ["/api/deposits"],
  });

  const { data: withdrawals } = useQuery({
    queryKey: ["/api/withdrawals"],
  });

  const pendingWithdrawals = withdrawals ? withdrawals.filter((w: any) => w.status === "pending") : [];
  const pendingWithdrawalAmount = pendingWithdrawals.reduce((sum: number, w: any) => sum + parseFloat(w.amount), 0);

  const referralLink = `${window.location.origin}/register?ref=${profile?.referralCode || ''}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  const shareOnWhatsApp = () => {
    const message = `Join ABS REFERZONE and start earning! Use my referral link: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, "_blank");
  };

  if (profileLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen" data-testid="dashboard-page">
      {/* Dashboard Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="dashboard-title">Dashboard</h1>
              <p className="text-gray-600" data-testid="welcome-message">
                Welcome back, {profile?.fullName || 'User'}
              </p>
            </div>
            <div className="flex space-x-4">
              <Link href="/deposit">
                <Button className="bg-green-500 hover:bg-green-600 text-black" data-testid="button-deposit">
                  <Plus className="mr-2 h-4 w-4" />
                  Deposit
                </Button>
              </Link>
              <Link href="/withdrawal">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-withdrawal">
                  <ArrowUp className="mr-2 h-4 w-4" />
                  Withdraw
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white rounded-xl shadow-lg" data-testid="balance-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <Wallet className="text-black text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm">Current Balance</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="balance-amount">
                    PKR {parseFloat(profile?.balance || "0").toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-lg" data-testid="referrals-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <Users className="text-white text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm">Total Referrals</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="referrals-count">
                    {referrals?.totalReferrals || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-lg" data-testid="earnings-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-purple-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-white text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm">Total Earnings</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="earnings-amount">
                    PKR {parseFloat(referrals?.totalEarnings || "0").toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-lg" data-testid="pending-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-orange-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <Clock className="text-white text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm">Pending Withdrawals</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="pending-amount">
                    PKR {pendingWithdrawalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Referral Link Section */}
          <Card className="bg-white rounded-xl shadow-lg" data-testid="referral-section">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Your Referral Link</h3>
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-sm text-gray-600 mb-2">Share this link to earn commissions</p>
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    readOnly
                    value={referralLink}
                    className="flex-1 bg-white border border-gray-300 text-sm"
                    data-testid="referral-link"
                  />
                  <Button
                    onClick={copyReferralLink}
                    className="bg-green-500 hover:bg-green-600 text-black"
                    data-testid="button-copy-link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <Button
                  onClick={shareOnFacebook}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-share-facebook"
                >
                  Share on Facebook
                </Button>
                <Button
                  onClick={shareOnWhatsApp}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-share-whatsapp"
                >
                  Share on WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="bg-white rounded-xl shadow-lg" data-testid="transactions-section">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Recent Transactions</h3>
              <div className="space-y-3">
                {transactionsLoading ? (
                  <p className="text-gray-500">Loading transactions...</p>
                ) : (transactions && Array.isArray(transactions) && transactions.length > 0) ? (
                  transactions.slice(0, 5).map((transaction: any) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      data-testid={`transaction-${transaction.id}`}
                    >
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === "deposit" ? "bg-blue-100" :
                          transaction.type === "withdrawal" ? "bg-red-100" :
                          "bg-green-100"
                        }`}>
                          {transaction.type === "deposit" ? (
                            <ArrowDown className={transaction.type === "deposit" ? "text-blue-600" : ""} />
                          ) : transaction.type === "withdrawal" ? (
                            <ArrowUp className="text-red-600" />
                          ) : (
                            <Plus className="text-green-600" />
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === "withdrawal" ? "text-red-600" : "text-green-600"
                        }`}>
                          {transaction.type === "withdrawal" ? "-" : "+"}PKR {parseFloat(transaction.amount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No transactions yet</p>
                )}
              </div>
              {transactions && Array.isArray(transactions) && transactions.length > 5 && (
                <Button
                  variant="outline"
                  className="w-full mt-4 text-green-600 hover:text-green-700 border-green-600"
                  data-testid="button-view-all-transactions"
                >
                  View All Transactions
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
