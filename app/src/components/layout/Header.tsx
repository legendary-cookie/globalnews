import { useState } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut,
  Globe,
  Zap,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useUIStore, useAuthStore } from '@/store';
import { useBreakingNews, useLogout } from '@/hooks';
import { formatDistanceToNow } from 'date-fns';

export function Header() {
  const { toggleSidebar, setSearchOpen, isSearchOpen, notifications, removeNotification } = useUIStore();
  const { isAuthenticated, user } = useAuthStore();
  const { data: breakingNews } = useBreakingNews();
  const logout = useLogout();
  const [searchQuery, setSearchQuery] = useState('');
  const [showBreakingBanner, setShowBreakingBanner] = useState(true);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      useUIStore.getState().setSearchQuery(searchQuery);
      useUIStore.getState().setActiveSection('news');
      setSearchOpen(false);
    }
  };

  const handleLogout = () => {
    logout.mutate();
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Breaking News Banner */}
      {breakingNews && breakingNews.length > 0 && showBreakingBanner && (
        <div className="breaking-pulse bg-red-600 text-white px-4 py-2 relative">
          <div className="flex items-center justify-between max-w-full">
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="flex items-center gap-1 font-bold text-sm whitespace-nowrap">
                <Zap className="w-4 h-4" />
                BREAKING
              </span>
              <div className="h-4 w-px bg-white/30" />
              <div className="flex gap-6 overflow-hidden">
                {breakingNews.slice(0, 3).map((news: any) => (
                  <span key={news.id} className="text-sm truncate flex items-center gap-2">
                    {news.headline || news.title}
                    <span className="text-white/60 text-xs">
                      {formatDistanceToNow(new Date(news.pushedAt || news.publishedAt), { addSuffix: true })}
                    </span>
                  </span>
                ))}
              </div>
            </div>
            <button 
              onClick={() => setShowBreakingBanner(false)}
              className="text-white/70 hover:text-white ml-4"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="h-16 glass border-b border-border/50 sticky top-0 z-50">
        <div className="h-full px-4 flex items-center justify-between gap-4">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="lg:flex"
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg hidden sm:block">
                <span className="gradient-text">Global</span> News
              </span>
            </a>
          </div>

          {/* Center Section - Search */}
          <div className="flex-1 max-w-xl">
            {isSearchOpen ? (
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="text"
                  placeholder="Search news, topics, sources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 bg-secondary/50 border-border"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full flex items-center gap-2 px-4 py-2 rounded-md bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Search className="w-4 h-4" />
                <span className="text-sm">Search news, topics, sources...</span>
              </button>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadNotifications}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground text-sm">
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notification) => (
                    <DropdownMenuItem 
                      key={notification.id}
                      onClick={() => removeNotification(notification.id)}
                      className="flex flex-col items-start gap-1 py-2"
                    >
                      <span className="font-medium text-sm">{notification.title}</span>
                      <span className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                      {user?.avatarUrl ? (
                        <img 
                          src={user.avatarUrl} 
                          alt={user.username} 
                          className="w-full h-full rounded-full"
                        />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="hidden sm:block text-sm font-medium">
                      {user?.username}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
