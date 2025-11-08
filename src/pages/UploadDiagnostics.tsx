import React, { useState } from 'react';
import { Activity, RefreshCw, CheckCircle, AlertCircle, AlertTriangle, Play } from 'lucide-react';
import { runUploadDiagnostics, testUpload, displayDiagnostics, DiagnosticResult, UploadDiagnostics as DiagnosticsType } from '../utils/uploadDiagnostics';

const UploadDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsType | null>(null);
  const [testResult, setTestResult] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    setTestResult(null);
    try {
      const results = await runUploadDiagnostics();
      setDiagnostics(results);
      displayDiagnostics(results);
    } catch (error) {
      console.error('Error running diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  const runTest = async () => {
    setTesting(true);
    try {
      const result = await testUpload();
      setTestResult(result);
    } catch (error) {
      console.error('Error running test:', error);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'fail':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return 'bg-green-50 border-green-200';
      case 'fail':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  const getOverallStatusColor = (status: 'healthy' | 'issues' | 'critical') => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'issues':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-8 h-8 text-vibrant-orange" />
            <h1 className="text-4xl font-luxury-display text-black">Upload Diagnostics</h1>
          </div>
          <p className="text-xl text-black font-luxury-body">
            Diagnose and troubleshoot image upload issues, including the common "stall at 30%" problem.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="luxury-card bg-cream-white p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="btn-luxury-primary py-3 px-6 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Running Diagnostics...
                </>
              ) : (
                <>
                  <Activity className="w-5 h-5" />
                  Run Diagnostics
                </>
              )}
            </button>

            <button
              onClick={runTest}
              disabled={testing || !diagnostics}
              className="border-2 border-vibrant-orange text-vibrant-orange py-3 px-6 rounded-luxury font-luxury-semibold hover:bg-vibrant-orange/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Testing Upload...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Test Upload
                </>
              )}
            </button>
          </div>
        </div>

        {/* Overall Status */}
        {diagnostics && (
          <div className={`luxury-card p-6 mb-8 border-2 ${getOverallStatusColor(diagnostics.overallStatus)}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-luxury-heading mb-2">
                  Overall Status: {diagnostics.overallStatus.toUpperCase()}
                </h2>
                <p className="font-luxury-body">
                  {diagnostics.overallStatus === 'healthy' && 'All systems operational. Uploads should work normally.'}
                  {diagnostics.overallStatus === 'issues' && 'Some issues detected. Uploads may be affected.'}
                  {diagnostics.overallStatus === 'critical' && 'Critical issues detected. Uploads likely to fail.'}
                </p>
              </div>
              <div className="text-4xl">
                {diagnostics.overallStatus === 'healthy' && '✅'}
                {diagnostics.overallStatus === 'issues' && '⚠️'}
                {diagnostics.overallStatus === 'critical' && '❌'}
              </div>
            </div>
            <div className="mt-4 text-sm font-luxury-body opacity-70">
              Tested at: {new Date(diagnostics.timestamp).toLocaleString()}
            </div>
          </div>
        )}

        {/* Test Results */}
        {diagnostics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {diagnostics.results.map((result, index) => (
              <div
                key={index}
                className={`luxury-card p-6 border-2 ${getStatusColor(result.status)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(result.status)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-luxury-heading text-black mb-2">
                      {result.category}
                    </h3>
                    <p className="font-luxury-body text-black mb-3">
                      {result.message}
                    </p>
                    {result.details && (
                      <details className="text-sm">
                        <summary className="cursor-pointer font-luxury-semibold text-black hover:text-vibrant-orange">
                          View Details
                        </summary>
                        <pre className="mt-2 p-3 bg-white/50 rounded-lg overflow-x-auto font-mono text-xs">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Test Result */}
        {testResult && (
          <div className={`luxury-card p-6 mb-8 border-2 ${getStatusColor(testResult.status)}`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(testResult.status)}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-luxury-heading text-black mb-2">
                  Upload Test Result
                </h3>
                <p className="font-luxury-body text-black mb-3">
                  {testResult.message}
                </p>
                {testResult.details && (
                  <pre className="p-3 bg-white/50 rounded-lg overflow-x-auto font-mono text-xs">
                    {JSON.stringify(testResult.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {diagnostics && diagnostics.recommendations.length > 0 && (
          <div className="luxury-card bg-cream-white p-6 mb-8">
            <h2 className="text-2xl font-luxury-heading text-black mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-vibrant-orange" />
              Recommendations
            </h2>
            <ul className="space-y-3">
              {diagnostics.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-vibrant-orange text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="font-luxury-body text-black">
                    {rec}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Instructions */}
        {!diagnostics && (
          <div className="luxury-card bg-cream-white p-8 text-center">
            <Activity className="w-16 h-16 text-vibrant-orange mx-auto mb-4" />
            <h2 className="text-2xl font-luxury-heading text-black mb-4">
              Ready to Diagnose Upload Issues
            </h2>
            <p className="font-luxury-body text-black mb-6 max-w-2xl mx-auto">
              Click "Run Diagnostics" to check your system configuration, network status,
              browser capabilities, and Firebase connection. This will help identify why
              uploads might be failing or stalling at 30%.
            </p>
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-luxury p-4 max-w-2xl mx-auto">
              <p className="text-sm font-luxury-body text-yellow-900">
                <strong>Note:</strong> This diagnostic tool will test your upload capabilities
                but will not upload any personal data. A tiny test file may be uploaded to
                verify functionality.
              </p>
            </div>
          </div>
        )}

        {/* Common Issues Guide */}
        <div className="luxury-card bg-cream-white p-8">
          <h2 className="text-2xl font-luxury-heading text-black mb-6">
            Common Issues & Quick Fixes
          </h2>

          <div className="space-y-6">
            <div className="border-l-4 border-vibrant-orange pl-4">
              <h3 className="text-lg font-luxury-semibold text-black mb-2">
                Upload Stalls at 30%
              </h3>
              <p className="font-luxury-body text-black mb-2">
                This is usually caused by network timeout or large file size.
              </p>
              <ul className="list-disc list-inside space-y-1 font-luxury-body text-black/80">
                <li>Compress your image to under 2MB</li>
                <li>Check your internet connection</li>
                <li>Try again with a smaller image</li>
                <li>Switch to Wi-Fi if on mobile data</li>
              </ul>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-luxury-semibold text-black mb-2">
                "Permission Denied" Error
              </h3>
              <p className="font-luxury-body text-black mb-2">
                Your account may not have permission to upload files.
              </p>
              <ul className="list-disc list-inside space-y-1 font-luxury-body text-black/80">
                <li>Make sure you're logged in</li>
                <li>Check if your account is verified</li>
                <li>Contact administrator if issue persists</li>
              </ul>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-lg font-luxury-semibold text-black mb-2">
                "File Too Large" Error
              </h3>
              <p className="font-luxury-body text-black mb-2">
                The maximum file size is 5MB.
              </p>
              <ul className="list-disc list-inside space-y-1 font-luxury-body text-black/80">
                <li>Use online tools like TinyPNG or Squoosh to compress</li>
                <li>Resize image to 1920x1080 or smaller</li>
                <li>Convert to JPEG format for better compression</li>
              </ul>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-lg font-luxury-semibold text-black mb-2">
                General Troubleshooting
              </h3>
              <ul className="list-disc list-inside space-y-1 font-luxury-body text-black/80">
                <li>Clear browser cache and cookies</li>
                <li>Try a different browser (Chrome or Firefox recommended)</li>
                <li>Disable browser extensions temporarily</li>
                <li>Check Firebase Status page for outages</li>
                <li>Wait a few minutes and try again</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadDiagnostics;
