import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Heart, 
  Tv,
  Globe,
  Signal,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTVStore } from '@/store';
import type { TVChannel } from '@/types';

interface ChannelListProps {
  channels: TVChannel[];
  onSelectChannel: (channel: TVChannel) => void;
  selectedChannelId?: string;
}

// Derived dynamically from the live channel list passed as props
const LANG_NAMES: Record<string, string> = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German', ar: 'Arabic',
  hi: 'Hindi', ru: 'Russian', zh: 'Chinese', tr: 'Turkish', ko: 'Korean',
  pt: 'Portuguese', it: 'Italian', ja: 'Japanese', ur: 'Urdu', fa: 'Persian',
  uk: 'Ukrainian', ca: 'Catalan', bn: 'Bengali',
};
const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', GB: 'United Kingdom', QA: 'Qatar', FR: 'France',
  DE: 'Germany', RU: 'Russia', CN: 'China', IN: 'India', TR: 'Turkey',
  AU: 'Australia', CA: 'Canada', JP: 'Japan', AR: 'Argentina', ES: 'Spain',
  IL: 'Israel', VE: 'Venezuela', KR: 'South Korea', UA: 'Ukraine',
  PK: 'Pakistan', IR: 'Iran', NG: 'Nigeria', ZA: 'South Africa',
};

export function ChannelList({ channels, onSelectChannel, selectedChannelId }: ChannelListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Build filter options from actual channel data
  const countries = Array.from(new Set(channels.map(c => c.countryCode).filter(Boolean)))
    .sort()
    .map(code => ({ code, name: COUNTRY_NAMES[code] || code }));
  const languages = Array.from(new Set(channels.map(c => c.languageCode).filter(Boolean)))
    .sort()
    .map(code => ({ code, name: LANG_NAMES[code] || code }));
  
  const { 
    favoriteChannels, 
    addFavoriteChannel, 
    removeFavoriteChannel 
  } = useTVStore();

  // Filter channels
  const filteredChannels = channels.filter((channel) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        channel.name.toLowerCase().includes(query) ||
        channel.displayName?.toLowerCase().includes(query) ||
        channel.category.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    if (selectedCountries.length > 0) {
      if (!selectedCountries.includes(channel.countryCode)) return false;
    }

    if (selectedLanguages.length > 0) {
      if (!selectedLanguages.includes(channel.languageCode)) return false;
    }

    if (showFavoritesOnly) {
      if (!favoriteChannels.includes(channel.id)) return false;
    }

    return true;
  });

  // Group channels by category
  const groupedChannels = filteredChannels.reduce((acc, channel) => {
    const category = channel.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(channel);
    return acc;
  }, {} as Record<string, TVChannel[]>);

  const toggleFavorite = (e: React.MouseEvent, channelId: string) => {
    e.stopPropagation();
    if (favoriteChannels.includes(channelId)) {
      removeFavoriteChannel(channelId);
    } else {
      addFavoriteChannel(channelId);
    }
  };

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 99) return 'text-green-500';
    if (uptime >= 95) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Tv className="w-5 h-5" />
            Channels
          </h2>
          <Badge variant="secondary">
            {filteredChannels.length}
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Country</span>
                {selectedCountries.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 text-[10px]">
                    {selectedCountries.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Select Countries</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {countries.map((country) => (
                <DropdownMenuCheckboxItem
                  key={country.code}
                  checked={selectedCountries.includes(country.code)}
                  onCheckedChange={(checked) => {
                    setSelectedCountries(prev => 
                      checked 
                        ? [...prev, country.code]
                        : prev.filter(c => c !== country.code)
                    );
                  }}
                >
                  {country.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Language</span>
                {selectedLanguages.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 text-[10px]">
                    {selectedLanguages.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Select Languages</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {languages.map((language) => (
                <DropdownMenuCheckboxItem
                  key={language.code}
                  checked={selectedLanguages.includes(language.code)}
                  onCheckedChange={(checked) => {
                    setSelectedLanguages(prev => 
                      checked 
                        ? [...prev, language.code]
                        : prev.filter(l => l !== language.code)
                    );
                  }}
                >
                  {language.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant={showFavoritesOnly ? 'default' : 'outline'}
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <Heart className={cn(
              "w-3.5 h-3.5",
              showFavoritesOnly && "fill-current"
            )} />
            <span className="hidden sm:inline">Favorites</span>
          </Button>
        </div>
      </div>

      {/* Channel List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {Object.entries(groupedChannels).map(([category, categoryChannels]) => (
            <div key={category}>
              <h3 className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {category}
              </h3>
              <div className="space-y-1">
                {categoryChannels.map((channel) => {
                  const isSelected = selectedChannelId === channel.id;
                  const isFavorite = favoriteChannels.includes(channel.id);

                  return (
                    <button
                      key={channel.id}
                      onClick={() => onSelectChannel(channel)}
                      className={cn(
                        "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all duration-200",
                        isSelected
                          ? "bg-orange-500/10 border border-orange-500/30"
                          : "hover:bg-secondary border border-transparent"
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {channel.logoUrl ? (
                          <img 
                            src={channel.logoUrl} 
                            alt={channel.name}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <Tv className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className={cn(
                            "font-medium text-sm truncate",
                            isSelected && "text-orange-500"
                          )}>
                            {channel.displayName || channel.name}
                          </span>
                          {channel.isPremium && (
                            <Badge variant="secondary" className="h-3 text-[8px]">
                              PRO
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <Globe className="w-3 h-3" />
                            {channel.countryCode}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Signal className={cn("w-3 h-3", getUptimeColor(channel.uptimePercent))} />
                            {channel.uptimePercent}%
                          </span>
                          <span>{channel.viewerCount.toLocaleString()} watching</span>
                        </div>
                        {channel.currentProgram && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {channel.currentProgram}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={(e) => toggleFavorite(e, channel.id)}
                        className={cn(
                          "p-1.5 rounded-full transition-colors",
                          isFavorite 
                            ? "text-red-500 hover:bg-red-500/10" 
                            : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                        )}
                      >
                        <Heart className={cn(
                          "w-4 h-4",
                          isFavorite && "fill-current"
                        )} />
                      </button>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredChannels.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No channels found</p>
              <p className="text-xs">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
