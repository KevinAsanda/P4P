'use client';

import { useState, useTransition } from 'react';
import { login, signup } from '@/app/auth-actions';
import { LogIn, UserPlus } from 'lucide-react';

interface AuthViewProps {
  redirectTo?: string;
}

export default function AuthView({ redirectTo = '/' }: AuthViewProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      let result;
      if (activeTab === 'login') {
        result = await login(null, formData);
      } else {
        result = await signup(null, formData);
      }

      if (result && result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button
          type="button"
          onClick={() => {
            setActiveTab('login');
            setError(null);
          }}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'login'
              ? 'border-papaya text-jetblack bg-white'
              : 'border-transparent text-gray-400 bg-gray-50 hover:bg-gray-100/50'
          }`}
        >
          <LogIn className="h-4 w-4" />
          Log In
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('signup');
            setError(null);
          }}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'signup'
              ? 'border-papaya text-jetblack bg-white'
              : 'border-transparent text-gray-400 bg-gray-50 hover:bg-gray-100/50'
          }`}
        >
          <UserPlus className="h-4 w-4" />
          Create Account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Error message */}
        {error && (
          <div className="rounded-lg bg-vermillion/10 border border-vermillion/20 p-3 text-xs font-bold text-vermillion">
            {error}
          </div>
        )}

        <input type="hidden" name="redirectTo" value={redirectTo} />

        {/* First & Last Name fields (Sign Up only) */}
        {activeTab === 'signup' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="firstName" className="block text-sm font-semibold text-gray-600">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="lastName" className="block text-sm font-semibold text-gray-600">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Email Address */}
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-semibold text-gray-600">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
          />
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-semibold text-gray-600">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            minLength={6}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-jetblack py-3 px-4 text-sm font-black text-white hover:bg-caramel hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Processing...' : activeTab === 'login' ? 'Log In' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}
