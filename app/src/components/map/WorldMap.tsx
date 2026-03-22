import { useState, useMemo, useEffect } from 'react';
import { Flame, TrendingUp, AlertTriangle, Filter, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { newsApi } from '@/services/api';
import type { NewsCategory } from '@/types';

interface MapPoint {
  id: string;
  region: string;
  latitude: number;
  longitude: number;
  intensity: number;
  articleCount: number;
  breakingCount: number;
  topArticle: { title: string; url: string; category: string } | null;
  category: NewsCategory;
}

const categoryColors: Record<string, string> = {
  politics: '#3b82f6', economy: '#10b981', technology: '#8b5cf6',
  'war-security': '#ef4444', climate: '#22c55e', business: '#f59e0b',
  science: '#06b6d4', society: '#ec4899', world: '#6b7280',
};

export function WorldMap() {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [intensityFilter, setIntensityFilter] = useState([0]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    loadMapPoints();
    const interval = setInterval(loadMapPoints, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function loadMapPoints() {
    try {
      const res = await newsApi.getNews({ limit: 200 });
      const articles = res.data?.data || [];

      // Group by region and compute hotspot stats
      const byRegion: Record<string, { articles: typeof articles; breaking: number }> = {};
      for (const a of articles) {
        if (!byRegion[a.region]) byRegion[a.region] = { articles: [], breaking: 0 };
        byRegion[a.region].articles.push(a);
        if (a.isBreaking) byRegion[a.region].breaking++;
      }

      const REGION_COORDS: Record<string, [number, number]> = {
        americas:    [39.5, -98.4],
        europe:      [51.2, 10.5],
        asia:        [34.0, 100.6],
        'middle-east': [30.1, 42.5],
        africa:      [1.7, 17.5],
        oceania:     [-25.3, 133.8],
        world:       [20.0, 0.0],
      };

      const hotspots: MapPoint[] = Object.entries(byRegion).map(([region, data]) => {
        const coords = REGION_COORDS[region] || [0, 0];
        const top = [...data.articles].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))[0];
        // Add small jitter so overlapping regions are visible
        const jitterLat = (Math.random() - 0.5) * 8;
        const jitterLng = (Math.random() - 0.5) * 12;
        return {
          id: `hotspot-${region}`,
          region,
          latitude: coords[0] + jitterLat,
          longitude: coords[1] + jitterLng,
          intensity: Math.min(10, Math.ceil(data.articles.length / 4)),
          articleCount: data.articles.length,
          breakingCount: data.breaking,
          topArticle: top ? { title: top.title, url: top.url, category: top.category } : null,
          category: (top?.category as NewsCategory) || 'world',
        };
      });

      setPoints(hotspots);
    } catch (err) {
      console.error('Map points fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredPoints = useMemo(() => points.filter(p => {
    if (p.intensity < intensityFilter[0]) return false;
    if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return false;
    return true;
  }), [points, intensityFilter, selectedCategories]);

  const stats = useMemo(() => ({
    totalArticles: filteredPoints.reduce((s, p) => s + p.articleCount, 0),
    breakingCount: filteredPoints.reduce((s, p) => s + p.breakingCount, 0),
    hotspots: filteredPoints.length,
  }), [filteredPoints]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">World News Map</h1>
          <p className="text-sm text-muted-foreground">Live global news coverage across {points.length} regions</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center"><p className="text-2xl font-bold">{stats.totalArticles}</p><p className="text-xs text-muted-foreground">Articles</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-red-500">{stats.breakingCount}</p><p className="text-xs text-muted-foreground">Breaking</p></div>
          <div className="text-center"><p className="text-2xl font-bold">{stats.hotspots}</p><p className="text-xs text-muted-foreground">Hotspots</p></div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={loadMapPoints} disabled={isLoading}>
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2"><Filter className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Filter:</span></div>
        {Object.entries(categoryColors).slice(0, 7).map(([cat, color]) => (
          <button key={cat} onClick={() => toggleCategory(cat)}
            className={cn('px-2 py-1 rounded-full text-xs font-medium transition-all', selectedCategories.includes(cat) ? 'ring-2 ring-offset-1 ring-offset-background' : 'opacity-60 hover:opacity-100')}
            style={{ backgroundColor: `${color}20`, color, '--tw-ring-color': color } as React.CSSProperties}>
            {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
          </button>
        ))}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground">Min intensity:</span>
          <Slider value={intensityFilter} max={10} step={1} onValueChange={setIntensityFilter} className="w-32" />
          <span className="text-sm font-medium w-4">{intensityFilter[0]}</span>
        </div>
      </div>

      <div className="flex-1 relative rounded-xl overflow-hidden border border-border/50 bg-[#0a0a0a]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
          </div>
        ) : (
          <div className="absolute inset-0">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'invert(1)' }} />

            {filteredPoints.map(point => {
              const x = ((point.longitude + 180) / 360) * 100;
              const y = ((90 - point.latitude) / 180) * 100;
              const size = 16 + point.intensity * 3;
              const color = categoryColors[point.category] || '#6b7280';
              return (
                <button key={point.id} onClick={() => setSelectedPoint(point)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: `${x}%`, top: `${y}%` }}>
                  {point.breakingCount > 0 && (
                    <span className="absolute inset-0 rounded-full animate-ping opacity-60" style={{ backgroundColor: color }} />
                  )}
                  <div className={cn('rounded-full flex items-center justify-center transition-all duration-300 hover:scale-125 hover:z-10', selectedPoint?.id === point.id && 'ring-2 ring-white scale-110')}
                    style={{ width: size, height: size, backgroundColor: color, boxShadow: `0 0 ${point.intensity * 2}px ${color}70` }}>
                    {point.breakingCount > 0 ? <Flame className="w-3 h-3 text-white" /> : <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                    <div className="bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      <span className="capitalize font-medium">{point.region.replace('-', ' ')}</span>
                      <span className="block text-white/60">{point.articleCount} articles</span>
                    </div>
                  </div>
                </button>
              );
            })}

            {selectedPoint && (
              <div className="absolute z-30 bg-card border border-border/50 rounded-lg p-4 shadow-xl max-w-xs"
                style={{ left: `${((selectedPoint.longitude + 180) / 360) * 100}%`, top: `${((90 - selectedPoint.latitude) / 180) * 100}%`, transform: 'translate(-50%, -120%)' }}>
                <button onClick={() => setSelectedPoint(null)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-secondary flex items-center justify-center hover:bg-destructive hover:text-white transition-colors">×</button>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColors[selectedPoint.category] }} />
                  <span className="text-xs text-muted-foreground uppercase capitalize">{selectedPoint.region.replace('-', ' ')}</span>
                  {selectedPoint.breakingCount > 0 && <Badge variant="destructive" className="h-4 text-[8px]">BREAKING</Badge>}
                </div>
                {selectedPoint.topArticle && (
                  <a href={selectedPoint.topArticle.url} target="_blank" rel="noopener noreferrer"
                    className="font-semibold text-sm mb-2 block hover:text-orange-500 transition-colors line-clamp-2">
                    {selectedPoint.topArticle.title}
                  </a>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{selectedPoint.articleCount} articles</span>
                  <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Intensity: {selectedPoint.intensity}/10</span>
                </div>
              </div>
            )}

            <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur border border-border/50 rounded-lg p-3">
              <h4 className="text-xs font-semibold mb-2">Category</h4>
              {Object.entries(categoryColors).slice(0, 5).map(([cat, color]) => (
                <div key={cat} className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs text-muted-foreground capitalize">{cat.replace('-', ' ')}</span>
                </div>
              ))}
            </div>

            <div className="absolute top-4 right-4 bg-card/90 backdrop-blur border border-border/50 rounded-lg p-3 max-w-[180px]">
              <h4 className="text-xs font-semibold mb-2">Top Regions</h4>
              {filteredPoints.sort((a, b) => b.articleCount - a.articleCount).slice(0, 5).map((p, i) => (
                <div key={p.id} className="flex items-center justify-between text-xs mb-1">
                  <span className="truncate flex-1 capitalize">{i + 1}. {p.region.replace('-', ' ')}</span>
                  <span className="text-muted-foreground ml-2">{p.articleCount}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
