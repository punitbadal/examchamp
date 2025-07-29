'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrophyIcon,
  MedalIcon,
  StarIcon,
  TrendingUpIcon,
  UserIcon,
  AcademicCapIcon,
  ClockIcon,
  ChartBarIcon,
  EyeIcon,
  FireIcon
} from '@heroicons/react/24/outline';

interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatar?: string;
  score: number;
  maxScore: number;
  percentage: number;
  timeSpent: number; // in minutes
  accuracy: number;
  questionsAttempted: number;
  questionsCorrect: number;
  totalQuestions: number;
  examTitle: string;
  examDate: string;
  isCurrentUser: boolean;
  trend: 'up' | 'down' | 'stable';
  previousRank?: number;
  streak?: number;
  badges: string[];
}

interface LeaderboardProps {
  examId?: string;
  type: 'exam' | 'practice' | 'overall';
  timeFrame: 'all' | 'week' | 'month' | 'year';
  showCurrentUser?: boolean;
  maxEntries?: number;
}

export default function Leaderboard({
  examId,
  type,
  timeFrame,
  showCurrentUser = true,
  maxEntries = 50
}: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [stats, setStats] = useState({
    totalParticipants: 0,
    averageScore: 0,
    topScore: 0,
    yourRank: 0
  });

  useEffect(() => {
    loadLeaderboard();
  }, [examId, type, timeFrame]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      // Mock data - in real app, fetch from API
      const mockLeaderboard: LeaderboardEntry[] = [
        {
          id: '1',
          rank: 1,
          name: 'Rahul Sharma',
          score: 285,
          maxScore: 300,
          percentage: 95,
          timeSpent: 165,
          accuracy: 94.5,
          questionsAttempted: 90,
          questionsCorrect: 85,
          totalQuestions: 90,
          examTitle: 'JEE Main Mock Test 1',
          examDate: '2024-01-15',
          isCurrentUser: false,
          trend: 'up',
          previousRank: 3,
          streak: 5,
          badges: ['gold', 'speed', 'accuracy']
        },
        {
          id: '2',
          rank: 2,
          name: 'Priya Patel',
          score: 278,
          maxScore: 300,
          percentage: 92.7,
          timeSpent: 180,
          accuracy: 92.7,
          questionsAttempted: 90,
          questionsCorrect: 83,
          totalQuestions: 90,
          examTitle: 'JEE Main Mock Test 1',
          examDate: '2024-01-15',
          isCurrentUser: false,
          trend: 'stable',
          previousRank: 2,
          streak: 3,
          badges: ['silver', 'consistency']
        },
        {
          id: '3',
          rank: 3,
          name: 'Amit Kumar',
          score: 272,
          maxScore: 300,
          percentage: 90.7,
          timeSpent: 175,
          accuracy: 90.7,
          questionsAttempted: 90,
          questionsCorrect: 82,
          totalQuestions: 90,
          examTitle: 'JEE Main Mock Test 1',
          examDate: '2024-01-15',
          isCurrentUser: false,
          trend: 'down',
          previousRank: 1,
          streak: 2,
          badges: ['bronze']
        },
        {
          id: '4',
          rank: 4,
          name: 'Neha Singh',
          score: 268,
          maxScore: 300,
          percentage: 89.3,
          timeSpent: 170,
          accuracy: 89.3,
          questionsAttempted: 90,
          questionsCorrect: 80,
          totalQuestions: 90,
          examTitle: 'JEE Main Mock Test 1',
          examDate: '2024-01-15',
          isCurrentUser: true,
          trend: 'up',
          previousRank: 8,
          streak: 4,
          badges: ['improvement']
        },
        {
          id: '5',
          rank: 5,
          name: 'Vikram Malhotra',
          score: 265,
          maxScore: 300,
          percentage: 88.3,
          timeSpent: 185,
          accuracy: 88.3,
          questionsAttempted: 90,
          questionsCorrect: 79,
          totalQuestions: 90,
          examTitle: 'JEE Main Mock Test 1',
          examDate: '2024-01-15',
          isCurrentUser: false,
          trend: 'stable',
          previousRank: 5,
          streak: 1,
          badges: []
        }
      ];

      setLeaderboard(mockLeaderboard);
      setStats({
        totalParticipants: 1250,
        averageScore: 72.5,
        topScore: 95,
        yourRank: 4
      });
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <TrophyIcon className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <MedalIcon className="h-6 w-6 text-gray-400" />;
      case 3:
        return <MedalIcon className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-600">{rank}</span>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingUpIcon className="h-4 w-4 text-red-500 transform rotate-180" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'gold':
        return <TrophyIcon className="h-4 w-4 text-yellow-500" />;
      case 'silver':
        return <MedalIcon className="h-4 w-4 text-gray-400" />;
      case 'bronze':
        return <MedalIcon className="h-4 w-4 text-amber-600" />;
      case 'speed':
        return <ClockIcon className="h-4 w-4 text-blue-500" />;
      case 'accuracy':
        return <ChartBarIcon className="h-4 w-4 text-green-500" />;
      case 'consistency':
        return <StarIcon className="h-4 w-4 text-purple-500" />;
      case 'improvement':
        return <TrendingUpIcon className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TrophyIcon className="h-8 w-8 text-yellow-500" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Leaderboard</h2>
              <p className="text-sm text-gray-600">
                {type === 'exam' ? 'Exam Rankings' : type === 'practice' ? 'Practice Test Rankings' : 'Overall Rankings'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <UserIcon className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{stats.totalParticipants} participants</span>
            </div>
            <div className="flex items-center space-x-2">
              <AcademicCapIcon className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Avg: {stats.averageScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.topScore}%</div>
            <div className="text-sm text-blue-600">Top Score</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.averageScore}%</div>
            <div className="text-sm text-green-600">Average Score</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.totalParticipants}</div>
            <div className="text-sm text-purple-600">Participants</div>
          </div>
          {showCurrentUser && (
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">#{stats.yourRank}</div>
              <div className="text-sm text-orange-600">Your Rank</div>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="divide-y divide-gray-200">
        {loading ? (
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {leaderboard.slice(0, maxEntries).map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  entry.isCurrentUser ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  {/* Rank */}
                  <div className="flex items-center justify-center w-8">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {entry.name}
                        {entry.isCurrentUser && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            You
                          </span>
                        )}
                      </p>
                      {entry.streak && entry.streak > 1 && (
                        <div className="flex items-center space-x-1">
                          <FireIcon className="h-4 w-4 text-orange-500" />
                          <span className="text-xs text-orange-600 font-medium">{entry.streak}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{entry.examTitle}</p>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getPercentageColor(entry.percentage)}`}>
                      {entry.percentage}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {entry.score}/{entry.maxScore} pts
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:block text-right">
                    <div className="text-sm text-gray-900">{formatTime(entry.timeSpent)}</div>
                    <div className="text-xs text-gray-500">{entry.accuracy.toFixed(1)}% accuracy</div>
                  </div>

                  {/* Trend */}
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(entry.trend)}
                    {entry.previousRank && entry.previousRank !== entry.rank && (
                      <span className="text-xs text-gray-500">
                        {entry.previousRank > entry.rank ? '+' : ''}{entry.previousRank - entry.rank}
                      </span>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex items-center space-x-1">
                    {entry.badges.map((badge, badgeIndex) => (
                      <div key={badgeIndex} className="tooltip" title={badge}>
                        {getBadgeIcon(badge)}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      {!loading && leaderboard.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Showing top {Math.min(maxEntries, leaderboard.length)} participants</span>
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              View Full Leaderboard
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && leaderboard.length === 0 && (
        <div className="p-8 text-center">
          <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No rankings yet</h3>
          <p className="text-gray-600">Complete exams to see your ranking on the leaderboard.</p>
        </div>
      )}
    </div>
  );
} 