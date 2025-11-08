/**
 * Upload Diagnostics Tool
 *
 * This utility helps diagnose image upload issues, particularly
 * the common "stall at 30%" problem.
 */

import { ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../config/firebase';

export interface DiagnosticResult {
  category: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export interface UploadDiagnostics {
  timestamp: string;
  results: DiagnosticResult[];
  overallStatus: 'healthy' | 'issues' | 'critical';
  recommendations: string[];
}

/**
 * Run comprehensive upload diagnostics
 */
export const runUploadDiagnostics = async (): Promise<UploadDiagnostics> => {
  const results: DiagnosticResult[] = [];
  const recommendations: string[] = [];

  console.log('🔍 Starting upload diagnostics...');

  // 1. Check Firebase Configuration
  try {
    if (!storage) {
      results.push({
        category: 'Firebase Configuration',
        status: 'fail',
        message: 'Firebase Storage is not initialized',
        details: { storage: null }
      });
      recommendations.push('Initialize Firebase Storage in your config file');
    } else {
      results.push({
        category: 'Firebase Configuration',
        status: 'pass',
        message: 'Firebase Storage is properly initialized',
        details: { app: storage.app.name }
      });
    }
  } catch (error) {
    results.push({
      category: 'Firebase Configuration',
      status: 'fail',
      message: 'Error checking Firebase configuration',
      details: { error }
    });
  }

  // 2. Check Network Connectivity
  try {
    const isOnline = navigator.onLine;
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    if (!isOnline) {
      results.push({
        category: 'Network',
        status: 'fail',
        message: 'No internet connection detected',
        details: { online: false }
      });
      recommendations.push('Check your internet connection and try again');
    } else {
      const effectiveType = connection?.effectiveType || 'unknown';
      const downlink = connection?.downlink || 0;

      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        results.push({
          category: 'Network',
          status: 'warning',
          message: 'Slow network detected (2G)',
          details: { effectiveType, downlink }
        });
        recommendations.push('Switch to Wi-Fi or faster connection for better upload experience');
      } else if (effectiveType === '3g') {
        results.push({
          category: 'Network',
          status: 'warning',
          message: 'Moderate network speed (3G)',
          details: { effectiveType, downlink }
        });
        recommendations.push('Consider using Wi-Fi for large file uploads');
      } else {
        results.push({
          category: 'Network',
          status: 'pass',
          message: `Good network connection (${effectiveType})`,
          details: { effectiveType, downlink }
        });
      }
    }
  } catch (error) {
    results.push({
      category: 'Network',
      status: 'warning',
      message: 'Could not determine network status',
      details: { error }
    });
  }

  // 3. Check Browser Capabilities
  try {
    const capabilities = {
      fileAPI: !!window.File && !!window.FileReader && !!window.FileList && !!window.Blob,
      canvas: !!document.createElement('canvas').getContext,
      webWorkers: !!window.Worker,
      serviceWorker: 'serviceWorker' in navigator,
      localStorage: checkLocalStorage(),
      indexedDB: !!window.indexedDB
    };

    const failedCapabilities = Object.entries(capabilities)
      .filter(([_, supported]) => !supported)
      .map(([name, _]) => name);

    if (failedCapabilities.length > 0) {
      results.push({
        category: 'Browser Capabilities',
        status: 'warning',
        message: `Some features not supported: ${failedCapabilities.join(', ')}`,
        details: capabilities
      });
      recommendations.push('Update your browser to the latest version');
    } else {
      results.push({
        category: 'Browser Capabilities',
        status: 'pass',
        message: 'All required browser features are supported',
        details: capabilities
      });
    }
  } catch (error) {
    results.push({
      category: 'Browser Capabilities',
      status: 'warning',
      message: 'Could not check browser capabilities',
      details: { error }
    });
  }

  // 4. Check Memory Usage
  try {
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      const usedPercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

      if (usedPercent > 90) {
        results.push({
          category: 'Memory',
          status: 'warning',
          message: `High memory usage: ${usedPercent.toFixed(1)}%`,
          details: {
            used: formatBytes(memory.usedJSHeapSize),
            total: formatBytes(memory.jsHeapSizeLimit)
          }
        });
        recommendations.push('Close unnecessary tabs and refresh the page');
      } else if (usedPercent > 75) {
        results.push({
          category: 'Memory',
          status: 'warning',
          message: `Moderate memory usage: ${usedPercent.toFixed(1)}%`,
          details: {
            used: formatBytes(memory.usedJSHeapSize),
            total: formatBytes(memory.jsHeapSizeLimit)
          }
        });
      } else {
        results.push({
          category: 'Memory',
          status: 'pass',
          message: `Good memory availability: ${(100 - usedPercent).toFixed(1)}% free`,
          details: {
            used: formatBytes(memory.usedJSHeapSize),
            total: formatBytes(memory.jsHeapSizeLimit)
          }
        });
      }
    } else {
      results.push({
        category: 'Memory',
        status: 'warning',
        message: 'Memory information not available in this browser',
        details: null
      });
    }
  } catch (error) {
    results.push({
      category: 'Memory',
      status: 'warning',
      message: 'Could not check memory usage',
      details: { error }
    });
  }

  // 5. Test Firebase Storage Access
  try {
    const testRef = ref(storage, 'diagnostic-test/.test');
    // Just creating a reference doesn't require network access
    results.push({
      category: 'Storage Access',
      status: 'pass',
      message: 'Can create Firebase Storage references',
      details: { path: testRef.fullPath }
    });
  } catch (error) {
    results.push({
      category: 'Storage Access',
      status: 'fail',
      message: 'Cannot create Firebase Storage references',
      details: { error }
    });
    recommendations.push('Check Firebase configuration and authentication');
  }

  // 6. Check for AdBlockers/Extensions
  try {
    const testImg = new Image();
    const hasAdBlocker = await new Promise((resolve) => {
      testImg.onerror = () => resolve(true);
      testImg.onload = () => resolve(false);
      testImg.src = 'https://pagead2.googlesyndication.com/pagead/show_ads.js';
      setTimeout(() => resolve(false), 2000);
    });

    if (hasAdBlocker) {
      results.push({
        category: 'Extensions',
        status: 'warning',
        message: 'Ad blocker or restrictive extension detected',
        details: { adBlocker: true }
      });
      recommendations.push('Some extensions may interfere with uploads. Try disabling ad blockers.');
    } else {
      results.push({
        category: 'Extensions',
        status: 'pass',
        message: 'No obvious interference from extensions',
        details: { adBlocker: false }
      });
    }
  } catch (error) {
    results.push({
      category: 'Extensions',
      status: 'warning',
      message: 'Could not check for interfering extensions',
      details: { error }
    });
  }

  // Determine overall status
  const hasCritical = results.some(r => r.status === 'fail');
  const hasWarnings = results.some(r => r.status === 'warning');
  const overallStatus = hasCritical ? 'critical' : hasWarnings ? 'issues' : 'healthy';

  // Add general recommendations
  if (overallStatus !== 'healthy') {
    recommendations.push('If problems persist, try clearing browser cache and cookies');
    recommendations.push('Use Chrome or Firefox for best compatibility');
  }

  const diagnostics: UploadDiagnostics = {
    timestamp: new Date().toISOString(),
    results,
    overallStatus,
    recommendations: Array.from(new Set(recommendations)) // Remove duplicates
  };

  console.log('✅ Diagnostics complete:', diagnostics);

  return diagnostics;
};

/**
 * Test actual upload with a tiny dummy file
 */
export const testUpload = async (folder: string = 'diagnostic-test'): Promise<DiagnosticResult> => {
  console.log('🧪 Testing upload with dummy file...');

  try {
    // Create a tiny test image (1x1 pixel PNG)
    const testImage = await createTestImage();
    const fileName = `${folder}/test_${Date.now()}.png`;
    const storageRef = ref(storage, fileName);

    return new Promise((resolve) => {
      const uploadTask = uploadBytesResumable(storageRef, testImage);

      const timeout = setTimeout(() => {
        uploadTask.cancel();
        resolve({
          category: 'Upload Test',
          status: 'fail',
          message: 'Upload test timed out after 30 seconds',
          details: { timeout: true }
        });
      }, 30000);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Test upload progress: ${progress.toFixed(1)}%`);
        },
        (error) => {
          clearTimeout(timeout);
          resolve({
            category: 'Upload Test',
            status: 'fail',
            message: `Upload test failed: ${error.message}`,
            details: { error: error.code, message: error.message }
          });
        },
        async () => {
          clearTimeout(timeout);
          resolve({
            category: 'Upload Test',
            status: 'pass',
            message: 'Upload test successful',
            details: {
              path: fileName,
              size: testImage.size,
              time: '< 30s'
            }
          });
        }
      );
    });
  } catch (error: any) {
    return {
      category: 'Upload Test',
      status: 'fail',
      message: `Could not run upload test: ${error.message}`,
      details: { error }
    };
  }
};

/**
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if localStorage is available
 */
function checkLocalStorage(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Create a tiny test image for upload testing
 */
async function createTestImage(): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, 1, 1);

    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Could not create test image'));
      }
    }, 'image/png');
  });
}

/**
 * Display diagnostics in console with nice formatting
 */
export const displayDiagnostics = (diagnostics: UploadDiagnostics) => {
  console.group('📊 Upload Diagnostics Report');
  console.log('Timestamp:', diagnostics.timestamp);
  console.log('Overall Status:', diagnostics.overallStatus.toUpperCase());
  console.log('');

  console.group('Test Results:');
  diagnostics.results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.group(`${icon} ${result.category}`);
    console.log('Status:', result.status);
    console.log('Message:', result.message);
    if (result.details) {
      console.log('Details:', result.details);
    }
    console.groupEnd();
  });
  console.groupEnd();

  if (diagnostics.recommendations.length > 0) {
    console.group('💡 Recommendations:');
    diagnostics.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
    console.groupEnd();
  }

  console.groupEnd();
};

/**
 * Quick diagnostic check before upload
 */
export const preUploadCheck = async (): Promise<boolean> => {
  const criticalChecks = [
    () => navigator.onLine,
    () => !!storage,
    () => checkLocalStorage()
  ];

  const allPassed = criticalChecks.every(check => {
    try {
      return check();
    } catch {
      return false;
    }
  });

  if (!allPassed) {
    console.warn('⚠️ Pre-upload check failed. Some critical requirements not met.');
  }

  return allPassed;
};
