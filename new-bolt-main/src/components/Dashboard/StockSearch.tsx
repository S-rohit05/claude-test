import React, { useState } from 'react';
import { Search, Loader, TrendingUp, TrendingDown } from 'lucide-react';
import { searchStock } from '../../services/stockApi';
import { Stock } from '../../types';
import StockChart from './StockChart';

const StockSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      const result = await searchStock(query);
      if (result) {
        setStock(result);
      } else {
        setError('Stock not found. Try symbols like AAPL, GOOGL, MSFT, TSLA, or AMZN.');
        setStock(null);
      }
    } catch (err) {
      setError('Failed to fetch stock data');
      setStock(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Stocks</h2>
      
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter stock symbol (e.g., AAPL)"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader className="h-4 w-4 animate-spin" /> : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {stock && (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{stock.symbol}</h3>
                <p className="text-sm text-gray-600">{stock.name}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">${stock.price.toFixed(2)}</p>
                <div className="flex items-center space-x-1">
                  {stock.change >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
              <div>
                <span className="text-gray-500">Volume:</span>
                <span className="ml-2 font-medium">{stock.volume?.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500">Market Cap:</span>
                <span className="ml-2 font-medium">{stock.marketCap}</span>
              </div>
            </div>
          </div>

          <StockChart symbol={stock.symbol} />
        </div>
      )}
    </div>
  );
};

export default StockSearch;