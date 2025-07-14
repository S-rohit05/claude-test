import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { PortfolioItem } from '../../types';
import { addStock, deleteStock, getPortfolio } from '../../services/stockApi';

const Portfolio: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStock, setNewStock] = useState({ symbol: '', shares: '', avgPrice: '' });
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  // Fetch portfolio on mount and after changes
  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const data = await getPortfolio(token!);
      if (Array.isArray(data)) setPortfolio(data);
      else setPortfolio([]);
    } catch {
      setPortfolio([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPortfolio(); }, []);

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStock.symbol || !newStock.shares || !newStock.avgPrice) return;
    setLoading(true);
    try {
      await addStock(token!, newStock.symbol, parseFloat(newStock.shares), parseFloat(newStock.avgPrice));
      setNewStock({ symbol: '', shares: '', avgPrice: '' });
      setShowAddForm(false);
      fetchPortfolio();
    } catch {
      alert('Failed to add stock. Try again.');
    }
    setLoading(false);
  };

  const handleRemoveStock = async (id: number) => {
    setLoading(true);
    try {
      await deleteStock(token!, id);
      fetchPortfolio();
    } catch {
      alert('Failed to delete stock. Try again.');
    }
    setLoading(false);
  };

  const totalValue = Array.isArray(portfolio) ? portfolio.reduce((sum, item) => sum + (item.latest_price * item.quantity), 0) : 0;
  const totalGainLoss = Array.isArray(portfolio) ? portfolio.reduce((sum, item) => sum + ((item.latest_price - item.buy_price) * item.quantity), 0) : 0;
  const totalGainLossPercent = totalValue > 0 ? (totalGainLoss / (totalValue - totalGainLoss)) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* ...rest of your code as above, unchanged... */}
      {/* Only show portfolio items if Array.isArray(portfolio) */}
      <div className="space-y-4">
        {Array.isArray(portfolio) && portfolio.map((item) => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            {/* ... */}
          </div>
        ))}
        {portfolio.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No stocks in your portfolio yet.</p>
            <p className="text-sm text-gray-400 mt-1">Add some stocks to get started!</p>
          </div>
        )}
      </div>
      {/* ...modal code unchanged... */}
    </div>
  );
};

export default Portfolio;
