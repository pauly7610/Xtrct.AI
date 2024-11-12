import React, { useState, useEffect } from 'react';
import { Chrome, Share2, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const ShareExtension = () => {
  const [installed, setInstalled] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Check if extension is already installed
  useEffect(() => {
    if (window.chrome && window.chrome.runtime) {
      // Replace with your actual extension ID
      const extensionId = 'YOUR_EXTENSION_ID';
      
      chrome.runtime.sendMessage(extensionId, { message: 'version' }, 
        response => {
          if (!chrome.runtime.lastError) {
            setInstalled(true);
          }
        }
      );
    }
  }, []);

  const handleInstall = async () => {
    try {
      setProcessing(true);
      
      if (window.chrome && window.chrome.webstore && window.chrome.webstore.install) {
        window.chrome.webstore.install(
          undefined, // Uses verified site URL
          () => {
            setInstalled(true);
            setProcessing(false);
          },
          (error) => {
            console.error('Installation failed:', error);
            setProcessing(false);
            // Fallback to Chrome Web Store
            window.open('https://chrome.google.com/webstore/detail/YOUR_EXTENSION_ID', '_blank');
          }
        );
      } else {
        // Fallback for browsers without chrome.webstore API
        window.open('https://chrome.google.com/webstore/detail/YOUR_EXTENSION_ID', '_blank');
        setProcessing(false);
      }
    } catch (error) {
      console.error('Installation error:', error);
      setProcessing(false);
      // Fallback to Chrome Web Store
      window.open('https://chrome.google.com/webstore/detail/YOUR_EXTENSION_ID', '_blank');
    }
  };

  return (
    <div className="bg-black p-8 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Chrome className="w-6 h-6 text-white" />
          <h2 className="text-xl font-semibold text-white">Chrome Extension</h2>
        </div>
        {installed ? (
          <div className="flex items-center gap-2 text-green-400">
            <Check className="w-5 h-5" />
            <span>Installed</span>
          </div>
        ) : (
          <button
            onClick={handleInstall}
            disabled={processing}
            className={`px-4 py-2 rounded-lg bg-blue-500 text-white flex items-center gap-2 ${
              processing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
            }`}
          >
            <Share2 className="w-4 h-4" />
            {processing ? 'Installing...' : 'Install'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard
          title="Quick Share"
          description="Share content directly from any webpage"
          icon="🚀"
        />
        <FeatureCard
          title="Smart Extract"
          description="AI-powered content extraction"
          icon="🧠"
        />
        <FeatureCard
          title="Sync Tasks"
          description="Automatically sync with your tasks"
          icon="🔄"
        />
      </div>
    </div>
  );
};

const FeatureCard = ({ title, description, icon }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="bg-gray-800 p-6 rounded-lg"
  >
    <span className="text-3xl mb-4 block">{icon}</span>
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </motion.div>
);

export default ShareExtension;
