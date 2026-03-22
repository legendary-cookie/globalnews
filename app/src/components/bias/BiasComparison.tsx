import { useState, useMemo, useEffect } from 'react';
import { Scale, Info, Shield, AlertTriangle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { newsApi, analyticsApi } from '@/services/api';
import type { Article } from '@/types';

interface LiveSource {
  id: string;
  name: string;
  logoUrl?: string;
  biasRating: number;
  reliabilityScore: number;
  category: string;
  articles: Article[];
}

export function BiasComparison() {
  const [sources, setSources] = useState<LiveSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reliabilityFilter, setReliabilityFilter] = useState([0, 100]);

  useEffect(() => {
    loadSourceData();
  }, []);

  async function loadSourceData() {
    setIsLoading(true);
    try {
      // Fetch articles + source stats in parallel
      const [articlesRes, statsRes] = await Promise.all([
        newsApi.getNews({ limit: 200 }),
        analyticsApi.getSourceStats().then(r => r.data).catch(() => ({ data: [] })),
      ]);

      const articles: Article[] = articlesRes.data?.data || [];
      const sourceStats: Array<{ id: string; name: string; reliabilityScore: number; biasRating: number }> =
        statsRes?.data || [];

      // Group articles by source
      const bySource: Record<string, Article[]> = {};
      articles.forEach(a => {
        const sid = a.sourceId;
        if (!bySource[sid]) bySource[sid] = [];
        bySource[sid].push(a);
      });

      // Merge source metadata from both articles and stats endpoint
      const sourceMap: Record<string, LiveSource> = {};
      articles.forEach(a => {
        const s = a.source;
        if (!s || !s.id) return;
        if (!sourceMap[s.id]) {
          sourceMap[s.id] = {
            id: s.id,
            name: s.name,
            logoUrl: s.logoUrl,
            biasRating: s.biasRating,
            reliabilityScore: s.reliabilityScore,
            category: a.category,
            articles: [],
          };
        }
        sourceMap[s.id].articles.push(a);
      });

      // Override with more accurate stats from analytics endpoint
      sourceStats.forEach(st => {
        if (sourceMap[st.id]) {
          sourceMap[st.id].reliabilityScore = st.reliabilityScore;
          sourceMap[st.id].biasRating = st.biasRating;
        }
      });

      const live = Object.values(sourceMap).filter(s => s.articles.length > 0);
      setSources(live);
    } catch (err) {
      console.error('BiasComparison load failed:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredSources = useMemo(() =>
    sources.filter(s =>
      s.reliabilityScore * 100 >= reliabilityFilter[0] &&
      s.reliabilityScore * 100 <= reliabilityFilter[1]
    ).sort((a, b) => a.biasRating - b.biasRating),
    [sources, reliabilityFilter]
  );

  const groupedByBias = useMemo(() => {
    const groups: Record<string, LiveSource[]> = {
      'far-left': [], 'left': [], 'lean-left': [], 'center': [],
      'lean-right': [], 'right': [], 'far-right': [],
    };
    filteredSources.forEach(s => {
      const cat = getBiasCategory(s.biasRating);
      groups[cat].push(s);
    });
    return groups;
  }, [filteredSources]);

  function getBiasCategory(r: number) {
    if (r <= -4) return 'far-left';
    if (r <= -2) return 'left';
    if (r <= -1) return 'lean-left';
    if (r === 0) return 'center';
    if (r <= 1) return 'lean-right';
    if (r <= 2) return 'right';
    return 'far-right';
  }
  function getBiasColor(r: number) {
    if (r <= -4) return '#8b0000'; if (r <= -2) return '#dc143c';
    if (r <= -1) return '#ff6b6b'; if (r === 0) return '#808080';
    if (r <= 1) return '#87ceeb'; if (r <= 2) return '#4169e1';
    return '#000080';
  }
  function getBiasLabel(r: number) {
    if (r <= -4) return 'Far Left'; if (r <= -2) return 'Left';
    if (r <= -1) return 'Lean Left'; if (r === 0) return 'Center';
    if (r <= 1) return 'Lean Right'; if (r <= 2) return 'Right';
    return 'Far Right';
  }
  function getReliabilityBadge(score: number) {
    if (score >= 0.92) return { label: 'Very High', color: 'text-green-500', icon: CheckCircle2 };
    if (score >= 0.85) return { label: 'High', color: 'text-green-400', icon: CheckCircle2 };
    if (score >= 0.75) return { label: 'Good', color: 'text-yellow-400', icon: Shield };
    if (score >= 0.65) return { label: 'Moderate', color: 'text-yellow-500', icon: AlertTriangle };
    return { label: 'Low', color: 'text-red-500', icon: AlertTriangle };
  }

  const biasCategories = [
    { id: 'far-left', label: 'Far Left', color: '#8b0000' },
    { id: 'left', label: 'Left', color: '#dc143c' },
    { id: 'lean-left', label: 'Lean Left', color: '#ff6b6b' },
    { id: 'center', label: 'Center', color: '#808080' },
    { id: 'lean-right', label: 'Lean Right', color: '#87ceeb' },
    { id: 'right', label: 'Right', color: '#4169e1' },
    { id: 'far-right', label: 'Far Right', color: '#000080' },
  ];

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading live source data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bias Comparison</h1>
          <p className="text-sm text-muted-foreground">
            {sources.length} live sources · {sources.reduce((s, src) => s + src.articles.length, 0)} articles analysed
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Reliability:</span>
            <Slider value={reliabilityFilter} max={100} step={10} onValueChange={setReliabilityFilter} className="w-32" />
            <span className="text-sm font-medium w-20">{reliabilityFilter[0]}%–{reliabilityFilter[1]}%</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={loadSourceData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Spectrum */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Political Spectrum (–5 Far Left → +5 Far Right)</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
              <TooltipContent><p className="max-w-xs text-xs">Bias ratings based on AllSides, Media Bias Fact Check, and MBFC methodology. Ratings range from –5 (Far Left) to +5 (Far Right). Center = 0.</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="relative h-8 rounded-full overflow-hidden flex">
          {biasCategories.map(cat => (
            <div key={cat.id} className="flex-1 flex items-center justify-center text-[10px] text-white font-medium" style={{ backgroundColor: cat.color }}>
              <span className="hidden sm:inline">{cat.label}</span>
            </div>
          ))}
        </div>
        <div className="flex mt-1">
          {biasCategories.map(cat => (
            <div key={cat.id} className="flex-1 text-center">
              <span className="text-xs text-muted-foreground">{groupedByBias[cat.id]?.length || 0}</span>
            </div>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-6 pb-6">
          {biasCategories.map(category => {
            const catSources = groupedByBias[category.id] || [];
            if (catSources.length === 0) return null;
            return (
              <div key={category.id}>
                <div className="flex items-center gap-2 mb-3 px-2 py-1 rounded" style={{ backgroundColor: `${category.color}15` }}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                  <h3 className="font-semibold" style={{ color: category.color }}>{category.label}</h3>
                  <Badge variant="secondary" className="ml-auto">{catSources.length} sources</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {catSources.map(source => {
                    const rel = getReliabilityBadge(source.reliabilityScore);
                    const RelIcon = rel.icon;
                    return (
                      <div key={source.id} className="bg-card border border-border/50 rounded-lg p-4 hover:border-orange-500/30 transition-colors">
                        <div className="flex items-start gap-3 mb-3">
                          {source.logoUrl ? (
                            <img src={source.logoUrl} alt={source.name} className="w-10 h-10 rounded object-contain bg-secondary p-1" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center flex-shrink-0">
                              <Scale className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{source.name}</h4>
                            <div className="flex items-center gap-1 mt-0.5">
                              <RelIcon className={cn('w-3 h-3', rel.color)} />
                              <span className="text-xs text-muted-foreground">{rel.label} ({(source.reliabilityScore * 100).toFixed(0)}%)</span>
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Bias</span>
                            <span style={{ color: getBiasColor(source.biasRating) }}>{getBiasLabel(source.biasRating)}</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full transition-all" style={{ width: `${((source.biasRating + 5) / 10) * 100}%`, backgroundColor: getBiasColor(source.biasRating) }} />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-xs text-muted-foreground">{source.articles.length} recent articles</p>
                          {source.articles.slice(0, 2).map(article => (
                            <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer"
                              className="block text-xs hover:text-orange-500 transition-colors line-clamp-2 text-muted-foreground hover:text-foreground">
                              {article.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredSources.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Scale className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No sources match the current reliability filter.</p>
              <p className="text-sm mt-1">Try lowering the minimum reliability threshold.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
