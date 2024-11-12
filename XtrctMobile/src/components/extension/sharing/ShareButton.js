import React from 'react';
import { Share2 } from 'lucide-react';

const ShareButton = ({ onShare, className = '' }) => (
  <button
    onClick={onShare}
    className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${className}`}
  >
    <Share2 className="w-4 h-4" />
    <span>Share</span>
  </button>
);

export default ShareButton;
