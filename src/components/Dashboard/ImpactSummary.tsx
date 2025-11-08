import React from 'react';
import { Target, Calendar, Clock, Award, TrendingUp } from 'lucide-react';

interface ImpactSummaryProps {
  stats: {
    projectsJoined: number;
    eventsAttended: number;
    hoursVolunteered: number;
    impactScore: number;
  };
  themeColor?: string;
}

const ImpactSummary: React.FC<ImpactSummaryProps> = ({ stats, themeColor = '#FF6B35' }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-logo-navy/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-logo-navy flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: themeColor }} />
          Your Impact Summary
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: `${themeColor}20` }}
          >
            <Target className="w-6 h-6" style={{ color: themeColor }} />
          </div>
          <div className="text-2xl font-bold text-logo-navy">{stats.projectsJoined}</div>
          <div className="text-sm text-gray-600">Projects</div>
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: `${themeColor}20` }}
          >
            <Calendar className="w-6 h-6" style={{ color: themeColor }} />
          </div>
          <div className="text-2xl font-bold text-logo-navy">{stats.eventsAttended}</div>
          <div className="text-sm text-gray-600">Events</div>
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: `${themeColor}20` }}
          >
            <Clock className="w-6 h-6" style={{ color: themeColor }} />
          </div>
          <div className="text-2xl font-bold text-logo-navy">{stats.hoursVolunteered}</div>
          <div className="text-sm text-gray-600">Hours</div>
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: `${themeColor}20` }}
          >
            <Award className="w-6 h-6" style={{ color: themeColor }} />
          </div>
          <div className="text-2xl font-bold text-logo-navy">{stats.impactScore}</div>
          <div className="text-sm text-gray-600">Impact Score</div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl">
        <p className="text-sm text-gray-700 text-center">
          🎉 You're making a difference! Keep up the great work!
        </p>
      </div>
    </div>
  );
};

export default ImpactSummary;
