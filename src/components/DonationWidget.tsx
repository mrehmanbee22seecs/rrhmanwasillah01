import React, { useState, useEffect, useRef } from 'react';
import { Heart, X, CreditCard, Smartphone } from 'lucide-react';

const DonationWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [suppressButton, setSuppressButton] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Removed scrollIntoView - causes buggy behavior
  // Modal positioning is handled by fixed positioning with transform

  // Broadcast open/close to other widgets and listen for theirs
  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent('widget:open', { detail: 'donation' }));
    } else {
      window.dispatchEvent(new CustomEvent('widget:close', { detail: 'donation' }));
    }
  }, [isOpen]);

  useEffect(() => {
    const onOpen = (e: any) => {
      if (e?.detail !== 'donation') setSuppressButton(true);
    };
    const onClose = (e: any) => {
      if (e?.detail !== 'donation') setSuppressButton(false);
    };
    window.addEventListener('widget:open', onOpen as any);
    window.addEventListener('widget:close', onClose as any);
    return () => {
      window.removeEventListener('widget:open', onOpen as any);
      window.removeEventListener('widget:close', onClose as any);
    };
  }, []);

  const paymentMethods = [
    {
      name: 'Easypaisa',
      icon: Smartphone,
      account: '03349682146',
      type: 'mobile',
      instructions: 'Send your donation to this Easypaisa number',
      color: 'bg-green-600'
    },
    {
      name: 'Mastercard',
      icon: CreditCard,
      account: '19367902143803',
      bank: 'Habib Bank Limited',
      type: 'card',
      instructions: 'Bank transfer to this account number',
      color: 'bg-blue-600'
    }
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Account number copied to clipboard!');
  };

  return (
    <>
      {!isOpen && !suppressButton && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0)+16px)] left-4 md:left-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 md:px-5 md:py-4 rounded-full shadow-luxury-glow flex items-center justify-center hover:scale-110 transition-all duration-300 group"
            title="Support Our Mission"
          >
            <Heart className="w-5 h-5 md:w-6 md:h-6 mr-2" fill="currentColor" />
            <span className="font-luxury-semibold text-base md:text-lg whitespace-nowrap">DONATE NOW!</span>
          </button>
        </div>
      )}

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={widgetRef}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[70] w-[92vw] max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto luxury-card bg-cream-white rounded-luxury-lg shadow-luxury-lg animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500 to-green-600 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6" fill="currentColor" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Support Wasilah</h3>
                <p className="text-sm opacity-90 font-medium">Make a difference today</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-2 rounded transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-900 font-medium mb-6 text-center">
              Your generous donations help us continue our mission of empowering communities and creating lasting positive change.
            </p>

            <div className="space-y-4">
              {paymentMethods.map((method, index) => (
                <div key={index} className="border-2 border-gray-300 rounded-xl p-4 hover:border-vibrant-orange transition-colors">
                  <div className="flex items-center mb-3">
                    <div className={`${method.color} w-10 h-10 rounded-full flex items-center justify-center mr-3`}>
                      <method.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{method.name}</h4>
                      {method.bank && (
                        <p className="text-xs text-gray-700 font-medium">{method.bank}</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-100 rounded-xl p-3 mb-2">
                    <p className="text-xs text-gray-700 font-medium mb-1">{method.instructions}</p>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-900 text-lg">{method.account}</p>
                      <button
                        onClick={() => copyToClipboard(method.account)}
                        className="text-vibrant-orange hover:text-vibrant-orange-dark text-sm font-bold"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-vibrant-orange/10 rounded-xl">
              <p className="text-sm text-gray-900 font-medium text-center">
                After making a donation, please email us at{' '}
                <a href="mailto:donations@wasilah.org" className="text-vibrant-orange-dark font-bold">
                  donations@wasilah.org
                </a>{' '}
                with your transaction details for acknowledgment.
              </p>
            </div>
          </div>
          </div>
        </>
      )}
    </>
  );
};

export default DonationWidget;
