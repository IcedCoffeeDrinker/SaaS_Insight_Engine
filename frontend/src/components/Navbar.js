import React from 'react';

function Navbar({ onGetAccess, onRestoreAccess }) {
  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={onRestoreAccess}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              Restore Access
            </button>
            <button
              onClick={onGetAccess}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Access
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 