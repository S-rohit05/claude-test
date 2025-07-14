import React, { useEffect, useState } from 'react';
import Header from '../Layout/Header';
import Portfolio from './Portfolio';
import StockSearch from './StockSearch';
import PopularStocks from './PopularStocks';
import { getPortfolio } from '../../services/stockApi'; // Make sure this exists

const Dashboard: React.FC = () => {
  const [portfolio, setPortfolio] = useState([]);
  const token = localStorage.getItem('token');

  const refreshPortfolio = async () => {
    if (!token) return;
    const data = await getPortfolio(token);
    setPortfolio(data);
  };

  useEffect(() => {
    refreshPortfolio();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Portfolio portfolio={portfolio} refreshPortfolio={refreshPortfolio} />
            <StockSearch />
          </div>
          <div className="space-y-8">
            <PopularStocks />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
