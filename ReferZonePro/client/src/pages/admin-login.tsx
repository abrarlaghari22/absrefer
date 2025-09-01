import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Shield } from "lucide-react";

const adminLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type AdminLoginForm = z.infer<typeof adminLoginSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<AdminLoginForm>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: AdminLoginForm) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.user.role !== "admin") {
        toast({
          title: "Access denied",
          description: "Admin access required",
          variant: "destructive",
        });
        return;
      }

      authService.setAuth(data);
      toast({
        title: "Admin login successful!",
        description: "Welcome to the admin panel",
      });
      setLocation("/admin-dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AdminLoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" data-testid="admin-login-page">
      <div className="max-w-md w-full space-y-8">
        <Card className="bg-white rounded-2xl shadow-2xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-red-600 text-2xl" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900" data-testid="admin-login-title">Admin Access</h2>
              <p className="text-gray-600 mt-2" data-testid="admin-login-subtitle">Secure admin portal</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="admin-login-form">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter admin email"
                          className="focus:ring-red-500 focus:border-red-500"
                          {...field}
                          data-testid="input-admin-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter admin password"
                          className="focus:ring-red-500 focus:border-red-500"
                          {...field}
                          data-testid="input-admin-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 transform hover:scale-105"
                  disabled={loginMutation.isPending}
                  data-testid="button-admin-login"
                >
                  {loginMutation.isPending ? "Signing In..." : "Admin Login"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <Link href="/" className="text-red-600 hover:text-red-700 font-medium" data-testid="link-back-home">
                Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
