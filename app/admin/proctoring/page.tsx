'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  BellIcon,
  CogIcon,
  ArrowDownTrayIcon,
  PlayIcon,
  PauseIcon,
  StopIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ProctoringSession {
  id: string;
  studentName: string;
  examTitle: string;
  startTime: Date;
  status: 'active' | 'paused' | 'completed' | 'flagged';
  suspiciousScore: number;
  events: ProctoringEvent[];
  webcamStatus: boolean;
  microphoneStatus: boolean;
  screenShareStatus: boolean;
}

interface ProctoringEvent {
  id: string;
  type: 'tab_switch' | 'fullscreen_exit' | 'copy_paste' | 'right_click' | 'multiple_windows' | 'suspicious_activity';
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export default function ProctoringPage() {
  const [activeTab, setActiveTab] = useState('monitor');
  const [sessions, setSessions] = useState<ProctoringSession[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProctoringData();
  }, []);

  const fetchProctoringData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/proctoring/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
        setAlerts(data.alerts || []);
      } else {
        console.error('Failed to fetch proctoring data');
        // Fallback to mock data if API fails
        const mockSessions: ProctoringSession[] = [
          {
            id: '1',
            studentName: 'Rahul Sharma',
            examTitle: 'JEE Main Mock Test 1',
            startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
            status: 'active',
            suspiciousScore: 15,
            webcamStatus: true,
            microphoneStatus: true,
            screenShareStatus: false,
            events: [
              {
                id: '1',
                type: 'tab_switch',
                timestamp: new Date(Date.now() - 5 * 60 * 1000),
                severity: 'low',
                description: 'Switched to calculator app'
              }
            ]
          }
        ];
        setSessions(mockSessions);
        setAlerts([]);
      }
    } catch (error) {
      console.error('Error fetching proctoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'flagged':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-yellow-100 text-yellow-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSuspiciousScoreColor = (score: number) => {
    if (score < 30) return 'text-green-600';
    if (score < 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMonitor = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Active Sessions</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {sessions.filter(s => s.status === 'active').length} active
          </span>
          <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sessions.map((session, index) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{session.studentName}</h4>
                <p className="text-sm text-gray-600">{session.examTitle}</p>
                <p className="text-xs text-gray-500">
                  Started: {formatTime(session.startTime)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(session.status)}`}>
                  {session.status}
                </span>
                <span className={`text-sm font-medium ${getSuspiciousScoreColor(session.suspiciousScore)}`}>
                  {session.suspiciousScore}% suspicious
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${session.webcamStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-600">Webcam</span>
              </div>
              <div className="text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${session.microphoneStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-600">Mic</span>
              </div>
              <div className="text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${session.screenShareStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-600">Screen</span>
              </div>
            </div>

            {session.events.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Recent Events</h5>
                <div className="space-y-2">
                  {session.events.slice(0, 3).map((event) => (
                    <div key={event.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                        <span>{event.description}</span>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(event.severity)}`}>
                        {event.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <button className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                <EyeIcon className="h-4 w-4" />
                <span>View Details</span>
              </button>
              <div className="flex items-center space-x-2">
                <button className="p-1 text-gray-600 hover:text-gray-900">
                  <PlayIcon className="h-4 w-4" />
                </button>
                <button className="p-1 text-gray-600 hover:text-gray-900">
                  <PauseIcon className="h-4 w-4" />
                </button>
                <button className="p-1 text-gray-600 hover:text-gray-900">
                  <StopIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Security Alerts</h3>
        <button className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {alerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-sm border p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">{alert.title}</h4>
                  <p className="text-sm text-gray-600">{alert.description}</p>
                  <p className="text-xs text-gray-500">{alert.timestamp}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                {alert.severity}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Proctoring Settings</h3>
      
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Detection Settings</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-900">Tab Switching Detection</h5>
              <p className="text-sm text-gray-600">Alert when students switch browser tabs</p>
            </div>
            <button className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded">
              Enabled
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-900">Full Screen Monitoring</h5>
              <p className="text-sm text-gray-600">Monitor full screen exits</p>
            </div>
            <button className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded">
              Enabled
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-900">Copy-Paste Detection</h5>
              <p className="text-sm text-gray-600">Detect copy-paste activities</p>
            </div>
            <button className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded">
              Enabled
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="h-8 w-8 text-red-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Proctoring Dashboard</h2>
              <p className="text-sm text-gray-600">
                Monitor exam sessions and security alerts in real-time
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'monitor', name: 'Live Monitor', icon: EyeIcon },
            { id: 'alerts', name: 'Security Alerts', icon: BellIcon },
            { id: 'settings', name: 'Settings', icon: CogIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'monitor' && renderMonitor()}
        {activeTab === 'alerts' && renderAlerts()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );
} 