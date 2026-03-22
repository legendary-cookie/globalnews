import { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Newspaper,
  Tv,
  Activity,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useDashboardAnalytics, useStreamStats, useSourceStats, useTrafficData, useTrendingAnalytics, useCategoriesDistribution } from '@/hooks';

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('24h');
  
  const { data: analytics, isLoading: isAnalyticsLoading } = useDashboardAnalytics(timeRange);
  const { data: streamStats, isLoading: isStreamLoading } = useStreamStats();
  const { data: sourceStats, isLoading: isSourceLoading } = useSourceStats();
  const { data: trafficData, isLoading: isTrafficLoading } = useTrafficData(timeRange);
  const { data: trendingTopics, isLoading: isTrendingLoading } = useTrendingAnalytics();
  const { data: categories, isLoading: isCategoriesLoading } = useCategoriesDistribution();

  const isLoading = isAnalyticsLoading && isStreamLoading && isSourceLoading && isTrafficLoading;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  // Derive change indicators from traffic trend (last vs previous period)
  const trafficArr = trafficData || [];
  const midpoint = Math.floor(trafficArr.length / 2);
  const prevUsers = trafficArr.slice(0, midpoint).reduce((s: number, d: any) => s + (d.users || 0), 0) || 1;
  const currUsers = trafficArr.slice(midpoint).reduce((s: number, d: any) => s + (d.users || 0), 0) || 1;
  const userChangePct = Math.round(((currUsers - prevUsers) / prevUsers) * 100);
  const userChangeTrend = userChangePct > 0 ? 'up' : userChangePct < 0 ? 'down' : 'stable';
  const userChangeStr = userChangePct > 0 ? `+${userChangePct}%` : userChangePct < 0 ? `${userChangePct}%` : '0%';

  const statsCards = [
    {
      title: 'Total Articles',
      value: analytics?.totalArticles?.toLocaleString() || '0',
      change: analytics?.totalSources ? `${analytics.totalSources} sources` : '—',
      trend: 'up',
      icon: Newspaper,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Views',
      value: analytics?.totalViews?.toLocaleString() || '0',
      change: userChangeStr,
      trend: userChangeTrend,
      icon: Eye,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Active Viewers',
      value: analytics?.totalViewers?.toLocaleString() || '0',
      change: analytics?.activeUsers ? `${analytics.activeUsers.toLocaleString()} users` : '—',
      trend: 'up',
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Live Channels',
      value: analytics?.activeStreams?.toString() || '0',
      change: 'streaming now',
      trend: 'stable',
      icon: Tv,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Breaking News',
      value: analytics?.breakingNewsCount?.toString() || '0',
      change: 'live alerts',
      trend: (analytics?.breakingNewsCount || 0) > 0 ? 'up' : 'stable',
      icon: Zap,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Avg. Uptime',
      value: `${analytics?.avgUptime?.toFixed(1) || '—'}%`,
      change: analytics?.avgUptime && analytics.avgUptime > 99 ? 'excellent' : 'good',
      trend: 'up',
      icon: Activity,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Real-time insights into news coverage and viewership
          </p>
        </div>

        <Tabs value={timeRange} onValueChange={setTimeRange}>
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="1h">1H</TabsTrigger>
            <TabsTrigger value="24h">24H</TabsTrigger>
            <TabsTrigger value="7d">7D</TabsTrigger>
            <TabsTrigger value="30d">30D</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-auto space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statsCards.map((stat) => (
            <Card key={stat.title} className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                  </div>
                  <div className={cn(
                    "flex items-center gap-0.5 text-xs",
                    stat.trend === 'up' ? 'text-green-500' : 
                    stat.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
                  )}>
                    {stat.trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
                    {stat.trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
                    {stat.change}
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Traffic Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trafficData || []}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff6b00" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ff6b00" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="time" stroke="#666" fontSize={12} tickFormatter={(val) => new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1a1a', 
                        border: '1px solid #333',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#ff6b00" 
                      fillOpacity={1} 
                      fill="url(#colorUsers)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="pageViews" 
                      stroke="#3b82f6" 
                      fillOpacity={0.1} 
                      fill="#3b82f6" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                News by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(categories || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1a1a', 
                        border: '1px solid #333',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {(categories || []).slice(0, 4).map((cat: any) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs text-muted-foreground">{cat.name}</span>
                    <span className="text-xs font-medium ml-auto">{cat.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Newspaper className="w-4 h-4" />
                Top Performing Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(sourceStats || []).slice(0, 5).map((source: any, index: number) => (
                  <div key={source.id} className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{source.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {source.viewCount.toLocaleString()} views
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={source.reliabilityScore * 100} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground w-10">
                          {(source.reliabilityScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Tv className="w-4 h-4" />
                Live Stream Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(streamStats || []).slice(0, 5).map((stream: any) => (
                  <div key={stream.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{stream.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {stream.viewerCount.toLocaleString()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {stream.uptimePercent}% uptime
                        </span>
                        <span>{stream.bitrate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trending Topics */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Trending Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(trendingTopics || []).map((topic: any) => (
                <div
                  key={topic.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                >
                  <span className="font-medium text-sm">{topic.name}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {topic.mentionCount.toLocaleString()}
                  </Badge>
                  <span className={cn(
                    "text-xs flex items-center gap-0.5",
                    topic.trendDirection === 'up' ? 'text-green-500' : 
                    topic.trendDirection === 'down' ? 'text-red-500' : 'text-muted-foreground'
                  )}>
                    {topic.trendDirection === 'up' && <ArrowUpRight className="w-3 h-3" />}
                    {topic.trendDirection === 'down' && <ArrowDownRight className="w-3 h-3" />}
                    {topic.trendPercentage}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
