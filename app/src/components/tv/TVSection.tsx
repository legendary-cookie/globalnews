import { useState } from 'react';
import { 
  LayoutGrid, 
  Maximize2, 
  Monitor,
  X,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IPTVPlayer } from './IPTVPlayer';
import { ChannelList } from './ChannelList';
import { useChannels } from '@/hooks';
import type { TVChannel } from '@/types';

export function TVSection() {
  const [selectedChannel, setSelectedChannel] = useState<TVChannel | null>(null);
  const [layout, setLayout] = useState<'single' | '2x2' | '3x3'>('single');
  const [activeChannels, setActiveChannels] = useState<TVChannel[]>([]);
  
  const { data: channels, isLoading } = useChannels();

  const handleSelectChannel = (channel: TVChannel) => {
    setSelectedChannel(channel);
    
    if (layout === 'single') {
      setActiveChannels([channel]);
    } else {
      setActiveChannels(prev => {
        if (prev.find(c => c.id === channel.id)) return prev;
        if (prev.length >= (layout === '2x2' ? 4 : 9)) {
          return [...prev.slice(0, -1), channel];
        }
        return [...prev, channel];
      });
    }
  };

  const removeChannel = (channelId: string) => {
    setActiveChannels(prev => prev.filter(c => c.id !== channelId));
    if (selectedChannel?.id === channelId) {
      setSelectedChannel(null);
    }
  };

  const getLayoutClass = () => {
    switch (layout) {
      case '2x2':
        return 'grid-cols-2 grid-rows-2';
      case '3x3':
        return 'grid-cols-3 grid-rows-3';
      default:
        return 'grid-cols-1';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Live TV</h1>
          <p className="text-sm text-muted-foreground">
            Watch live news from {channels?.length || 0} channels around the world
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={layout} onValueChange={(v) => setLayout(v as any)}>
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="single" className="flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Single</span>
              </TabsTrigger>
              <TabsTrigger value="2x2" className="flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">2×2</span>
              </TabsTrigger>
              <TabsTrigger value="3x3" className="flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">3×3</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Player Area */}
        <div className="flex-1 min-w-0">
          {layout === 'single' ? (
            <IPTVPlayer 
              channel={selectedChannel}
              className="w-full h-full min-h-[400px]"
            />
          ) : (
            <div className={cn(
              "grid gap-2 h-full",
              getLayoutClass()
            )}>
              {Array.from({ length: layout === '2x2' ? 4 : 9 }).map((_, index) => {
                const channel = activeChannels[index];
                return (
                  <div 
                    key={index}
                    className="relative bg-black rounded-lg overflow-hidden"
                  >
                    {channel ? (
                      <>
                        <IPTVPlayer 
                          channel={channel}
                          className="w-full h-full"
                        />
                        <button
                          onClick={() => removeChannel(channel.id)}
                          className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-red-500/80 transition-colors z-10"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <Monitor className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Select a channel</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Channel List Sidebar */}
        <div className="w-80 hidden lg:block border-l border-border/50">
          <ChannelList 
            channels={channels || []}
            onSelectChannel={handleSelectChannel}
            selectedChannelId={selectedChannel?.id}
          />
        </div>
      </div>
    </div>
  );
}
