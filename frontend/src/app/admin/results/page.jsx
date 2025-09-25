"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import ApiService from '@/utils/api';
import toast from 'react-hot-toast';
import { ChartBarIcon } from '@heroicons/react/24/outline';

export default function PollResults() {
  const [polls, setPolls] = useState([]);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pollId = searchParams.get('pollId');

  useEffect(() => {
    loadPolls();
  }, []);

  useEffect(() => {
    if (pollId && polls.length > 0) {
      const poll = polls.find(p => p.pollId === parseInt(pollId));
      if (poll) {
        setSelectedPoll(poll.pollId);
        loadPollResults(poll.pollId);
      }
    }
  }, [pollId, polls]);

  const loadPolls = async () => {
    try {
      const result = await ApiService.getAdminPolls();
      setPolls(result.polls);
    } catch (error) {
      toast.error('Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  const loadPollResults = async (pollId) => {
    setLoadingResults(true);
    try {
      const result = await ApiService.getPollResults(pollId);
      setResults(result);
    } catch (error) {
      toast.error('Failed to load poll results');
      setResults(null);
    } finally {
      setLoadingResults(false);
    }
  };

  const handlePollSelect = (pollId) => {
    setSelectedPoll(pollId);
    setResults(null);
    loadPollResults(pollId);
  };

  const calculatePercentage = (votes, total) => {
    return total > 0 ? ((votes / total) * 100).toFixed(1) : 0;
  };

  const getBarWidth = (votes, maxVotes) => {
    return maxVotes > 0 ? (votes / maxVotes) * 100 : 0;
  };

  if (loading) {
    return (
      <Layout title="Poll Results">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading polls...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Poll Results">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Poll Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Select Poll
              </h3>
              {polls.length === 0 ? (
                <p className="text-gray-500">No polls available.</p>
              ) : (
                <div className="space-y-2">
                  {polls.map((poll) => (
                    <button
                      key={poll.id}
                      onClick={() => handlePollSelect(poll.pollId)}
                      className={`w-full text-left p-3 rounded-lg border ${
                        selectedPoll === poll.pollId
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-sm text-gray-900">
                        {poll.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Poll ID: {poll.pollId} • {poll._count.votes} votes
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Display */}
        <div className="lg:col-span-2">
          {!selectedPoll ? (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6 text-center">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No Poll Selected
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select a poll from the left to view its results.
                </p>
              </div>
            </div>
          ) : loadingResults ? (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading results...</p>
              </div>
            </div>
          ) : results ? (
            <div className="space-y-6">
              {/* Poll Information */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                    {results.poll.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {results.poll.description}
                  </p>
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Total Votes:</span> {results.totalVotes}
                  </div>
                </div>
              </div>

              {/* Results Chart */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Vote Distribution
                  </h4>
                  {results.totalVotes === 0 ? (
                    <p className="text-gray-500">No votes have been cast yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(results.results).map(([option, votes]) => {
                        const percentage = calculatePercentage(votes, results.totalVotes);
                        const maxVotes = Math.max(...Object.values(results.results));
                        const barWidth = getBarWidth(votes, maxVotes);
                        
                        return (
                          <div key={option} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-700">
                                {option}
                              </span>
                              <span className="text-sm text-gray-500">
                                {votes} votes ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                                                              style={{ width: `${barWidth}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Vote Details */}
              {results.votes && results.votes.length > 0 && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">
                      Vote Details
                    </h4>
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Voter Address
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Selected Option
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Timestamp
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {results.votes.map((vote, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className="font-mono">
                                  {vote.voter.substring(0, 10)}...{vote.voter.substring(vote.voter.length - 8)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {vote.verified ? vote.selectedOption : 'Encrypted'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {vote.verified ? new Date(vote.timestamp).toLocaleString() : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {vote.verified ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Verified
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Error
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6 text-center">
                <p className="text-gray-500">Failed to load poll results.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}