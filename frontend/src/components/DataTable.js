import React, { useState, useEffect, useRef } from 'react';

function DataTable({ data, hasAccess, onGetAccess }) {
  const [descriptions, setDescriptions] = useState({});
  const [hoveredRow, setHoveredRow] = useState(null);
  const [jsonData, setJsonData] = useState([]);
  const hoverTimeoutRef = useRef(null);

  // Fetch the JSON data when component mounts
  useEffect(() => {
    const fetchJsonData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/saas-ideas');
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

  return (
    <div className="space-y-8">
      <div className="relative overflow-x-auto shadow-md rounded-lg">
        <table className="w-full text-left">
          <thead className="bg-blue-50">
            {data[0] && (
              <tr>
                {['SaaS Niche', 
                  'Monthly Keyword Searches', 
                  'Evaluation of Competition', 
                  'Approximated Revenue'].map((header) => (
                  <th key={header} className="px-6 py-4 text-sm font-semibold text-blue-900 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {data.map((row, index) => (
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
                  <td key={i} className="px-6 py-4 whitespace-nowrap">
                    {i === 0 ? (
                      <span className="text-gray-500">{value}</span>
                    ) : i === 1 ? (
                      <div className="relative">
                        <span className="text-green-600 font-medium">{value}</span>
                        {index === hoveredRow && descriptions[row['SaaS Niche']] && (
                          <div className="absolute left-0 top-full mt-2 w-96 max-w-lg bg-white p-4 shadow-lg rounded z-50 text-sm border border-gray-200 animate-fade-in pointer-events-none">
                            <p className="text-gray-700 whitespace-normal leading-relaxed">{descriptions[row['SaaS Niche']]}</p>
                          </div>
                        )}
                      </div>
                    ) : i === 2 ? (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium
                        ${value === 'High' ? 'bg-red-100 text-red-800' : 
                          value === 'Moderate' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-green-100 text-green-800'}`}>
                        {value}
                      </span>
                    ) : i === 3 ? (
                      <span className="text-blue-600 font-medium">{value}</span>
                    ) : (
                      <span className="text-gray-500">{value}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
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