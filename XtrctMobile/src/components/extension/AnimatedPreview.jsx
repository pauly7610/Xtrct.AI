// src/components/ExtensionDownload/AnimatedPreview.jsx
import React, { useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

function AnimatedPreview() {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    threshold: 0.2,
    triggerOnce: true
  });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  const features = [
    { title: "Quick Capture", icon: "✨" },
    { title: "Smart Extract", icon: "🔍" },
    { title: "Calendar Sync", icon: "📅" }
  ];

  return (
    <motion.div
      ref={ref}
      animate={controls}
      initial="hidden"
      variants={containerVariants}
      className="relative"
    >
      {/* Extension Preview */}
      <motion.div
        variants={itemVariants}
        className="relative z-10"
      >
        <div className="bg-[#313442] rounded-lg p-4 shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>

          <div className="space-y-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex items-center gap-3 bg-black bg-opacity-30 p-3 rounded"
              >
                <span className="text-2xl">{feature.icon}</span>
                <span className="text-white">{feature.title}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Floating Elements */}
      <motion.div
        animate={{
          y: [0, -10, 0],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
        className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2"
      >
        <div className="w-20 h-20 bg-[#70B7FA] rounded-full opacity-10" />
      </motion.div>
    </motion.div>
  );
}
