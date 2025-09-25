"use client";

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ApiService from '@/utils/api';
import Web3Service from '@/utils/web3';
import toast from 'react-hot-toast';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function Vote() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votingStates, setVotingStates] = useState({});
  const [connectedWallet, setConnectedWallet] = useState(null);

  useEffect(() => {
    loadActivePolls();
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      const account = await Web3Service.getAccount();
      setConnectedWallet(account);
    } catch (error) {
      console.error('Wallet connection check failed:', error);
    }
  };

  const loadActivePolls = async () => {
    try {
      const result = await ApiService.getActivePolls();
      setPolls(result.polls);
    } catch (error) {
      toast.error('Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId, selectedOption) => {
    if (!connectedWallet) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Get private key from user (in production, this should be handled more securely)
    const privateKey = prompt('Enter your wallet private key to vote:');
    if (!privateKey) {
      return;
    }

    setVotingStates(prev => ({
      ...prev,
      [pollId]: { voting: true, selectedOption }
    }));

    try {
      const result = await ApiService.submitVote({
        pollId,
        selectedOption,
        voterPrivateKey: privateKey
      });

      toast.success('Vote submitted successfully!');
      
      // Update poll status
      setPolls(prev => 
        prev.map(poll => 
          poll.id === pollId 
            ? { ...poll, hasVoted: true }
            : poll
        )
      );

      setVotingStates(prev => ({
        ...prev,
        [pollId]: { 
          voted: true, 
          selectedOption, 
          transactionHash: result.transactionHash 
        }
      }));

    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit vote');
      setVotingStates(prev => ({
        ...prev,
        [pollId]: { error: true }
      }));
    }
  };

  const connectWallet = async () => {
    try {
      const account = await Web3Service.connectWallet();
      setConnectedWallet(account);
      toast.success('Wallet connected successfully');
    } catch (error) {
      toast.error('Failed to connect wallet');
    }
  };

  const formatTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  if (loading) {
    return (
      <Layout title="Vote">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading active polls...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Cast Your Vote">
      {/* Wallet Connection Status */}
      <div className="mb-6">
        {connectedWallet ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">
                  Wallet connected: <span className="font-mono">{connectedWallet.substring(0, 10)}...{connectedWallet.substring(connectedWallet.length - 8)}</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ClockIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3 flex-1 md:flex md:justify-between">
                <p className="text-sm text-yellow-800">
                  Connect your wallet to participate in voting.
                </p>
                <p className="mt-3 text-sm md:mt-0 md:ml-6">
                  <button
                    onClick={connectWallet}
                    className="whitespace-nowrap font-medium text-yellow-800 hover:text-yellow-600"
                  >
                    Connect Wallet
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Polls */}
      {polls.length === 0 ? (
        <div className="text-center">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                No Active Polls
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                There are currently no active polls available for voting.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onVote={handleVote}
              votingState={votingStates[poll.id]}
              connectedWallet={connectedWallet}
              formatTimeRemaining={formatTimeRemaining}
            />
          ))}
        </div>
      )}
    </Layout>
  );
}

function PollCard({ poll, onVote, votingState, connectedWallet, formatTimeRemaining }) {
  const [selectedOption, setSelectedOption] = useState('');

  const handleSubmitVote = () => {
    if (!selectedOption) {
      toast.error('Please select an option');
      return;
    }
    onVote(poll.id, selectedOption);
  };

  const isVoting = votingState?.voting;
  const hasVoted = poll.hasVoted || votingState?.voted;
  const votingError = votingState?.error;

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {poll.title}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {poll.description}
            </p>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
              {formatTimeRemaining(poll.endTime)}
            </div>
          </div>
          
          {hasVoted && (
            <div className="flex-shrink-0 ml-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Voted
              </span>
            </div>
          )}
        </div>

        {hasVoted ? (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              You have successfully voted in this poll.
              {votingState?.selectedOption && (
                <span className="font-medium"> Your choice: {votingState.selectedOption}</span>
              )}
            </p>
            {votingState?.transactionHash && (
              <p className="text-xs text-gray-500 mt-1 font-mono">
                Transaction: {votingState.transactionHash}
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              {poll.options.map((option, index) => (
                <label key={index} className="flex items-center">
                  <input
                    type="radio"
                    name={`poll-${poll.id}`}
                    value={option}
                    checked={selectedOption === option}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    disabled={isVoting || !connectedWallet}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 disabled:opacity-50"
                  />
                  <span className="ml-3 text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>

            {votingError && (
              <div className="text-sm text-red-600">
                Failed to submit vote. Please try again.
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleSubmitVote}
                disabled={isVoting || !connectedWallet || !selectedOption}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVoting ? 'Submitting Vote...' : 'Submit Vote'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    );
}