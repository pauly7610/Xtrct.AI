import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const SharePreview = ({ content, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
  >
    <div className="bg-white rounded-xl max-w-lg w-full p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Share Preview</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="mb-4">
        <div className="bg-gray-50 rounded-lg p-4">
          {content}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            // Handle share logic
            onClose();
        }}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Share
      </button>
    </div>
  </div>
</motion.div>
);

export default SharePreview;
