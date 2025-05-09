
import React from "react";
import MainLayout from "../layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { session } = useAuth();
  
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
                as={Link}
                to={session ? "/dashboard" : "/auth/sign-in"}
              >
                View Analytics
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
                as={Link}
                to={session ? "/dashboard" : "/auth/sign-in"}
              >
                Research Keywords
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
                as={Link}
                to={session ? "/traffic-sources" : "/auth/sign-in"}
              >
                Analyze Competitors
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="text-center">
          {session ? (
            <Link to="/dashboard">
              <Button className="bg-white text-zinc-900 hover:bg-zinc-200">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/auth/sign-in">
                <Button className="bg-white text-zinc-900 hover:bg-zinc-200">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth/sign-up">
                <Button variant="outline" className="border-white text-white hover:bg-zinc-800">
                  Create Account
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
