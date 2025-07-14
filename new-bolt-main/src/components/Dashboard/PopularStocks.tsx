import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Loader } from 'lucide-react';
import { getPopularStocks } from '../../services/stockApi';
import { Stock } from '../../types';

const PopularStocks: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Not authenticated");

        const popularStocks = await getPopularStocks(token);

        // If your API does not return name, change accordingly.
        // Here we add placeholders for name, change, and changePercent if needed.
        setStocks(
          popularStocks.map((stock: any) => ({
            symbol: stock.symbol,
            name: stock.symbol, // You can fetch names using another API or map yourself
            price: stock.latest_price,
            change: 0, // Set these if you have values from backend
            changePercent: 0
          }))
        );
      } catch (error) {
        setStocks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Stocks</h2>
        <div className="flex justify-center items-center h-32">
          <Loader className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Stocks</h2>
      <div className="space-y-3">
        {stocks.map((stock) => (
          <div
            key={stock.symbol}
            className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{stock.symbol}</h3>
                  <p className="text-sm text-gray-600">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${stock.price?.toFixed(2)}</p>
                  <div className="flex items-center justify-end space-x-1">
                    {stock.change >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stock.changePercent?.toFixed(2) ?? '0.00'}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopularStocks;
