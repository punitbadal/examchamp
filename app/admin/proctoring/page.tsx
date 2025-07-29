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
      // Mock data - in real app, fetch from API
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
        },
        {
          id: '2',
          studentName: 'Priya Patel',
          examTitle: 'NEET Practice Test',
          startTime: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
          status: 'flagged',
          suspiciousScore: 75,
          webcamStatus: true,
          microphoneStatus: false,
          screenShareStatus: true,
          events: [
            {
              id: '2',
              type: 'suspicious_activity',
              timestamp: new Date(Date.now() - 10 * 60 * 1000),
              severity: 'high',
              description: 'Multiple browser windows detected'
            },
            {
              id: '3',
              type: 'copy_paste',
              timestamp: new Date(Date.now() - 8 * 60 * 1000),
              severity: 'medium',
              description: 'Copy-paste activity detected'
            }
          ]
        },
        {
          id: '3',
          studentName: 'Amit Kumar',
          examTitle: 'GATE Computer Science',
          startTime: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
          status: 'active',
          suspiciousScore: 5,
          webcamStatus: true,
          microphoneStatus: true,
          screenShareStatus: false,
          events: []
        }
      ];

      const mockAlerts = [
        {
          id: '1',
          type: 'high_risk',
          message: 'High suspicious activity detected in session #2',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          sessionId: '2'
        },
        {
          id: '2',
          type: 'medium_risk',
          message: 'Multiple tab switches detected in session #1',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          sessionId: '1'
        }
      ];

      setSessions(mockSessions);
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Error fetching proctoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'flagged': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSuspiciousScoreColor = (score: number) => {
    if (score > 50) return 'text-red-600';
    if (score > 20) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMonitor = () => (
    <div className="space-y-6">
      {/* Live Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Sessions</h3>
          <div className="space-y-4">
            {sessions.filter(s => s.status === 'active').map((session) => (
              <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">{session.studentName}</p>
                    <p className="text-sm text-gray-600">{session.examTitle}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                    <button className="text-blue-600 hover:text-blue-900">
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Started</p>
                    <p className="font-medium">{formatTime(session.startTime)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Suspicious Score</p>
                    <p className={`font-medium ${getSuspiciousScoreColor(session.suspiciousScore)}`}>
                      {session.suspiciousScore}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mt-3 text-xs">
                  <div className={`flex items-center space-x-1 ${session.webcamStatus ? 'text-green-600' : 'text-red-600'}`}>
                    <div className={`w-2 h-2 rounded-full ${session.webcamStatus ? 'bg-green-600' : 'bg-red-600'}`}></div>
                    <span>Webcam</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${session.microphoneStatus ? 'text-green-600' : 'text-red-600'}`}>
                    <div className={`w-2 h-2 rounded-full ${session.microphoneStatus ? 'bg-green-600' : 'bg-red-600'}`}></div>
                    <span>Mic</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${session.screenShareStatus ? 'text-yellow-600' : 'text-green-600'}`}>
                    <div className={`w-2 h-2 rounded-full ${session.screenShareStatus ? 'bg-yellow-600' : 'bg-green-600'}`}></div>
                    <span>Screen</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Flagged Sessions</h3>
          <div className="space-y-4">
            {sessions.filter(s => s.status === 'flagged').map((session) => (
              <div key={session.id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">{session.studentName}</p>
                    <p className="text-sm text-gray-600">{session.examTitle}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                    <span className="px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-100">
                      Flagged
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Suspicious Score</span>
                    <span className="text-sm font-bold text-red-600">{session.suspiciousScore}</span>
                  </div>
                  <div className="space-y-1">
                    {session.events.filter(e => e.severity === 'high').map((event) => (
                      <div key={event.id} className="text-xs text-red-700 bg-red-100 p-2 rounded">
                        {event.description}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-3">
                  <button className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">
                    Terminate
                  </button>
                  <button className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700">
                    Warn
                  </button>
                  <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                    Monitor
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Session Events */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Events</h3>
        <div className="space-y-3">
          {sessions.flatMap(s => s.events).slice(0, 10).map((event) => (
            <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${getSeverityColor(event.severity).split(' ')[1]}`}>
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{event.description}</p>
                  <p className="text-sm text-gray-600">{formatTime(event.timestamp)}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                {event.severity}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Security Alerts</h2>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <BellIcon className="w-4 h-4" />
          <span>Mark All Read</span>
        </button>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <div key={alert.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${
                  alert.type === 'high_risk' ? 'bg-red-100' : 'bg-yellow-100'
                }`}>
                  <ExclamationTriangleIcon className={`w-5 h-5 ${
                    alert.type === 'high_risk' ? 'text-red-600' : 'text-yellow-600'
                  }`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{alert.message}</p>
                  <p className="text-sm text-gray-600">{formatTime(alert.timestamp)}</p>
                  <p className="text-xs text-gray-500">Session ID: {alert.sessionId}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="text-blue-600 hover:text-blue-900">
                  <EyeIcon className="w-4 h-4" />
                </button>
                <button className="text-green-600 hover:text-green-900">
                  <CheckCircleIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Proctoring Rules</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Webcam Required</p>
                <p className="text-sm text-gray-600">Students must enable webcam during exams</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Microphone Monitoring</p>
                <p className="text-sm text-gray-600">Monitor audio for suspicious activity</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Browser Lockdown</p>
                <p className="text-sm text-gray-600">Prevent switching to other applications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">AI Proctoring</p>
                <p className="text-sm text-gray-600">Use AI to detect suspicious behavior</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Thresholds</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                High Risk Threshold
              </label>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="70"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>70</span>
                <span>100</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medium Risk Threshold
              </label>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="40"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>40</span>
                <span>100</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto-Terminate Threshold
              </label>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="90"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>90</span>
                <span>100</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Proctoring Monitor</span>
            </div>
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              ← Back to Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'monitor', name: 'Proctoring Monitor', icon: EyeIcon },
              { id: 'alerts', name: 'Security Alerts', icon: BellIcon },
              { id: 'settings', name: 'Security Settings', icon: CogIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'monitor' && renderMonitor()}
        {activeTab === 'alerts' && renderAlerts()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );
} 