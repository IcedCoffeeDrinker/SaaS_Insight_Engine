import React from 'react';

function UsageGuide() {
  return (
    <div className="space-y-6">
      {/* Main Use Case */}
      <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 rounded-lg shadow-sm p-5 border border-blue-200 hover:shadow-md transition-shadow">
        <div className="flex items-center mb-3">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-xl mr-2">⚡</span>
          <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
            AI-Powered Vibe Coding
          </h3>
        </div>
        <p className="text-gray-600 text-sm mb-4">
          Transform ideas into reality with modern no-code & AI tools:
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="font-mono text-xs bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200 shadow-sm hover:shadow transition-shadow">#ManusAI</span>
          <span className="font-mono text-xs bg-gradient-to-r from-green-100 to-green-200 text-green-700 px-3 py-1.5 rounded-full border border-green-200 shadow-sm hover:shadow transition-shadow">#Glide</span>
          <span className="font-mono text-xs bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 px-3 py-1.5 rounded-full border border-purple-200 shadow-sm hover:shadow transition-shadow">#Pory</span>
          <span className="font-mono text-xs bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 px-3 py-1.5 rounded-full border border-orange-200 shadow-sm hover:shadow transition-shadow">#Bubble</span>
        </div>
        <p className="text-xs text-gray-500 italic">
          Recommended tools for rapid prototyping & deployment
        </p>
      </div>

      {/* Data Sources */}
      <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-lg shadow-sm p-5 border border-emerald-200 hover:shadow-md transition-shadow">
        <div className="flex items-center mb-3">
          <span className="text-emerald-500 mr-2">📊</span>
          <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
            Real-Time Market Data
          </h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-emerald-600 text-xs font-bold">✓</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Live Google Analytics</p>
              <p className="text-xs text-gray-500">Real search volumes & competition metrics</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-emerald-600 text-xs font-bold">✓</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Reddit Integration</p>
              <p className="text-xs text-gray-500">Fresh ideas from r/SaaS, r/technology, r/entrepreneur</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center mb-3">
          <span className="text-indigo-500 mr-2">🚀</span>
          <h3 className="text-lg font-semibold text-gray-900">
            Quick Start Guide
          </h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-indigo-600 text-xs font-bold">1</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Browse validated SaaS ideas</p>
              <p className="text-xs text-gray-500">Market metrics & competition analysis included</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-indigo-600 text-xs font-bold">2</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Select your vibe</p>
              <p className="text-xs text-gray-500">Filter by search volume, competition, or revenue</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-indigo-600 text-xs font-bold">3</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Vibe code with AI</p>
              <p className="text-xs text-gray-500">Generate templates & prototypes in minutes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 rounded-lg shadow-sm p-5 border border-violet-200 hover:shadow-md transition-shadow">
        <div className="flex items-center mb-3">
          <span className="text-violet-500 mr-2">✨</span>
          <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600">
            Coming Soon: AI-Ready Templates
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          We're building AI-optimized templates for each SaaS idea. Perfect for vibe coding with modern AI tools.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="font-mono text-xs bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 px-3 py-1.5 rounded-full border border-violet-200 shadow-sm hover:shadow transition-shadow">#AITemplates</span>
          <span className="font-mono text-xs bg-gradient-to-r from-purple-100 to-fuchsia-100 text-purple-700 px-3 py-1.5 rounded-full border border-purple-200 shadow-sm hover:shadow transition-shadow">#VibeCoding</span>
        </div>
      </div>
    </div>
  );
}

export default UsageGuide; 