import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { NewsFeed } from '@/components/news/NewsFeed';
import { TVSection } from '@/components/tv/TVSection';
import { WorldMap } from '@/components/map/WorldMap';
import { BiasComparison } from '@/components/bias/BiasComparison';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { useUIStore, useAuthStore } from '@/store';
import { useWebSocket, useCurrentUser } from '@/hooks';
import { cn } from '@/lib/utils';
import './App.css';

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { activeSection, sidebarOpen, addNotification } = useUIStore();
  const { setUser, setAuthenticated, logout } = useAuthStore();
  
  // Load current user on mount
  const { data: user } = useCurrentUser();
  
  // WebSocket connection for real-time updates
  const { isConnected, lastMessage, subscribe } = useWebSocket();

  useEffect(() => {
    if (user) {
      setUser(user);
      setAuthenticated(true);
    }
  }, [user, setUser, setAuthenticated]);

  // Handle forced logout from token refresh failure
  useEffect(() => {
    const handleAuthLogout = () => {
      logout();
    };
    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, [logout]);

  // Subscribe to channels when connected
  useEffect(() => {
    if (isConnected) {
      subscribe('breaking-news');
      subscribe('news-feed');
      subscribe('viewer-update');
    }
  }, [isConnected, subscribe]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      const msg = lastMessage as { event: string; data: Record<string, unknown> };
      switch (msg.event) {
        case 'breaking_news':
          addNotification({
            id: `breaking-${Date.now()}`,
            type: 'error',
            title: 'Breaking News',
            message: String(msg.data?.headline || ''),
            timestamp: new Date().toISOString(),
            read: false,
          });
          queryClient.invalidateQueries({ queryKey: ['breaking-news'] });
          break;

        case 'new_article':
          addNotification({
            id: `article-${Date.now()}`,
            type: 'info',
            title: 'New Article',
            message: String(msg.data?.title || ''),
            timestamp: new Date().toISOString(),
            read: false,
          });
          queryClient.invalidateQueries({ queryKey: ['news'] });
          break;

        case 'viewer_update':
          queryClient.invalidateQueries({ queryKey: ['stream-stats'] });
          break;

        default:
          break;
      }
    }
  }, [lastMessage, addNotification]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Open search
      }
      // Ctrl/Cmd + / for shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        // Show shortcuts help
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderContent = () => {
    switch (activeSection) {
      case 'news':
        return <NewsFeed />;
      case 'tv':
        return <TVSection />;
      case 'map':
        return <WorldMap />;
      case 'bias':
        return <BiasComparison />;
      case 'analytics':
        return <AnalyticsDashboard />;
      default:
        return <NewsFeed />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Noise Overlay */}
      <div className="noise-overlay" />

      {/* Header */}
      <Header />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main 
        className={cn(
          "transition-all duration-300 pt-16",
          sidebarOpen ? "lg:ml-64" : "ml-0"
        )}
      >
        <div className="p-4 lg:p-6 min-h-[calc(100vh-4rem)]">
          {renderContent()}
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => useUIStore.getState().setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
