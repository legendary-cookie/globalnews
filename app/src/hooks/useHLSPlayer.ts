import { useState, useEffect, useRef, useCallback } from 'react';

export function useHLSPlayer(videoRef: React.RefObject<HTMLVideoElement | null>, streamUrl: string | null) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState<string>('auto');
  // Store the HLS *instance* (not the class) so we can call methods on it
  const hlsInstanceRef = useRef<InstanceType<typeof import('hls.js').default> | null>(null);

  useEffect(() => {
    if (!streamUrl || !videoRef.current) {
      setIsReady(false);
      return;
    }

    // Reset state for new stream
    setIsReady(false);
    setError(null);
    setQuality('auto');

    let destroyed = false;

    const initPlayer = async () => {
      try {
        const Hls = (await import('hls.js')).default;

        // Destroy any existing instance before creating a new one
        if (hlsInstanceRef.current) {
          hlsInstanceRef.current.destroy();
          hlsInstanceRef.current = null;
        }

        if (destroyed) return; // Component unmounted during async import

        const video = videoRef.current;
        if (!video) return;

        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 30,
            maxBufferLength: 20,
            maxMaxBufferLength: 120,
            liveSyncDurationCount: 3,
            liveMaxLatencyDurationCount: 10,
            // Tune for live streams
            manifestLoadingTimeOut: 10000,
            manifestLoadingMaxRetry: 3,
            levelLoadingTimeOut: 10000,
          });

          hlsInstanceRef.current = hls;

          hls.loadSource(streamUrl);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!destroyed) {
              setIsReady(true);
              setError(null);
              // Auto-play
              video.play().catch(() => {
                // Autoplay blocked — user will press play manually
              });
            }
          });

          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (destroyed) return;
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  // Try to recover network errors
                  hls.startLoad();
                  setError('Network error — retrying...');
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  setError('Media error — recovering...');
                  break;
                default:
                  hls.destroy();
                  hlsInstanceRef.current = null;
                  setError('Stream unavailable. Please try another channel.');
                  setIsReady(false);
                  break;
              }
            }
          });

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari native HLS
          video.src = streamUrl;
          video.addEventListener('loadedmetadata', () => {
            if (!destroyed) {
              setIsReady(true);
              setError(null);
            }
          }, { once: true });
          video.addEventListener('error', () => {
            if (!destroyed) setError('Stream unavailable.');
          }, { once: true });
        } else {
          setError('HLS is not supported in this browser.');
        }
      } catch (err) {
        if (!destroyed) {
          setError('Failed to initialize player.');
          console.error('HLS init error:', err);
        }
      }
    };

    initPlayer();

    return () => {
      destroyed = true;
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
    };
  }, [streamUrl]); // Re-run when streamUrl changes

  const changeQuality = useCallback((level: number) => {
    const hls = hlsInstanceRef.current as unknown as {
      currentLevel: number;
      levels: Array<{ height: number }>;
    } | null;
    if (!hls) return;

    if (level === -1) {
      hls.currentLevel = -1;
      setQuality('auto');
    } else {
      hls.currentLevel = level;
      setQuality(`${hls.levels[level]?.height || level}p`);
    }
  }, []);

  return { isReady, error, quality, changeQuality };
}
