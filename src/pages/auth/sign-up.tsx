
import React from 'react';
import { SignUpForm } from '@/components/Auth/SignUpForm';

const SignUpPage: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-900 p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">YodelMobile ASO Tool</h1>
        <p className="text-zinc-400">Create a new account</p>
      </div>
      <SignUpForm />
    </div>
  );
};

export default SignUpPage;
