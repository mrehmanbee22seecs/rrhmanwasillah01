import React from 'react';
import { Clock, Calendar, Bell } from 'lucide-react';
import ReminderForm from '../components/ReminderForm';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Reminders = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Redirect to home if not authenticated
  React.useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen app-bg py-20">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-4 bg-gradient-to-br from-pink-500 to-cyan-500 rounded-2xl">
              <Bell className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-pink-500 to-cyan-500 bg-clip-text text-transparent">
            Set a Reminder
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Never miss an important date for your projects and events. 
            Create personalized reminders and we'll notify you at the perfect time.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-300">
            <div className="p-3 bg-blue-100 rounded-xl w-fit mx-auto mb-4">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Custom Time</h3>
            <p className="text-gray-600 text-sm">
              Choose exactly when you want to be reminded - down to the minute
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-300">
            <div className="p-3 bg-purple-100 rounded-xl w-fit mx-auto mb-4">
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Future Scheduling</h3>
            <p className="text-gray-600 text-sm">
              Schedule reminders days, weeks, or months in advance
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-300">
            <div className="p-3 bg-green-100 rounded-xl w-fit mx-auto mb-4">
              <Bell className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Email Notification</h3>
            <p className="text-gray-600 text-sm">
              Receive a detailed email at your scheduled time
            </p>
          </div>
        </div>

        {/* Reminder Form */}
        <ReminderForm />

        {/* How It Works */}
        <div className="mt-16 bg-gradient-to-r from-pink-50 to-cyan-50 rounded-3xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                1
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Fill the Form</h3>
              <p className="text-sm text-gray-600">
                Enter your details and the reminder message
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                2
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Choose Date & Time</h3>
              <p className="text-sm text-gray-600">
                Select when you want to receive the reminder
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                3
              </div>
              <h3 className="font-bold text-gray-900 mb-2">We Schedule It</h3>
              <p className="text-sm text-gray-600">
                Your reminder is safely stored and scheduled
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                4
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Get Notified</h3>
              <p className="text-sm text-gray-600">
                Receive an email at your scheduled time
              </p>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Perfect For
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-pink-500">
              <h3 className="font-bold text-gray-900 mb-2">Project Deadlines</h3>
              <p className="text-sm text-gray-600">
                Get reminded before important project milestones and deadlines
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
              <h3 className="font-bold text-gray-900 mb-2">Event Preparation</h3>
              <p className="text-sm text-gray-600">
                Remember to prepare materials and supplies before events
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
              <h3 className="font-bold text-gray-900 mb-2">Follow-ups</h3>
              <p className="text-sm text-gray-600">
                Don't forget to follow up with team members or volunteers
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
              <h3 className="font-bold text-gray-900 mb-2">Meeting Times</h3>
              <p className="text-sm text-gray-600">
                Get notified before important meetings and calls
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
              <h3 className="font-bold text-gray-900 mb-2">Task Reminders</h3>
              <p className="text-sm text-gray-600">
                Remember specific tasks that need to be done
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-cyan-500">
              <h3 className="font-bold text-gray-900 mb-2">Custom Alerts</h3>
              <p className="text-sm text-gray-600">
                Any custom reminder you need for your projects
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reminders;
