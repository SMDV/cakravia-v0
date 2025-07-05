import React from 'react';
import { AlertTriangle, Smartphone, Monitor, X, ArrowRight } from 'lucide-react';

interface CrossDeviceWarningProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAnyway: () => void;
  onStartNew: () => void;
  testInfo?: {
    questionSetName: string;
    timeLimit: number;
  };
}

const CrossDeviceWarning: React.FC<CrossDeviceWarningProps> = ({
  isOpen,
  onClose,
  onContinueAnyway,
  onStartNew,
  testInfo
}) => {
  if (!isOpen) return null;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        {/* Modal */}
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="p-6">
            {/* Warning Icon */}
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-center text-gray-900 mb-3">
              No Saved Progress Found
            </h3>

            {/* Description */}
            <div className="text-sm text-gray-600 space-y-3 mb-6">
              <p className="text-center">
                You&apos;re trying to continue a test, but we can&apos;t find any saved progress on this device.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Why is this happening?
                </h4>
                <ul className="text-blue-800 text-xs space-y-1 ml-6">
                  <li>• You started the test on a different device</li>
                  <li>• You cleared your browser data</li>
                  <li>• You&apos;re using incognito/private mode</li>
                  <li>• The test data expired (older than 24 hours)</li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Test Progress is Device-Specific
                </h4>
                <p className="text-amber-800 text-xs">
                  Our system saves your progress locally on each device for optimal performance. 
                  To continue your test, please use the same device where you started.
                </p>
              </div>
            </div>

            {/* Test Info */}
            {testInfo && (
              <div className="bg-gray-50 rounded-lg p-3 mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Test Information:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Assessment:</span>
                    <span className="font-medium">{testInfo.questionSetName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Limit:</span>
                    <span className="font-medium">{formatDuration(testInfo.timeLimit)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={onStartNew}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <ArrowRight className="w-4 h-4" />
                Start New Test on This Device
              </button>

              <button
                onClick={onContinueAnyway}
                className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Continue Anyway (Lost Progress)
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 text-center">
                <strong>Tip:</strong> For the best experience, complete your test on the same device where you started it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CrossDeviceWarning;