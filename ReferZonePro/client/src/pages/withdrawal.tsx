import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { InfoIcon } from "lucide-react";

const withdrawalSchema = z.object({
  method: z.enum(["easypaisa", "jazzcash"], {
    required_error: "Please select a withdrawal method",
  }),
  accountNumber: z.string().min(10, "Account number must be at least 10 digits"),
  accountName: z.string().min(2, "Account name is required"),
  amount: z.string().min(1, "Amount is required").refine((val) => {
    const num = parseFloat(val);
    return num >= 100;
  }, "Minimum withdrawal amount is PKR 100"),
});

type WithdrawalForm = z.infer<typeof withdrawalSchema>;

export default function Withdrawal() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["/api/user/profile"],
  });

  const form = useForm<WithdrawalForm>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      method: undefined,
      accountNumber: "",
      accountName: "",
      amount: "",
    },
  });

  const withdrawalMutation = useMutation({
    mutationFn: async (data: WithdrawalForm) => {
      const response = await apiRequest("POST", "/api/withdrawals", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({
        title: "Withdrawal request submitted!",
        description: "Your withdrawal request has been submitted for admin verification.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Withdrawal submission failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WithdrawalForm) => {
    const amount = parseFloat(data.amount);
    const availableBalance = parseFloat(profile?.balance || "0");

    if (amount > availableBalance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough balance for this withdrawal",
        variant: "destructive",
      });
      return;
    }

    withdrawalMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8" data-testid="withdrawal-page">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white rounded-2xl shadow-2xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900" data-testid="withdrawal-title">Withdraw Funds</h2>
              <p className="text-gray-600 mt-2" data-testid="available-balance">
                Available Balance: <span className="font-bold text-green-600">PKR {parseFloat(profile?.balance || "0").toLocaleString()}</span>
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="withdrawal-form">
                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Withdrawal Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-method">
                            <SelectValue placeholder="Select withdrawal method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="easypaisa" data-testid="option-easypaisa">Easypaisa</SelectItem>
                          <SelectItem value="jazzcash" data-testid="option-jazzcash">JazzCash</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input placeholder="03xxxxxxxxx" {...field} data-testid="input-account-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Account holder name" {...field} data-testid="input-account-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Withdrawal Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="100"
                          placeholder="Enter amount (minimum PKR 100)"
                          {...field}
                          data-testid="input-amount"
                        />
                      </FormControl>
                      <p className="text-sm text-gray-500 mt-1">Minimum withdrawal: PKR 100</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" data-testid="withdrawal-info">
                  <div className="flex">
                    <InfoIcon className="text-blue-600 mt-1 mr-3" />
                    <div>
                      <h4 className="font-semibold text-blue-800">Withdrawal Information:</h4>
                      <ul className="text-sm text-blue-700 mt-2 space-y-1">
                        <li>• Processing time: 24-48 hours</li>
                        <li>• No withdrawal fee for amounts above PKR 500</li>
                        <li>• PKR 50 fee for withdrawals below PKR 500</li>
                        <li>• Double-check your account details before submitting</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 transform hover:scale-105"
                  disabled={withdrawalMutation.isPending}
                  data-testid="button-submit-withdrawal"
                >
                  {withdrawalMutation.isPending ? "Submitting..." : "Submit Withdrawal Request"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/dashboard")}
                  className="w-full"
                  data-testid="button-back-dashboard"
                >
                  Back to Dashboard
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
