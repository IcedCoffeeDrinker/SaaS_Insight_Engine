import React from 'react';

function SocialProof() {
  return (
    <div className="mt-12 mb-12 text-center">
      <div className="flex justify-center mb-4">
        <div className="flex -space-x-4">
          <img 
            className="w-16 h-16 rounded-full border-2 border-white" 
            src="/images/profile_pic_placeholder1.png" 
            alt="User" 
          />
          <img 
            className="w-16 h-16 rounded-full border-2 border-white" 
            src="/images/profile_pic_placeholder2.png" 
            alt="User" 
          />
          <img 
            className="w-16 h-16 rounded-full border-2 border-white" 
            src="/images/profile_pic_placeholder3.png" 
            alt="User" 
          />
          <div className="flex items-center justify-center w-16 h-16 rounded-full border-2 border-white bg-gray-100 text-gray-500 font-bold">
            +350
          </div>
        </div>
      </div>
      <h2 className="text-3xl font-bold text-gray-700">
        350+ <span className="text-gray-500">entrepreneurs building with our database</span>
      </h2>
    </div>
  );
}

export default SocialProof; 