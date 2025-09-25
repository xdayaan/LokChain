"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '../components/Layout';

export default function Home() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
        
        // Redirect based on user type
        if (payload.isAdmin) {
          router.push('/admin');
        } else {
          router.push('/vote');
        }
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
  }, [router]);

    if (user) {
    return (
      <Layout>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Welcome to Blockchain Voting System">
      <div className="text-center">
        <div className="mx-auto max-w-md">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Secure, Transparent, Tamper-proof Voting
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Experience the future of voting with blockchain technology. 
                Every vote is encrypted, verified, and permanently recorded.
              </p>
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Login to Vote
                </Link>
                <Link
                  href="/admin/register"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Admin Setup
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}