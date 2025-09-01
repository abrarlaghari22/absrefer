import { useState } from "react";
import { Link, useLocation } from "wouter";
import { authService } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = authService.getUser();
  const isAuthenticated = authService.isAuthenticated();
  const isAdmin = authService.isAdmin();

  const handleLogout = () => {
    authService.clearAuth();
    setLocation("/");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-black shadow-lg sticky top-0 z-50" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-white" data-testid="logo">
              <span className="text-green-500">ABS</span> REFERZONE
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {!isAuthenticated ? (
                <>
                  <Link href="/" className="nav-btn text-gray-300 hover:text-green-500 px-3 py-2 rounded-md text-sm font-medium transition duration-150" data-testid="link-home">
                    Home
                  </Link>
                  <Link href="/login" className="nav-btn text-gray-300 hover:text-green-500 px-3 py-2 rounded-md text-sm font-medium transition duration-150" data-testid="link-login">
                    Login
                  </Link>
                  <Link href="/register" className="nav-btn bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded-md text-sm font-medium transition duration-150" data-testid="link-register">
                    Sign Up
                  </Link>
                  <Link href="/admin-login" className="nav-btn text-gray-300 hover:text-green-500 px-3 py-2 rounded-md text-sm font-medium transition duration-150" data-testid="link-admin">
                    Admin
                  </Link>
                </>
              ) : (
                <>
                  {isAdmin ? (
                    <>
                      <Link href="/admin-dashboard" className="nav-btn text-gray-300 hover:text-green-500 px-3 py-2 rounded-md text-sm font-medium transition duration-150" data-testid="link-admin-dashboard">
                        Dashboard
                      </Link>
                      <Button onClick={handleLogout} variant="destructive" size="sm" data-testid="button-logout">
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/dashboard" className="nav-btn text-gray-300 hover:text-green-500 px-3 py-2 rounded-md text-sm font-medium transition duration-150" data-testid="link-dashboard">
                        Dashboard
                      </Link>
                      <Link href="/deposit" className="nav-btn bg-green-500 hover:bg-green-600 text-black px-3 py-2 rounded-md text-sm font-medium transition duration-150" data-testid="link-deposit">
                        Deposit
                      </Link>
                      <Link href="/withdrawal" className="nav-btn bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150" data-testid="link-withdrawal">
                        Withdraw
                      </Link>
                      <Button onClick={handleLogout} variant="destructive" size="sm" data-testid="button-logout">
                        Logout
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="text-gray-300 hover:text-white"
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-900" data-testid="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {!isAuthenticated ? (
              <>
                <Link href="/" className="block text-gray-300 hover:text-green-500 px-3 py-2 rounded-md text-base font-medium w-full text-left" data-testid="mobile-link-home">
                  Home
                </Link>
                <Link href="/login" className="block text-gray-300 hover:text-green-500 px-3 py-2 rounded-md text-base font-medium w-full text-left" data-testid="mobile-link-login">
                  Login
                </Link>
                <Link href="/register" className="block text-gray-300 hover:text-green-500 px-3 py-2 rounded-md text-base font-medium w-full text-left" data-testid="mobile-link-register">
                  Sign Up
                </Link>
                <Link href="/admin-login" className="block text-gray-300 hover:text-green-500 px-3 py-2 rounded-md text-base font-medium w-full text-left" data-testid="mobile-link-admin">
                  Admin
                </Link>
              </>
            ) : (
              <>
                {isAdmin ? (
                  <>
                    <Link href="/admin-dashboard" className="block text-gray-300 hover:text-green-500 px-3 py-2 rounded-md text-base font-medium w-full text-left" data-testid="mobile-link-admin-dashboard">
                      Dashboard
                    </Link>
                    <Button onClick={handleLogout} variant="destructive" className="w-full mt-2" data-testid="mobile-button-logout">
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/dashboard" className="block text-gray-300 hover:text-green-500 px-3 py-2 rounded-md text-base font-medium w-full text-left" data-testid="mobile-link-dashboard">
                      Dashboard
                    </Link>
                    <Link href="/deposit" className="block text-gray-300 hover:text-green-500 px-3 py-2 rounded-md text-base font-medium w-full text-left" data-testid="mobile-link-deposit">
                      Deposit
                    </Link>
                    <Link href="/withdrawal" className="block text-gray-300 hover:text-green-500 px-3 py-2 rounded-md text-base font-medium w-full text-left" data-testid="mobile-link-withdrawal">
                      Withdraw
                    </Link>
                    <Button onClick={handleLogout} variant="destructive" className="w-full mt-2" data-testid="mobile-button-logout">
                      Logout
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
