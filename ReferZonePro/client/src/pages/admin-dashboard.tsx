import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminTabs } from "@/components/layout/admin-tabs";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Users, ArrowDown, ArrowUp, Percent, Settings, Search, Eye, Check, X, UserCheck, UserX } from "lucide-react";

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: authService.isAdmin(),
  });

  const { data: pendingDeposits, isLoading: depositsLoading } = useQuery({
    queryKey: ["/api/admin/pending-deposits"],
    enabled: authService.isAdmin(),
  });

  const { data: pendingWithdrawals, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ["/api/admin/pending-withdrawals"],
    enabled: authService.isAdmin(),
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: authService.isAdmin(),
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
    enabled: authService.isAdmin(),
  });

  const approveDepositMutation = useMutation({
    mutationFn: async ({ id, adminNotes }: { id: string; adminNotes?: string }) => {
      const response = await apiRequest("POST", `/api/admin/deposits/${id}/approve`, { adminNotes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-deposits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Deposit approved",
        description: "The deposit has been approved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to approve deposit",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectDepositMutation = useMutation({
    mutationFn: async ({ id, adminNotes }: { id: string; adminNotes: string }) => {
      const response = await apiRequest("POST", `/api/admin/deposits/${id}/reject`, { adminNotes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-deposits"] });
      toast({
        title: "Deposit rejected",
        description: "The deposit has been rejected",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reject deposit",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const approveWithdrawalMutation = useMutation({
    mutationFn: async ({ id, adminNotes }: { id: string; adminNotes?: string }) => {
      const response = await apiRequest("POST", `/api/admin/withdrawals/${id}/approve`, { adminNotes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Withdrawal approved",
        description: "The withdrawal has been approved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to approve withdrawal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectWithdrawalMutation = useMutation({
    mutationFn: async ({ id, adminNotes }: { id: string; adminNotes: string }) => {
      const response = await apiRequest("POST", `/api/admin/withdrawals/${id}/reject`, { adminNotes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-withdrawals"] });
      toast({
        title: "Withdrawal rejected",
        description: "The withdrawal has been rejected",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reject withdrawal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest("POST", `/api/admin/users/${id}/toggle-status`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User status updated",
        description: "The user status has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update user status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settingsData: any) => {
      const response = await apiRequest("POST", "/api/admin/settings", settingsData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Settings updated",
        description: "The settings have been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApproveDeposit = (id: string) => {
    approveDepositMutation.mutate({ id });
  };

  const handleRejectDeposit = (id: string) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (reason) {
      rejectDepositMutation.mutate({ id, adminNotes: reason });
    }
  };

  const handleApproveWithdrawal = (id: string) => {
    approveWithdrawalMutation.mutate({ id });
  };

  const handleRejectWithdrawal = (id: string) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (reason) {
      rejectWithdrawalMutation.mutate({ id, adminNotes: reason });
    }
  };

  const handleToggleUserStatus = (id: string, currentStatus: boolean) => {
    toggleUserStatusMutation.mutate({ id, isActive: !currentStatus });
  };

  const viewDepositProof = (proofPath: string) => {
    if (proofPath) {
      window.open(`/uploads/${proofPath}`, "_blank");
    }
  };

  const handleUpdateCommission = () => {
    const input = document.getElementById("commission-rate") as HTMLInputElement;
    const value = input?.value;
    if (value && !isNaN(Number(value))) {
      updateSettingsMutation.mutate({ commissionRate: value });
    } else {
      toast({ 
        title: "Invalid value", 
        description: "Please enter a valid commission rate",
        variant: "destructive" 
      });
    }
  };

  const handleUpdateMinWithdrawal = () => {
    const input = document.getElementById("min-withdrawal") as HTMLInputElement;
    const value = input?.value;
    if (value && !isNaN(Number(value))) {
      updateSettingsMutation.mutate({ minWithdrawal: value });
    } else {
      toast({ 
        title: "Invalid value", 
        description: "Please enter a valid minimum withdrawal amount",
        variant: "destructive" 
      });
    }
  };

  const handleUpdateDepositAmount = () => {
    const input = document.getElementById("deposit-amount") as HTMLInputElement;
    const value = input?.value;
    if (value && !isNaN(Number(value))) {
      updateSettingsMutation.mutate({ depositAmount: value });
    } else {
      toast({ 
        title: "Invalid value", 
        description: "Please enter a valid deposit amount",
        variant: "destructive" 
      });
    }
  };

  const filteredUsers = users ? users.filter((user: any) =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const pendingDepositsTab = (
    <div data-testid="pending-deposits-tab">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Pending Deposit Requests</h3>
        <Badge variant="outline" className="bg-orange-100 text-orange-800" data-testid="deposits-count">
          {pendingDeposits ? pendingDeposits.length : 0} Pending
        </Badge>
      </div>
      <div className="space-y-4">
        {depositsLoading ? (
          <p className="text-gray-500">Loading deposits...</p>
        ) : (pendingDeposits && Array.isArray(pendingDeposits) && pendingDeposits.length > 0) ? (
          pendingDeposits.map((deposit: any) => (
            <Card key={deposit.deposits.id} className="border border-gray-200" data-testid={`deposit-${deposit.deposits.id}`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold" data-testid="deposit-user-name">{deposit.users.fullName}</h4>
                    <p className="text-sm text-gray-600" data-testid="deposit-user-email">{deposit.users.email}</p>
                    <p className="text-sm text-gray-600 mt-1" data-testid="deposit-transaction-id">
                      Transaction ID: {deposit.deposits.transactionId}
                    </p>
                    <p className="text-sm text-gray-600" data-testid="deposit-amount">Amount: PKR {deposit.deposits.amount}</p>
                    <p className="text-sm text-gray-500" data-testid="deposit-date">
                      Submitted: {new Date(deposit.deposits.createdAt).toLocaleString()}
                    </p>
                    {deposit.deposits.notes && (
                      <p className="text-sm text-gray-600 mt-1" data-testid="deposit-notes">
                        Notes: {deposit.deposits.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleApproveDeposit(deposit.deposits.id)}
                      className="bg-green-500 hover:bg-green-600 text-black"
                      size="sm"
                      disabled={approveDepositMutation.isPending}
                      data-testid="button-approve-deposit"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleRejectDeposit(deposit.deposits.id)}
                      variant="destructive"
                      size="sm"
                      disabled={rejectDepositMutation.isPending}
                      data-testid="button-reject-deposit"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    {deposit.deposits.proofPath && (
                      <Button
                        onClick={() => viewDepositProof(deposit.deposits.proofPath)}
                        variant="outline"
                        size="sm"
                        data-testid="button-view-proof"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Proof
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">No pending deposits</p>
        )}
      </div>
    </div>
  );

  const pendingWithdrawalsTab = (
    <div data-testid="pending-withdrawals-tab">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Pending Withdrawal Requests</h3>
        <Badge variant="outline" className="bg-orange-100 text-orange-800" data-testid="withdrawals-count">
          {pendingWithdrawals ? pendingWithdrawals.length : 0} Pending
        </Badge>
      </div>
      <div className="space-y-4">
        {withdrawalsLoading ? (
          <p className="text-gray-500">Loading withdrawals...</p>
        ) : (pendingWithdrawals && Array.isArray(pendingWithdrawals) && pendingWithdrawals.length > 0) ? (
          pendingWithdrawals.map((withdrawal: any) => (
            <Card key={withdrawal.withdrawals.id} className="border border-gray-200" data-testid={`withdrawal-${withdrawal.withdrawals.id}`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold" data-testid="withdrawal-user-name">{withdrawal.users.fullName}</h4>
                    <p className="text-sm text-gray-600" data-testid="withdrawal-user-email">{withdrawal.users.email}</p>
                    <p className="text-sm text-gray-600 mt-1" data-testid="withdrawal-method">
                      Method: {withdrawal.withdrawals.method}
                    </p>
                    <p className="text-sm text-gray-600" data-testid="withdrawal-account">
                      Account: {withdrawal.withdrawals.accountNumber} ({withdrawal.withdrawals.accountName})
                    </p>
                    <p className="text-sm text-gray-600" data-testid="withdrawal-amount">
                      Amount: PKR {withdrawal.withdrawals.amount}
                    </p>
                    <p className="text-sm text-gray-500" data-testid="withdrawal-date">
                      Requested: {new Date(withdrawal.withdrawals.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleApproveWithdrawal(withdrawal.withdrawals.id)}
                      className="bg-green-500 hover:bg-green-600 text-black"
                      size="sm"
                      disabled={approveWithdrawalMutation.isPending}
                      data-testid="button-approve-withdrawal"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleRejectWithdrawal(withdrawal.withdrawals.id)}
                      variant="destructive"
                      size="sm"
                      disabled={rejectWithdrawalMutation.isPending}
                      data-testid="button-reject-withdrawal"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">No pending withdrawals</p>
        )}
      </div>
    </div>
  );

  const usersManagementTab = (
    <div data-testid="users-management-tab">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Users Management</h3>
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
            data-testid="input-search-users"
          />
          <Button variant="outline" data-testid="button-search">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Referrals</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Loading users...</TableCell>
              </TableRow>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user: any) => (
                <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium text-gray-900" data-testid="user-name">{user.fullName}</div>
                      <div className="text-sm text-gray-500" data-testid="user-email">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell data-testid="user-balance">PKR {parseFloat(user.balance).toLocaleString()}</TableCell>
                  <TableCell data-testid="user-referrals">-</TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.isActive ? "default" : "secondary"}
                      className={user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      data-testid="user-status"
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                      variant="outline"
                      size="sm"
                      disabled={toggleUserStatusMutation.isPending}
                      data-testid="button-toggle-user-status"
                    >
                      {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      {user.isActive ? "Block" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">No users found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const settingsTab = (
    <div data-testid="settings-tab">
      <h3 className="text-xl font-semibold mb-6">Platform Settings</h3>
      <div className="space-y-6">
        {settingsLoading ? (
          <p className="text-gray-500">Loading settings...</p>
        ) : (
          <>
            <Card className="bg-gray-50" data-testid="commission-setting">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Referral Commission Rate (%)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      defaultValue={settings?.commissionRate ?? "15"}
                      className="w-24"
                      id="commission-rate"
                      data-testid="input-commission-rate"
                    />
                  </div>
                  <Button
                    onClick={handleUpdateCommission}
                    className="bg-green-500 hover:bg-green-600 text-black"
                    disabled={updateSettingsMutation.isPending}
                    data-testid="button-update-commission"
                  >
                    Update
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50" data-testid="withdrawal-setting">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Withdrawal Amount (PKR)
                    </label>
                    <Input
                      type="number"
                      min="50"
                      defaultValue={settings?.minWithdrawal ?? "100"}
                      className="w-32"
                      id="min-withdrawal"
                      data-testid="input-min-withdrawal"
                    />
                  </div>
                  <Button
                    onClick={handleUpdateMinWithdrawal}
                    className="bg-green-500 hover:bg-green-600 text-black"
                    disabled={updateSettingsMutation.isPending}
                    data-testid="button-update-withdrawal"
                  >
                    Update
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50" data-testid="deposit-setting">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fixed Deposit Amount (PKR)
                    </label>
                    <Input
                      type="number"
                      min="500"
                      defaultValue={settings?.depositAmount ?? "1000"}
                      className="w-32"
                      id="deposit-amount"
                      data-testid="input-deposit-amount"
                    />
                  </div>
                  <Button
                    onClick={handleUpdateDepositAmount}
                    className="bg-green-500 hover:bg-green-600 text-black"
                    disabled={updateSettingsMutation.isPending}
                    data-testid="button-update-deposit"
                  >
                    Update
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );

  if (statsLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen" data-testid="admin-dashboard-page">
      {/* Admin Header */}
      <div className="bg-red-600 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-white" data-testid="admin-dashboard-title">Admin Dashboard</h1>
              <p className="text-red-100" data-testid="admin-subtitle">ABS REFERZONE Management Portal</p>
            </div>
            <div className="flex space-x-4">
              <Button variant="outline" className="bg-white text-red-600 hover:bg-red-50" data-testid="button-settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white rounded-xl shadow-lg" data-testid="total-users-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <Users className="text-white text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="total-users-count">
                    {stats?.totalUsers || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-lg" data-testid="total-deposits-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <ArrowDown className="text-black text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm">Total Deposits</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="total-deposits-amount">
                    PKR {parseFloat(stats?.totalDeposits || "0").toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-lg" data-testid="total-withdrawals-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-red-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <ArrowUp className="text-white text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm">Total Withdrawals</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="total-withdrawals-amount">
                    PKR {parseFloat(stats?.totalWithdrawals || "0").toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-lg" data-testid="commission-rate-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-purple-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <Percent className="text-white text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm">Commission Rate</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="commission-rate">
                    {stats?.commissionRate || 15}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <AdminTabs
          defaultTab="pending-deposits"
          tabs={[
            {
              id: "pending-deposits",
              label: "Pending Deposits",
              content: pendingDepositsTab,
            },
            {
              id: "pending-withdrawals",
              label: "Pending Withdrawals",
              content: pendingWithdrawalsTab,
            },
            {
              id: "users-management",
              label: "Users Management",
              content: usersManagementTab,
            },
            {
              id: "settings",
              label: "Settings",
              content: settingsTab,
            },
          ]}
        />
      </div>
    </div>
  );
}
