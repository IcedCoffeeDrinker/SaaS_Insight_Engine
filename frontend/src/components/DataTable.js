import React, { useState, useEffect, useRef } from 'react';

// API URL - use environment variable in production or default to localhost for development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function DataTable({ data, hasAccess, onGetAccess }) {
  const [descriptions, setDescriptions] = useState({});
  const [hoveredRow, setHoveredRow] = useState(null);
  const [jsonData, setJsonData] = useState([]);
  const hoverTimeoutRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const entriesPerPage = 25;

  // Calculate total pages and current page data
  const totalPages = Math.ceil(data.length / entriesPerPage);
  const currentData = hasAccess 
    ? data.slice(currentPage * entriesPerPage, (currentPage + 1) * entriesPerPage)
    : data.slice(0, 8); // Always show first 8 for non-paying users

  // Fetch the JSON data when component mounts
  useEffect(() => {
    const fetchJsonData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/saas-ideas`);
        const data = await response.json();
        setJsonData(data);
      } catch (error) {
        console.error('Error fetching JSON data:', error);
      }
    };

    fetchJsonData();
  }, []);

  // Handle mouse enter with delay
  const handleMouseEnter = (index, title) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // Set a timeout of 200ms before showing the description
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredRow(index);
      
      // If we don't have this description yet, find it in the JSON data
      if (!descriptions[title] && jsonData.length > 0) {
        const idea = jsonData.find(item => item.product_title === title);
        if (idea) {
          setDescriptions(prev => ({
            ...prev,
            [title]: idea.description
          }));
        }
      }
    }, 200);
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    // Clear the timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredRow(null);
  };

  // Navigation handlers
  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Adjust tooltip position to prevent clipping
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (hoveredRow !== null && tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const isNearBottom = tooltipRect.bottom > viewportHeight;
      const isSecondLast = hoveredRow === currentData.length - 2;
      const isLast = hoveredRow === currentData.length - 1;

      if (isNearBottom || isSecondLast || isLast) {
        tooltipRef.current.style.top = `-${tooltipRect.height / 2}px`;
      } else {
        tooltipRef.current.style.top = '100%';
      }
    }
  }, [hoveredRow, currentData.length]);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden shadow-md rounded-lg">
        <table className="w-full text-left table-fixed">
          <thead className="bg-blue-50">
            {data[0] && (
              <tr>
                {['SaaS Niche', 
                  'Monthly Keyword Searches', 
                  'Evaluation of Competition', 
                  'Approximated Revenue'].map((header, index) => (
                  <th key={header} className={`px-6 py-4 text-sm font-semibold text-blue-900 uppercase tracking-wider ${
                    index === 0 ? 'w-[45%]' : 'w-[18.33%]'
                  }`}>
                    {header}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {currentData.map((row, index) => (
              <tr 
                key={index}
                className={`bg-white border-b hover:bg-gray-50 transition-colors ${index === hoveredRow ? 'bg-gray-50' : ''}`}
                onMouseEnter={() => handleMouseEnter(index, row['SaaS Niche'])}
                onMouseLeave={handleMouseLeave}
              >
                {[row['SaaS Niche'], 
                  row['Monthly Keyword Searches'], 
                  row['Evaluation of Competition'], 
                  row['Approximated Revenue']].map((value, i) => (
                  <td key={i} className={`px-6 py-4 ${
                    i === 0 ? 'w-[45%]' : 'w-[18.33%]'
                  }`}>
                    {i === 0 ? (
                      <div className="relative group">
                        <span className="text-gray-500 truncate block" title={value}>{value}</span>
                      </div>
                    ) : i === 1 ? (
                      <div className="relative">
                        <span className="text-green-600 font-medium whitespace-nowrap">{value}</span>
                        {index === hoveredRow && descriptions[row['SaaS Niche']] && (
                          <div
                            ref={tooltipRef}
                            className="absolute left-0 mt-2 w-96 max-w-lg bg-white p-4 shadow-lg rounded z-50 text-sm border border-gray-200 animate-fade-in pointer-events-none"
                          >
                            <p className="text-gray-700 whitespace-normal leading-relaxed">{descriptions[row['SaaS Niche']]}</p>
                          </div>
                        )}
                      </div>
                    ) : i === 2 ? (
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap
                        ${value === 'High' ? 'bg-red-100 text-red-800' : 
                          value === 'Moderate' ? 'bg-yellow-100 text-yellow-800' : 
                          value === 'Low' ? 'bg-teal-100 text-teal-800' :
                          'bg-green-100 text-green-800'}`}>
                        {value}
                      </span>
                    ) : i === 3 ? (
                      <span className="text-blue-600 font-medium whitespace-nowrap">{value}</span>
                    ) : (
                      <span className="text-gray-500 whitespace-nowrap">{value}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination controls - only visible for users with access */}
        {hasAccess && data.length > entriesPerPage && (
          <div className="flex justify-between items-center px-6 py-3 bg-gray-50">
            <div className="text-sm text-gray-700">
              Page {currentPage + 1} of {totalPages} • {data.length} total opportunities
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={goToPreviousPage} 
                disabled={currentPage === 0}
                className={`p-2 rounded ${currentPage === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'}`}
              >
                ←
              </button>
              <button 
                onClick={goToNextPage} 
                disabled={currentPage >= totalPages - 1}
                className={`p-2 rounded ${currentPage >= totalPages - 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'}`}
              >
                →
              </button>
            </div>
          </div>
        )}
        
        {!hasAccess && (
          <div className="absolute inset-x-0 bottom-0 h-1/3 flex items-center justify-center"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 40%, rgba(255,255,255,0.9) 80%, rgba(255,255,255,0.9) 100%)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)'
            }}>
            <div className="text-center">
              <p className="text-xl font-semibold mb-4">
                Get Full Access for $30
              </p>
              <p className="text-gray-600">
                One-time payment, lifetime access
              </p>
            </div>
          </div>
        )}
      </div>
      
      {!hasAccess && (
        <div className="flex justify-center">
          <button
            onClick={onGetAccess}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg"
          >
            Get Full Access Now
          </button>
        </div>
      )}
    </div>
  );
}

export default DataTable; 