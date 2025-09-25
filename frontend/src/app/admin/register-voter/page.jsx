"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import ApiService from '@/utils/api';
import Web3 from 'web3';
import toast from 'react-hot-toast';

export default function RegisterVoter() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    walletAddress: '',
    privateKey: ''
  });
  const [loading, setLoading] = useState(false);
  const [registeredVoter, setRegisteredVoter] = useState(null);
  const router = useRouter();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const generateRandomWallet = () => {
    // For development, connect to Ganache to generate account
    const web3 = new Web3('http://127.0.0.1:7545');
    const account = web3.eth.accounts.create();
    setFormData({
      ...formData,
      walletAddress: account.address,
      privateKey: account.privateKey
    });
    toast.success('Random wallet generated with private key');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await ApiService.registerVoter(formData);
      
      setRegisteredVoter(result.voter);
      toast.success(result.message);
      
      // Reset form
      setFormData({
        email: '',
        password: '',
        walletAddress: '',
        privateKey: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to register voter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Register Voter">
      <div className="max-w-2xl mx-auto">
        {registeredVoter && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Voter Registered Successfully!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p><strong>Email:</strong> {registeredVoter.email}</p>
                  <p><strong>Voter ID:</strong> {registeredVoter.voterId}</p>
                  <p><strong>Wallet Address:</strong> {registeredVoter.walletAddress}</p>
                  {formData.privateKey && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-yellow-800 font-medium">⚠️ Private Key (Keep Secure!):</p>
                      <p className="text-yellow-700 font-mono text-xs break-all">{formData.privateKey}</p>
                    </div>
                  )}
                  <p className="mt-2 text-xs">
                    Please share the Voter ID, password, and private key with the voter securely.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
              Register New Voter
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="voter@example.com"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  The voter will use this email for identification.
                </p>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    name="password"
                    id="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Minimum 6 characters"
                    minLength="6"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Share this password securely with the voter.
                </p>
              </div>

              <div>
                <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700">
                  Ethereum Wallet Address *
                </label>
                <div className="mt-1 flex">
                  <input
                    type="text"
                    name="walletAddress"
                    id="walletAddress"
                    required
                    value={formData.walletAddress}
                    onChange={handleInputChange}
                    placeholder="0x..."
                    pattern="^0x[a-fA-F0-9]{40}$"
                    className="flex-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-l-md text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={generateRandomWallet}
                    className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    Generate
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Enter the voter's wallet address or generate a random one with private key.
                </p>
              </div>

              <div>
                <label htmlFor="privateKey" className="block text-sm font-medium text-gray-700">
                  Private Key
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="privateKey"
                    id="privateKey"
                    readOnly
                    value={formData.privateKey}
                    placeholder="Click 'Generate' to create a wallet with private key"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900 bg-gray-50"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Private key for the wallet (auto-generated when using 'Generate' button).
                </p>
              </div>

              <div className="pt-5">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => router.push('/admin')}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Registering...' : 'Register Voter'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}