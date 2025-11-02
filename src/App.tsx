import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Search } from './components/Search';
import { Profile } from './components/Profile';
import { loadDefaultFavorites } from './services/favoritesService';
import { generateDashboardRecommendations } from './services/dashboardService';

export default function App() {
  const [currentPage, setCurrentPage] = useState('Search');

  // Load favorites and dashboard recommendations immediately when app starts
  useEffect(() => {
    loadDefaultFavorites().catch(error => {
      console.error('Failed to preload favorites:', error);
    });
    
    generateDashboardRecommendations(['Japanese', 'Italian', 'Mexican', 'BBQ']).catch(error => {
      console.error('Failed to preload dashboard recommendations:', error);
    });
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Search':
        return <Search />;
      case 'My Profile':
        return <Profile />;
      default:
        return <Search />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      <main>{renderPage()}</main>
    </div>
  );
}
