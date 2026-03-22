import { useState, useEffect } from 'react';
import { 
  Grid3X3, 
  List, 
  RefreshCw, 
  Flame,
  TrendingUp,
  Clock,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArticleCard } from './ArticleCard';
import { useNewsStore, useUIStore } from '@/store';
import { useNews, useInfiniteScroll } from '@/hooks';

const sortOptions = [
  { id: 'date', label: 'Latest', icon: Clock },
  { id: 'popularity', label: 'Popular', icon: TrendingUp },
  { id: 'breaking', label: 'Breaking', icon: Flame },
];

export function NewsFeed() {
  const { filters, setFilters, viewMode, setViewMode } = useNewsStore();
  const { searchQuery } = useUIStore();
  const [activeSort, setActiveSort] = useState<'date' | 'popularity' | 'breaking'>('date');
  const [page, setPage] = useState(1);
  
  const { data, isLoading, isError, error, refetch } = useNews(
    { ...filters, sortBy: activeSort, searchQuery: searchQuery || undefined },
    page,
    20
  );

  const articles = data?.data || [];
  const pagination = data?.pagination;

  // Load more for infinite scroll
  const loadMore = () => {
    if (pagination?.hasMore && !isLoading) {
      setPage(prev => prev + 1);
    }
  };

  const loadMoreRef = useInfiniteScroll(loadMore, pagination?.hasMore || false);

  // Reset page when filters or search change
  useEffect(() => {
    setPage(1);
  }, [filters, activeSort, searchQuery]);

  // Featured article (first breaking news or most popular)
  const featuredArticle = articles.find((a: any) => a.isBreaking) || articles[0];
  const regularArticles = articles.filter((a: any) => a.id !== featuredArticle?.id);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-red-500 mb-4">Failed to load news</div>
        <p className="text-muted-foreground mb-4">{error?.message}</p>
        <Button onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">News Feed</h1>
          <p className="text-sm text-muted-foreground">
            {pagination?.total?.toLocaleString() || 0} articles from multiple sources
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Tabs */}
          <Tabs value={activeSort} onValueChange={(v) => setActiveSort(v as 'date' | 'popularity' | 'breaking')}>
            <TabsList className="bg-secondary/50">
              {sortOptions.map((option) => (
                <TabsTrigger 
                  key={option.id} 
                  value={option.id}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <option.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{option.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* View Toggle */}
          <div className="flex items-center bg-secondary/50 rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                viewMode === 'grid' && "bg-background"
              )}
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                viewMode === 'list' && "bg-background"
              )}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {/* Refresh */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {(filters.categories?.length || filters.regions?.length || filters.sources?.length) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.categories?.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilters({ 
                categories: filters.categories?.filter(c => c !== cat) 
              })}
              className="px-2 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs flex items-center gap-1 hover:bg-orange-500/20 transition-colors"
            >
              {cat}
              <span className="text-orange-500/60">×</span>
            </button>
          ))}
          {filters.regions?.map((region) => (
            <button
              key={region}
              onClick={() => setFilters({ regions: [] })}
              className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs flex items-center gap-1 hover:bg-blue-500/20 transition-colors"
            >
              {region}
              <span className="text-blue-500/60">×</span>
            </button>
          ))}
          <button
            onClick={() => setFilters({ categories: [], regions: [], sources: [] })}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Content */}
      <div className="space-y-6">
        {/* Featured Article */}
        {featuredArticle && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Featured Story
            </h2>
            <ArticleCard 
              article={featuredArticle} 
              variant="featured" 
            />
          </section>
        )}

        {/* Article Grid/List */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Latest Stories
          </h2>
          
          {isLoading && articles.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {regularArticles.map((article: any) => (
                    <ArticleCard 
                      key={article.id} 
                      article={article} 
                      variant="default"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {regularArticles.map((article: any) => (
                    <ArticleCard 
                      key={article.id} 
                      article={article} 
                      variant="compact"
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {/* Load More */}
        {pagination?.hasMore && (
          <div 
            ref={loadMoreRef}
            className="flex justify-center py-8"
          >
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading more...</span>
              </div>
            ) : (
              <Button variant="outline" onClick={loadMore}>
                Load More
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
