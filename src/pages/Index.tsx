
import React, { useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useDevMode } from "@/hooks/useDevMode";
import { RefreshCw } from "lucide-react";

const Index = () => {
  const { session } = useAuth();
  const { isAuthBypassed } = useDevMode();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthBypassed) {
      console.log("[INDEX_PAGE] Auth is bypassed in dev mode. Redirecting to dashboard.");
      navigate('/dashboard');
    }
  }, [isAuthBypassed, navigate]);

  if (isAuthBypassed) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-900">
        <RefreshCw className="h-6 w-6 animate-spin text-white mr-3" />
        <p className="text-white">Dev mode active, redirecting to dashboard...</p>
      </div>
    );
  }
  
  return (
    <MainLayout>
      <div className="py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            YodelMobile ASO Tool
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Optimize your app's visibility and increase downloads with our powerful App Store Optimization platform.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">App Analytics</CardTitle>
              <CardDescription className="text-zinc-400">
                Track your app's performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300">
                Monitor downloads, visibility, and user engagement with comprehensive analytics dashboards.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                asChild
              >
                <Link to={session ? "/dashboard" : "/auth/sign-in"}>
                  View Analytics
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Keyword Research</CardTitle>
              <CardDescription className="text-zinc-400">
                Find the best keywords for your app
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300">
                Discover high-performing keywords to increase your app's visibility in the app stores.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                asChild
              >
                <Link to={session ? "/dashboard" : "/auth/sign-in"}>
                  Research Keywords
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Competitor Analysis</CardTitle>
              <CardDescription className="text-zinc-400">
                Stay ahead of your competition
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300">
                Track competitor rankings, keywords, and strategies to optimize your market position.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                asChild
              >
                <Link to={session ? "/traffic-sources" : "/auth/sign-in"}>
                  Analyze Competitors
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="text-center">
          {session ? (
            <Button asChild>
              <Link to="/dashboard" className="bg-white text-zinc-900 hover:bg-zinc-200">
                Go to Dashboard
              </Link>
            </Button>
          ) : (
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild>
                <Link to="/auth/sign-in" className="bg-white text-zinc-900 hover:bg-zinc-200">
                  Sign In
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/auth/sign-up" className="border-white text-white hover:bg-zinc-800">
                  Create Account
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
