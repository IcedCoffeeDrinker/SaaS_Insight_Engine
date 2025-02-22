import React from 'react';

function Navbar({ onGetAccess }) {
  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <img src="/logo.svg" alt="Logo" className="h-8 w-auto" />
          </div>
          
          <button
            onClick={onGetAccess}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Access
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 