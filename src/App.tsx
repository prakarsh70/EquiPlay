import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { useMatchStore } from './store/useMatchStore';
import { SetupView } from './components/setup/SetupView';
import { DashboardView } from './components/dashboard/DashboardView';
import { MatchHistoryView } from './components/history/MatchHistoryView';
import { SessionSummaryView } from './components/history/SessionSummaryView';

export const App: React.FC = () => {
  const currentView = useMatchStore((state) => state.currentView);

  const renderView = () => {
    switch (currentView) {
      case 'SETUP':
        return <SetupView />;
      case 'DASHBOARD':
        return <DashboardView />;
      case 'HISTORY':
        return <MatchHistoryView />;
      case 'SUMMARY':
        return <SessionSummaryView />;
      default:
        return <SetupView />;
    }
  };

  return (
    <>
      {renderView()}
      <Analytics />
    </>
  );
};

export default App;
