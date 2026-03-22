import { useState } from 'react';
import { 
  Clock, 
  Eye, 
  Share2, 
  Bookmark, 
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Article } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'featured' | 'compact';
  showBias?: boolean;
  className?: string;
}

export function ArticleCard({ 
  article, 
  variant = 'default', 
  showBias = true,
  className 
}: ArticleCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const getBiasColor = (rating: number) => {
    if (rating <= -4) return 'bg-gradient-to-r from-red-800 to-red-600';
    if (rating <= -2) return 'bg-gradient-to-r from-red-600 to-red-400';
    if (rating <= -1) return 'bg-gradient-to-r from-red-400 to-orange-400';
    if (rating === 0) return 'bg-gradient-to-r from-gray-500 to-gray-400';
    if (rating <= 1) return 'bg-gradient-to-r from-blue-400 to-blue-500';
    if (rating <= 2) return 'bg-gradient-to-r from-blue-500 to-blue-700';
    return 'bg-gradient-to-r from-blue-700 to-blue-900';
  };

  const getBiasLabel = (rating: number) => {
    if (rating <= -4) return 'Far Left';
    if (rating <= -2) return 'Left';
    if (rating <= -1) return 'Lean Left';
    if (rating === 0) return 'Center';
    if (rating <= 1) return 'Lean Right';
    if (rating <= 2) return 'Right';
    return 'Far Right';
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'negative': return <TrendingDown className="w-3 h-3 text-red-500" />;
      default: return <Minus className="w-3 h-3 text-gray-500" />;
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved(!isSaved);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: article.title,
        url: article.url,
      });
    }
  };

  if (variant === 'featured') {
    return (
      <article 
        className={cn(
          "group relative overflow-hidden rounded-xl bg-card border border-border/50 card-glow cursor-pointer",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-video overflow-hidden">
          <img 
            src={article.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(article.id)}/800/450`} 
            alt={article.title}
            className={cn(
              "w-full h-full object-cover transition-transform duration-500",
              isHovered && "scale-105"
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {article.isBreaking && (
              <Badge className="bg-red-500 text-white animate-pulse">
                <Zap className="w-3 h-3 mr-1" />
                BREAKING
              </Badge>
            )}
            <Badge variant="secondary" className="capitalize">
              {article.category}
            </Badge>
          </div>

          {/* Source Info */}
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center gap-2 mb-2">
              {article.source.logoUrl && (
                <img 
                  src={article.source.logoUrl} 
                  alt={article.source.name}
                  className="w-6 h-6 rounded object-contain bg-white/10"
                />
              )}
              <span className="text-sm text-white/80">{article.source.name}</span>
              {showBias && (
                <div className={cn(
                  "px-2 py-0.5 rounded text-[10px] text-white font-medium",
                  getBiasColor(article.source.biasRating)
                )}>
                  {getBiasLabel(article.source.biasRating)}
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-white line-clamp-2 group-hover:text-orange-400 transition-colors">
              {article.title}
            </h2>
          </div>
        </div>

        <div className="p-4">
          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
            {article.summary}
          </p>

          {/* Key Facts */}
          {article.keyFacts && article.keyFacts.length > 0 && (
            <div className="mb-3 space-y-1">
              {article.keyFacts.slice(0, 2).map((fact, index) => (
                <div key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="w-1 h-1 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                  <span className="line-clamp-1">{fact}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {article.viewCount.toLocaleString()}
              </span>
              {article.sentimentLabel && (
                <span className="flex items-center gap-1">
                  {getSentimentIcon(article.sentimentLabel)}
                  <span className="capitalize">{article.sentimentLabel}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={handleSave}
              >
                <Bookmark className={cn(
                  "w-4 h-4",
                  isSaved && "fill-orange-500 text-orange-500"
                )} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article 
        className={cn(
          "group flex gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer",
          className
        )}
      >
        {article.imageUrl && (
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
            <img 
              src={article.imageUrl} 
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground">{article.source.name}</span>
            {showBias && (
              <div className={cn(
                "w-2 h-2 rounded-full",
                getBiasColor(article.source.biasRating)
              )} />
            )}
            {article.isBreaking && (
              <Badge variant="destructive" className="h-4 text-[8px] px-1">
                BREAKING
              </Badge>
            )}
          </div>
          <h3 className="text-sm font-medium line-clamp-2 group-hover:text-orange-500 transition-colors">
            {article.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
          </div>
        </div>
      </article>
    );
  }

  // Default variant
  return (
    <article 
      className={cn(
        "group relative overflow-hidden rounded-lg bg-card border border-border/50 hover:border-orange-500/30 transition-all duration-300 cursor-pointer",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex gap-4 p-4">
        {article.imageUrl && (
          <div className="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
            <img 
              src={article.imageUrl} 
              alt={article.title}
              className={cn(
                "w-full h-full object-cover transition-transform duration-300",
                isHovered && "scale-105"
              )}
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {article.source.logoUrl && (
              <img 
                src={article.source.logoUrl} 
                alt={article.source.name}
                className="w-4 h-4 rounded object-contain"
              />
            )}
            <span className="text-xs text-muted-foreground">{article.source.name}</span>
            {showBias && (
              <div className={cn(
                "px-1.5 py-0.5 rounded text-[9px] text-white font-medium",
                getBiasColor(article.source.biasRating)
              )}>
                {getBiasLabel(article.source.biasRating)}
              </div>
            )}
            <Badge variant="secondary" className="h-4 text-[9px] capitalize ml-auto">
              {article.category}
            </Badge>
          </div>
          
          <h3 className="font-medium line-clamp-2 group-hover:text-orange-500 transition-colors mb-1">
            {article.title}
          </h3>
          
          <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
            {article.summary}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {article.viewCount.toLocaleString()}
              </span>
              {article.readingTime && (
                <span>{article.readingTime} min read</span>
              )}
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={handleSave}
              >
                <Bookmark className={cn(
                  "w-3.5 h-3.5",
                  isSaved && "fill-orange-500 text-orange-500"
                )} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={handleShare}
              >
                <Share2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
