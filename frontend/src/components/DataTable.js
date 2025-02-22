import React from 'react';

function DataTable({ data, hasAccess }) {
  return (
    <div className="relative overflow-x-auto shadow-md rounded-lg">
      <table className="w-full text-left">
        <thead className="bg-gray-50">
          {data[0] && (
            <tr>
              {Object.keys(data[0]).map((header) => (
                <th key={header} className="px-6 py-3">
                  {header}
                </th>
              ))}
            </tr>
          )}
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="bg-white border-b">
              {Object.values(row).map((value, i) => (
                <td key={i} className="px-6 py-4">
                  {value}
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
              Get Full Access for $3
            </p>
            <p className="text-gray-600">
              One-time payment, lifetime access
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable; 