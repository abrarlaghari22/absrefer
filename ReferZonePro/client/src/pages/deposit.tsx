import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import { UploadCloud, AlertTriangle } from "lucide-react";

const depositSchema = z.object({
  transactionId: z.string().min(1, "Transaction ID is required"),
  proof: z.any().refine((files) => files?.length > 0, "Transaction proof is required"),
  notes: z.string().optional(),
});

type DepositForm = z.infer<typeof depositSchema>;

export default function Deposit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [proofFile, setProofFile] = useState<File | null>(null);

  const form = useForm<DepositForm>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      transactionId: "",
      notes: "",
    },
  });

  const depositMutation = useMutation({
    mutationFn: async (data: DepositForm) => {
      const formData = new FormData();
      formData.append("amount", "1000");
      formData.append("transactionId", data.transactionId);
      formData.append("notes", data.notes || "");
      if (proofFile) {
        formData.append("proof", proofFile);
      }

      const response = await fetch("/api/deposits", {
        method: "POST",
        headers: {
          ...authService.getAuthHeaders(),
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({
        title: "Deposit request submitted!",
        description: "Your deposit request has been submitted for admin verification.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Deposit submission failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DepositForm) => {
    depositMutation.mutate(data);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProofFile(file);
      form.setValue("proof", event.target.files);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8" data-testid="deposit-page">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white rounded-2xl shadow-2xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900" data-testid="deposit-title">Make a Deposit</h2>
              <p className="text-gray-600 mt-2" data-testid="deposit-subtitle">
                Minimum and Maximum deposit amount is PKR 1,000
              </p>
            </div>

            {/* Deposit Information */}
            <div className="bg-green-50 border border-green-500 rounded-lg p-6 mb-8" data-testid="deposit-info">
              <h3 className="text-lg font-semibold text-green-800 mb-4">Easypaisa Account Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Account Number:</span>
                  <span className="font-mono bg-white px-2 py-1 rounded" data-testid="account-number">03133048936</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Account Name:</span>
                  <span className="font-mono bg-white px-2 py-1 rounded" data-testid="account-name">ABRAR</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Amount:</span>
                  <span className="font-mono bg-white px-2 py-1 rounded" data-testid="deposit-amount">PKR 1,000</span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8" data-testid="instructions">
              <div className="flex">
                <AlertTriangle className="text-yellow-600 mt-1 mr-3" />
                <div>
                  <h4 className="font-semibold text-yellow-800">Important Instructions:</h4>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• Send exactly PKR 1,000 to the above Easypaisa account</li>
                    <li>• Take a screenshot of the transaction</li>
                    <li>• Upload the proof below for verification</li>
                    <li>• Your deposit will be credited after admin verification</li>
                  </ul>
                </div>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="deposit-form">
                <FormField
                  control={form.control}
                  name="transactionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Easypaisa transaction ID" {...field} data-testid="input-transaction-id" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="proof"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload Transaction Proof</FormLabel>
                      <FormControl>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition duration-200">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="deposit-proof"
                            data-testid="input-proof-file"
                          />
                          <label htmlFor="deposit-proof" className="cursor-pointer">
                            <UploadCloud className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600" data-testid="upload-text">
                              {proofFile ? proofFile.name : "Click to upload screenshot"}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 10MB</p>
                          </label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional information about your deposit"
                          className="min-h-[100px]"
                          {...field}
                          data-testid="textarea-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold py-3 px-4 rounded-lg transition duration-200 transform hover:scale-105"
                  disabled={depositMutation.isPending}
                  data-testid="button-submit-deposit"
                >
                  {depositMutation.isPending ? "Submitting..." : "Submit Deposit Request"}
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
