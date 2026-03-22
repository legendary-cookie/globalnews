import { useState } from 'react';
import { 
  Newspaper, 
  Tv, 
  Map, 
  Scale, 
  BarChart3, 
  Bookmark, 
  History, 
  Settings,
  ChevronDown,
  ChevronRight,
  Flame,
  Globe,
  TrendingUp,
  Landmark,
  Cpu,
  Shield,
  Leaf,
  Briefcase,
  FlaskConical,
  Users,
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore, useNewsStore, useTVStore } from '@/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  section: 'news' | 'tv' | 'map' | 'bias' | 'analytics';
  badge?: string | number;
}

const mainNavItems: NavItem[] = [
  { id: 'news', label: 'News Feed', icon: Newspaper, section: 'news' },
  { id: 'tv', label: 'Live TV', icon: Tv, section: 'tv', badge: 'LIVE' },
  { id: 'map', label: 'World Map', icon: Map, section: 'map' },
  { id: 'bias', label: 'Bias Comparison', icon: Scale, section: 'bias' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, section: 'analytics' },
];

const categories = [
  { id: 'politics', name: 'Politics', icon: Landmark },
  { id: 'economy', name: 'Economy', icon: TrendingUp },
  { id: 'technology', name: 'Technology', icon: Cpu },
  { id: 'war-security', name: 'War & Security', icon: Shield },
  { id: 'climate', name: 'Climate', icon: Leaf },
  { id: 'business', name: 'Business', icon: Briefcase },
  { id: 'science', name: 'Science', icon: FlaskConical },
  { id: 'society', name: 'Society', icon: Users },
];

const regions = [
  { id: 'world', name: 'World', icon: Globe },
  { id: 'asia', name: 'Asia' },
  { id: 'europe', name: 'Europe' },
  { id: 'americas', name: 'Americas' },
  { id: 'middle-east', name: 'Middle East' },
  { id: 'africa', name: 'Africa' },
];

export function Sidebar() {
  const { sidebarOpen, activeSection, setActiveSection } = useUIStore();
  const { filters, setFilters, breakingNews } = useNewsStore();
  const { favoriteChannels } = useTVStore();
  const [expandedSections, setExpandedSections] = useState<string[]>(['categories', 'regions']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isSectionExpanded = (section: string) => expandedSections.includes(section);

  const handleCategoryClick = (categoryId: string) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(categoryId as any)
      ? currentCategories.filter(c => c !== categoryId)
      : [...currentCategories, categoryId as any];
    setFilters({ categories: newCategories });
  };

  const handleRegionClick = (regionId: string) => {
    setFilters({ regions: [regionId as any] });
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-16 bottom-0 z-40 glass border-r border-border/50 transition-all duration-300",
        sidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full"
      )}
    >
      <ScrollArea className="h-full">
        <div className="p-4 space-y-6">
          {/* Main Navigation */}
          <nav className="space-y-1">
            {mainNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.section)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  activeSection === item.section
                    ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <Badge 
                    variant="destructive" 
                    className="h-5 text-[10px] px-1.5 animate-pulse"
                  >
                    {item.badge}
                  </Badge>
                )}
              </button>
            ))}
          </nav>

          {/* Breaking News Quick Link */}
          {breakingNews.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Flame className="w-3 h-3 text-red-500" />
                Breaking News
              </div>
              <div className="space-y-1">
                {breakingNews.slice(0, 2).map((news) => (
                  <button
                    key={news.id}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors line-clamp-2"
                  >
                    {news.headline}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Categories Section */}
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('categories')}
              className="w-full flex items-center justify-between px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
            >
              <span>Categories</span>
              {isSectionExpanded('categories') ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
            
            {isSectionExpanded('categories') && (
              <div className="space-y-1">
                {categories.map((category) => {
                  const isActive = filters.categories?.includes(category.id as any);
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        isActive
                          ? "bg-orange-500/10 text-orange-500"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <category.icon className="w-4 h-4" />
                      <span>{category.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Regions Section */}
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('regions')}
              className="w-full flex items-center justify-between px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
            >
              <span>Regions</span>
              {isSectionExpanded('regions') ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
            
            {isSectionExpanded('regions') && (
              <div className="space-y-1">
                {regions.map((region) => {
                  const isActive = filters.regions?.includes(region.id as any);
                  return (
                    <button
                      key={region.id}
                      onClick={() => handleRegionClick(region.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        isActive
                          ? "bg-orange-500/10 text-orange-500"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      {region.icon && <region.icon className="w-4 h-4" />}
                      <span>{region.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* User Features */}
          <div className="space-y-2">
            <div className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              My Library
            </div>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                <Bookmark className="w-4 h-4" />
                <span>Saved Articles</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                <Heart className="w-4 h-4" />
                <span>Favorite Channels</span>
                {favoriteChannels.length > 0 && (
                  <Badge variant="secondary" className="ml-auto h-5 text-xs">
                    {favoriteChannels.length}
                  </Badge>
                )}
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                <History className="w-4 h-4" />
                <span>Reading History</span>
              </button>
            </div>
          </div>

          {/* Settings */}
          <div className="pt-4 border-t border-border/50">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
