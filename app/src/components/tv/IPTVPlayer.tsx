import { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  PictureInPicture,
  Settings,
  MonitorPlay,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useHLSPlayer, useStreamUrl } from '@/hooks';
import type { TVChannel } from '@/types';

interface IPTVPlayerProps {
  channel: TVChannel | null;
  className?: string;
  onError?: (error: string) => void;
}

export function IPTVPlayer({ channel, className, onError }: IPTVPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [selectedQuality, setSelectedQuality] = useState('auto');
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use the channel's direct stream URL — proxy is only needed for CORS-blocked streams
  // The backend /stream endpoint returns a proxy URL; we try direct first for lower latency
  const { data: streamData } = useStreamUrl(channel?.id || null);
  
  // Prefer direct streamUrl from channel object; fall back to proxy URL if provided
  const streamUrl = channel?.streamUrl || streamData?.streamUrl || null;

  const { isReady, error, quality, changeQuality } = useHLSPlayer(
    videoRef, 
    streamUrl
  );

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleVolumeChange = useCallback((value: number[]) => {
    if (!videoRef.current) return;
    
    const newVolume = value[0];
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, [isFullscreen]);

  const togglePiP = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  const qualityOptions = [
    { value: 'auto', label: 'Auto' },
    { value: '1080', label: '1080p' },
    { value: '720', label: '720p' },
    { value: '480', label: '480p' },
    { value: '360', label: '360p' },
  ];

  if (!channel) {
    return (
      <div 
        ref={containerRef}
        className={cn(
          "relative aspect-video bg-black rounded-lg flex items-center justify-center",
          className
        )}
      >
        <div className="text-center text-muted-foreground">
          <MonitorPlay className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Select a channel to start watching</p>
          <p className="text-sm">Choose from the channel list on the right</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative bg-black rounded-lg overflow-hidden group",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        autoPlay
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
      />

      {/* Loading State */}
      {!isReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading stream...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-lg font-medium text-white mb-1">Stream Error</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Channel Info Overlay */}
      <div className={cn(
        "absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {channel.logoUrl && (
              <img 
                src={channel.logoUrl} 
                alt={channel.name}
                className="w-10 h-10 rounded object-contain bg-white/10"
              />
            )}
            <div>
              <h3 className="font-semibold text-white">{channel.displayName || channel.name}</h3>
              {channel.currentProgram && (
                <p className="text-sm text-white/70">{channel.currentProgram}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="live-indicator">
              LIVE
            </Badge>
            <Badge variant="secondary" className="bg-black/50">
              {channel.viewerCount.toLocaleString()} viewers
            </Badge>
          </div>
        </div>
      </div>

      {/* Controls Overlay */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        <div className="h-1 bg-white/20 rounded-full overflow-hidden mb-4">
          <div className="h-full w-full bg-red-500 animate-pulse" />
        </div>
        <div className="flex justify-between text-xs text-white/60 mb-4">
          <span>LIVE</span>
          <span>{quality}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-white hover:bg-white/20"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="w-24"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {selectedQuality === 'auto' ? 'Auto' : `${selectedQuality}p`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {qualityOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => {
                      setSelectedQuality(option.value);
                      changeQuality(option.value === 'auto' ? -1 : parseInt(option.value));
                    }}
                  >
                    {option.label}
                    {selectedQuality === option.value && (
                      <span className="ml-auto text-orange-500">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-white hover:bg-white/20"
              onClick={togglePiP}
            >
              <PictureInPicture className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {!isPlaying && isReady && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 rounded-full bg-orange-500/90 flex items-center justify-center hover:bg-orange-500 transition-colors">
            <Play className="w-10 h-10 text-white ml-1" />
          </div>
        </div>
      )}
    </div>
  );
}
