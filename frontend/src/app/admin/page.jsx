"use client";

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ApiService from '@/utils/api';
import Link from 'next/link';
import { ChartBarIcon, UserGroupIcon, PlusIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPolls: 0,
    activePolls: 0,
    totalVotes: 0
  });

  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    try {
      const result = await ApiService.getAdminPolls();
      setPolls(result.polls);
      
      // Calculate stats
      const activePolls = result.polls.filter(poll => {
        const now = new Date();
        const endTime = new Date(poll.createdAt);
        endTime.setHours(endTime.getHours() + 24); // Assuming 24h duration for demo
        return now < endTime;
      });

      const totalVotes = result.polls.reduce((sum, poll) => sum + poll._count.votes, 0);

      setStats({
        totalPolls: result.polls.length,
        activePolls: activePolls.length,
        totalVotes
      });
    } catch (error) {
      console.error('Failed to load polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      name: 'Total Polls',
      value: stats.totalPolls,
      icon: ChartBarIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Active Polls',
      value: stats.activePolls,
      icon: ClipboardDocumentListIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Total Votes',
      value: stats.totalVotes,
      icon: UserGroupIcon,
      color: 'bg-purple-500'
    }
  ];

  const quickActions = [
    {
      name: 'Create New Poll',
      href: '/admin/create-poll',
      icon: PlusIcon,
      description: 'Set up a new voting poll'
    },
    {
      name: 'Register Voter',
      href: '/admin/register-voter',
      icon: UserGroupIcon,
      description: 'Add a new voter to the system'
    },
    {
      name: 'View Results',
      href: '/admin/results',
      icon: ChartBarIcon,
      description: 'Check poll results and analytics'
    }
  ];

  if (loading) {
    return (
      <Layout title="Admin Dashboard">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Dashboard">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
        {statsCards.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${stat.color} p-3 rounded-md`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.name} href={action.href}>
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <action.icon className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        {action.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Polls */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Polls</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {polls.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No polls created yet.</p>
              <Link
                href="/admin/create-poll"
                className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                Create your first poll
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {polls.slice(0, 5).map((poll) => (
                <li key={poll.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-indigo-600 truncate">
                          {poll.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {poll.description}
                        </p>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <span>Poll ID: {poll.pollId}</span>
                          <span className="mx-2">•</span>
                          <span>{poll._count.votes} votes</span>
                          <span className="mx-2">•</span>
                          <span>Created {new Date(poll.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex space-x-2">
                        <Link
                          href={`/admin/results?pollId=${poll.pollId}`}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          View Results
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}