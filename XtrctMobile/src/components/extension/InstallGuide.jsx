// src/components/ExtensionDownload/InstallGuide.jsx
import React from 'react';
import { CheckCircle2 } from 'lucide-react';

function InstallGuide() {
  const steps = [
    {
      title: "Add to Chrome",
      description: "Click the 'Add to Chrome' button above",
      image: "/images/install-step-1.png"
    },
    {
      title: "Confirm Installation",
      description: "Click 'Add Extension' in the popup",
      image: "/images/install-step-2.png"
    },
    {
      title: "Sign In",
      description: "Use your Xtrct.AI account to sign in",
      image: "/images/install-step-3.png"
    }
  ];

  return (
    <div className="py-16 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-white">
            Quick Installation Guide
          </h2>
          <p className="mt-4 text-gray-400">
            Get started with Xtrct.AI Chrome extension in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="relative"
            >
              {index !== steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 right-0 w-full h-0.5 bg-gray-800 transform translate-x-1/2" />
              )}
              
              <div className="bg-[#313442] rounded-lg p-6 relative z-10">
                <div className="bg-[#70B7FA] w-8 h-8 rounded-full flex items-center justify-center text-black font-medium mb-4">
                  {index + 1}
                </div>
                
                <div className="aspect-video mb-4 bg-black rounded-lg overflow-hidden">
                  <img 
                    src={step.image} 
                    alt={step.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <h3 className="text-lg font-medium text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-400 text-sm">
                  {step.description}
                </p>

                <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-[#70B7FA]" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-400">
            Need help? <a href="/support" className="text-[#70B7FA]">Contact our support team</a>
          </p>
        </div>
      </div>
    </div>
  );
}
