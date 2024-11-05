// src/components/Canvas/Canvas.tsx
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Fade
} from '@mui/material';
import { Close, Fullscreen, FullscreenExit } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { isYouTubeUrl, extractYouTubeId } from '../../utils/youtube';
import profImage from '../../assets/robo-prof.png';
import { SlideTransition } from '../../components/SlideTransition';
import { SlideContent } from '../SlideContent/SlideContent';  // Add this import
import { EventBus, EVENTS, UIEventType } from '../../events/CustomEvents';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface CanvasTab {
  id: string;
  title: string;
  type: 'video' | 'iframe' | 'slide' | 'image';  // Added 'slide'
  url: string;
  loading: boolean;
  youtubeId?: string;
  error?: string;
}

// Update the props interface:
interface CanvasProps {
  contentRequest: { title: string, url: string; type: 'video' | 'iframe' | 'slide' | 'image' } | null;
  onVideoComplete?: () => void;
}

const MAX_TABS = 8;

export const Canvas: React.FC<CanvasProps> = ({ contentRequest, onVideoComplete }) => {
  const { t } = useTranslation();
  const [tabs, setTabs] = useState<CanvasTab[]>([
    { id: 'content', title: t('content'), type: 'iframe', url: '', loading: false }
  ]);
  const [activeTab, setActiveTab] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Reference to the canvas container
  const rootRef = useRef<HTMLDivElement>(null);
  
  // Helper function to handle adding new content
  const handleNewContent = useCallback((content: { title: string, url: string; type: 'video' | 'iframe' | 'slide' | 'image' }) => {
    let newTab: CanvasTab;

    if (content.type === 'video' && isYouTubeUrl(content.url)) {
      const youtubeId = extractYouTubeId(content.url);
      if (youtubeId) {
        newTab = {
          id: `tab-${Date.now()}`,
          title: t('youtubePlayer'),
          type: 'video',
          url: content.url,
          loading: true,
          youtubeId
        };
      } else {
        newTab = {
          id: `tab-${Date.now()}`,
          title: t('error'),
          type: 'video',
          url: content.url,
          loading: false,
          error: t('invalidYoutubeUrl')
        };
      }
    } else {
      newTab = {
        id: `tab-${Date.now()}`,
        title: content.type === 'video' 
          ? t('videoPlayer') 
          : content.type === 'image' 
            ? content.title 
            : t('webContent'),
        type: content.type,
        url: content.url,
        loading: true
      };
    }

    setIsTransitioning(true);

          setTimeout(() => {
            setTabs(currentTabs => {
              let newTabs;
              if (currentTabs.length >= MAX_TABS) {
                // Remove oldest tab (except the first default tab)
                newTabs = [
                  currentTabs[0],
                  ...currentTabs.slice(2),
                  newTab
                ];
              } else {
                newTabs = [...currentTabs, newTab];
              }

              // Set the active tab to the new tab's index immediately
              // We can calculate this because we know the new tabs array
              const newActiveTab = newTabs.length - 1;
              setTimeout(() => setActiveTab(newActiveTab), 0);

              return newTabs;
            });

            setTimeout(() => {
              setIsTransitioning(false);

              setTimeout(() => {
                setTabs(current =>
                  current.map((tab) =>
                    tab.id === newTab.id ? { ...tab, loading: false } : tab
                  )
                );
        }, 1500);
      }, 300);
    }, 300);
  }, [t, tabs.length]);


  useEffect(() => {
    if (contentRequest) {
      handleNewContent(contentRequest);
    }
  }, [contentRequest, handleNewContent]);

  
  useEffect(() => {
    // Subscribe to UI commands
    const unsubscribe = EventBus.getInstance().subscribe(
      EVENTS.UI_COMMAND,
      (event: CustomEvent<UIEventType>) => {
        const { cmd, title, url, type } = event.detail;
        console.log('Received UI command:', event.detail);

        // Only handle ui_showSlide commands
        if (cmd === 'ui_showSlide' && url) {
          // Map the command to a content type
          handleNewContent({ title, url, type: "image" });
        }
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleClose = (event: React.MouseEvent, index: number) => {
    event.stopPropagation();

    if (tabs.length > 1 && index !== 0) { // Prevent closing the first tab
      setTabs(current => current.filter((_, idx) => idx !== index));
      if (activeTab >= index && activeTab > 0) {
        setActiveTab(activeTab - 1);
      }
    }
  };

  const handleVideoEnded = () => {
    console.log('[Canvas] Video ended event triggered');
    if (onVideoComplete) {
      console.log('[Canvas] Calling video complete callback');
      onVideoComplete();
    } else {
        console.log('[Canvas] No video complete callback found');
    }
  };

  const handleToggleFullscreen = useCallback(async () => {
    console.log('[Canvas] Toggle fullscreen clicked');

    // Get the outer container element
    const canvasContainer = document.getElementsByClassName('canvas-container')[0];
    if (!canvasContainer) {
      console.warn('[Canvas] Canvas container not found');
      return;
    }

    try {
      if (!document.fullscreenElement) {
        console.log('[Canvas] Entering fullscreen');
        await canvasContainer.requestFullscreen();
      } else {
        console.log('[Canvas] Exiting fullscreen');
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('[Canvas] Error toggling fullscreen:', error);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  
  const YouTubePlayer: React.FC<{ videoId: string, onEnded?: () => void }> = ({ videoId, onEnded }) => {
    const playerRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
      // Load the YouTube IFrame API
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      // Initialize player when API is ready
      let player: YT.Player;

      const onYouTubeIframeAPIReady = () => {
        player = new YT.Player(playerRef.current!, {
          events: {
            onStateChange: (event) => {
              // YT.PlayerState.ENDED = 0
              if (event.data === 0 && onEnded) {
                console.log('[YouTube Player] Video ended');
                onEnded();
              }
            }
          }
        });
      };

      // Add to window for YouTube API to call
      (window as any).onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

      return () => {
        // Cleanup
        if (player) {
          player.destroy();
        }
      };
    }, [onEnded]);

    return (
      <iframe
        ref={playerRef}
        id={`youtube-${videoId}`}
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube video player"
      />
    );
  };

  // Add type definitions for the YouTube IFrame API
  declare global {
    interface Window {
      YT: {
        Player: new (
          element: HTMLIFrameElement | string,
          config: {
            events: {
              onStateChange: (event: { data: number }) => void;
            };
          }
        ) => {
          destroy: () => void;
        };
      };
      onYouTubeIframeAPIReady: () => void;
    }
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        boxShadow: 2,
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'  
        }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ flex: 1 }} 
        >
          {tabs.map((tab, index) => (
            <Tab
              key={tab.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography component="span" sx={{ mr: 1 }}>
                    {tab.title}
                  </Typography>
                  {index !== 0 && tabs.length > 1 && (
                    <span  // Changed from IconButton to span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClose(e, index);
                      }}
                      style={{
                        cursor: 'pointer',
                        marginLeft: '4px',
                        display: 'inline-flex',
                        padding: '2px',
                      }}
                    >
                      <Close fontSize="small" />
                    </span>
                  )}
                </Box>
              }
            />
          ))}
        </Tabs>
        {/* Fullscreen Button */}
        <IconButton 
          onClick={handleToggleFullscreen}
          size= "small"
          sx={{ 
            mr: 1,
            color: 'black',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {tabs.map((tab, index) => (
          <Fade 
            key={tab.id}
            in={activeTab === index && !isTransitioning}
            timeout={300}
          >
            <Box
              role="tabpanel"
              hidden={activeTab !== index}
              sx={{
                height: '100%',
                width: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            >
              {tab.loading ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    gap: 2
                  }}
                >
                  <CircularProgress />
                  <Typography color="text.secondary">
                    {tab.type === 'video' ? t('loadingVideo') : t('loadingWebpage')}
                  </Typography>
                </Box>
              ) : tab.error ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    p: 2
                  }}
                >
                  <Alert severity="error">{tab.error}</Alert>
                </Box>
              ) : tab.url ? (
                  <SlideTransition in={!isTransitioning}>
                  <Box sx={{ 
                    width: '100%', 
                    height: '100%',
                    backgroundColor: 'white'
                  }}>
                    {tab.type === 'image' ? (
                      <Box sx={{ 
                        width: '100%', 
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'white'
                      }}>
                        <img 
                          src={tab.url} 
                          alt="Content"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      </Box>
                    ) : tab.type === 'slide' ? (
                      <Fade in={!tab.loading} timeout={300}>
                        <Box sx={{ width: '100%', height: '100%' }}>
                            <SlideContent url={tab.url} />
                        </Box>
                      </Fade>
                    ) : tab.type === 'video' ? (
                      tab.youtubeId ? (
                        <YouTubePlayer 
                          videoId={tab.youtubeId} 
                          onEnded={handleVideoEnded} />
                      ) : (
                        <video
                          controls
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                          }}
                          onEnded={handleVideoEnded}
                        >
                          <source src={tab.url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      )
                    ) : (
                      <iframe
                        src={tab.url}
                        style={{
                          width: '100%',
                          height: '100%',
                          border: 'none',
                        }}
                        title={tab.title}
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                      />
                    )}
                  </Box>
                  </SlideTransition>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    color: 'text.secondary',
                  }}
                >
                   <img src={profImage} style={{ height: '80%'}} alt="No content" />
                </Box>
              )}
            </Box>
          </Fade>
        ))}
      </Box>
    </Box>
  );
};