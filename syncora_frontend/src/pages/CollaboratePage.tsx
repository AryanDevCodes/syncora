import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Excalidraw, 
  MainMenu, 
  WelcomeScreen, 
  Footer,
  exportToBlob,
  exportToSvg,
  loadFromBlob,
  getSceneVersion,
  serializeAsJSON
} from '@excalidraw/excalidraw';
import type { 
  ExcalidrawImperativeAPI,
  AppState,
  BinaryFiles,
  LibraryItems 
} from '@excalidraw/excalidraw/types';
import { 

  Library,
  X,

} from 'lucide-react';
import { SubscriptionGuard } from '@/components/subscription/SubscriptionGuard';

import '@excalidraw/excalidraw/index.css';
import { Button } from '@/components/ui/button';

import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';

interface CollaborativeUser {
  id: string;
  name: string;
  avatar?: string;
  color: string;
}

interface ChatMessage {
  id: string;
  from: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'annotation' | 'file';
}

const CollaboratePage = () => {
  const { user } = useAuth();
  
  // Excalidraw API and State
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [initialData, setInitialData] = useState<any>(null);
  const [libraryItems, setLibraryItems] = useState<LibraryItems>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // UI state
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showLibraries, setShowLibraries] = useState(false);
  
  // Chat and collaboration state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [collaborativeUsers, setCollaborativeUsers] = useState<CollaborativeUser[]>([]);

  // Get room ID from URL
  const roomId = new URLSearchParams(window.location.search).get('roomId') || 'collab-room';

  // Load saved data and libraries from localStorage
  useEffect(() => {
    const loadSavedData = () => {
      try {
        // Load scene data
        const savedData = localStorage.getItem(`excalidraw-${roomId}`);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setInitialData({
            elements: parsed.elements || [],
            appState: {
              viewBackgroundColor: "#ffffff",
              ...parsed.appState
            },
            scrollToContent: true,
            libraryItems: parsed.libraryItems || []
          });
          console.log('[Excalidraw] Loaded saved data from localStorage');
        }

        // Load library items
        const savedLibrary = localStorage.getItem(`excalidraw-library-${roomId}`);
        if (savedLibrary) {
          const library = JSON.parse(savedLibrary);
          setLibraryItems(library);
          console.log('[Excalidraw] Loaded library items');
        }
      } catch (error) {
        console.error('[Excalidraw] Failed to load saved data:', error);
      }
    };

    loadSavedData();
  }, [roomId]);

  // Save library items
  const saveLibraryItems = useCallback((items: LibraryItems) => {
    try {
      localStorage.setItem(`excalidraw-library-${roomId}`, JSON.stringify(items));
      setLibraryItems(items);
    } catch (error) {
      console.error('[Excalidraw] Failed to save library:', error);
    }
  }, [roomId]);

  // Handle scene changes with debounced auto-save
  const handleChange = useCallback((
    elements: readonly ExcalidrawElement[], 
    appState: AppState, 
    files: BinaryFiles
  ) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        const dataToSave = {
          elements: elements,
          appState: {
            viewBackgroundColor: appState.viewBackgroundColor,
            theme: appState.theme,
            gridSize: appState.gridSize,
            currentItemStrokeColor: appState.currentItemStrokeColor,
            currentItemBackgroundColor: appState.currentItemBackgroundColor,
            currentItemFillStyle: appState.currentItemFillStyle,
            currentItemStrokeWidth: appState.currentItemStrokeWidth,
            currentItemStrokeStyle: appState.currentItemStrokeStyle,
            currentItemRoughness: appState.currentItemRoughness,
            currentItemOpacity: appState.currentItemOpacity,
            currentItemFontSize: appState.currentItemFontSize,
          },
          files: files,
          libraryItems: libraryItems
        };
        localStorage.setItem(`excalidraw-${roomId}`, JSON.stringify(dataToSave));
        console.log('[Excalidraw] Auto-saved to localStorage');
      } catch (error) {
        console.error('[Excalidraw] Failed to save:', error);
      }
    }, 500);
  }, [roomId, libraryItems]);

  // Handle library changes
  const handleLibraryChange = useCallback((items: LibraryItems) => {
    saveLibraryItems(items);
  }, [saveLibraryItems]);

  // Enhanced export handlers
  const handleExport = useCallback(async (format: 'png' | 'svg' | 'json' = 'json') => {
    if (!excalidrawAPI) {
      toast({
        title: 'Excalidraw not ready',
        description: 'Please wait for Excalidraw to initialize',
        variant: 'destructive'
      });
      return;
    }

    try {
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      
      switch (format) {
        case 'png':
          const blob = await exportToBlob({
            elements,
            appState,
            files: excalidrawAPI.getFiles(),
            mimeType: 'image/png',
            quality: 0.92,
          });
          
          const pngUrl = URL.createObjectURL(blob);
          const pngLink = document.createElement('a');
          pngLink.href = pngUrl;
          pngLink.download = `syncora-${roomId}-${Date.now()}.png`;
          document.body.appendChild(pngLink);
          pngLink.click();
          document.body.removeChild(pngLink);
          URL.revokeObjectURL(pngUrl);
          break;

        case 'svg':
          const svg = await exportToSvg({
            elements,
            appState,
            files: excalidrawAPI.getFiles(),
          });
          
          const svgBlob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
          const svgUrl = URL.createObjectURL(svgBlob);
          const svgLink = document.createElement('a');
          svgLink.href = svgUrl;
          svgLink.download = `syncora-${roomId}-${Date.now()}.svg`;
          document.body.appendChild(svgLink);
          svgLink.click();
          document.body.removeChild(svgLink);
          URL.revokeObjectURL(svgUrl);
          break;

        case 'json':
        default:
          const dataStr = serializeAsJSON(
            elements,
            appState,
            excalidrawAPI.getFiles(),
            'local'
          );
          
          const jsonBlob = new Blob([dataStr], { type: 'application/json' });
          const jsonUrl = URL.createObjectURL(jsonBlob);
          const jsonLink = document.createElement('a');
          jsonLink.href = jsonUrl;
          jsonLink.download = `syncora-${roomId}-${Date.now()}.excalidraw`;
          document.body.appendChild(jsonLink);
          jsonLink.click();
          document.body.removeChild(jsonLink);
          URL.revokeObjectURL(jsonUrl);
          break;
      }
      
      toast({
        title: 'Exported successfully',
        description: `Whiteboard exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('[Excalidraw] Export failed:', error);
      toast({
        title: 'Export failed',
        description: 'Could not export whiteboard data',
        variant: 'destructive'
      });
    }
  }, [excalidrawAPI, roomId]);

  // Import scene data
  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      const scene = await loadFromBlob(blob, null, null);
      
      if (excalidrawAPI) {
        excalidrawAPI.updateScene(scene);
        toast({
          title: 'Import successful',
          description: 'Scene imported successfully',
        });
      }
    } catch (error) {
      console.error('[Excalidraw] Import failed:', error);
      toast({
        title: 'Import failed',
        description: 'Could not import scene data',
        variant: 'destructive'
      });
    }
  }, [excalidrawAPI]);

  // Clear canvas
  const handleClearCanvas = useCallback(() => {
    if (excalidrawAPI) {
      excalidrawAPI.resetScene();
      toast({
        title: 'Canvas cleared',
        description: 'All elements have been removed',
      });
    }
  }, [excalidrawAPI]);

  // Chat handlers (unchanged)
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      from: user?.email?.split('@')[0] || 'You',
      content: chatInput,
      timestamp: new Date(),
      type: 'text'
    };

    setChatMessages(prev => [...prev, message]);
    setChatInput('');
  };

  // Save handler (unchanged)
  const handleSave = useCallback(() => {
    if (!excalidrawAPI) {
      toast({
        title: 'Excalidraw not ready',
        description: 'Please wait for Excalidraw to initialize',
        variant: 'destructive'
      });
      return;
    }

    try {
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      
      const dataToSave = {
        elements: elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          theme: appState.theme,
          gridSize: appState.gridSize
        },
        libraryItems: libraryItems
      };
      
      localStorage.setItem(`excalidraw-${roomId}`, JSON.stringify(dataToSave));
      
      toast({
        title: 'Saved successfully',
        description: 'Whiteboard has been saved to browser storage',
      });
    } catch (error) {
      console.error('[Excalidraw] Save failed:', error);
      toast({
        title: 'Save failed',
        description: 'Could not save whiteboard data',
        variant: 'destructive'
      });
    }
  }, [excalidrawAPI, roomId, libraryItems]);

  // Share handler (unchanged)
  const handleShare = useCallback(() => {
    const url = `${window.location.origin}${window.location.pathname}?roomId=${roomId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link copied',
      description: 'Share this link with collaborators',
    });
  }, [roomId]);

  return (
    <SubscriptionGuard feature="whiteboard_collaboration" requiredPlan="Professional">
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-gradient-to-br from-background via-background to-muted/10 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 gradient-mesh opacity-20 pointer-events-none" />
        
        <div className="relative z-10 flex-1 flex flex-col">
        

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Excalidraw */}
          <div className="flex-1 relative">
            <Excalidraw
              excalidrawAPI={(api) => setExcalidrawAPI(api)}
              initialData={initialData}
              onChange={handleChange}
              onLibraryChange={handleLibraryChange}
              libraryReturnUrl=""
              theme="light"
              name={`Syncora - ${roomId}`}
              UIOptions={{
                canvasActions: {
                  clearCanvas: true,
                  export: { saveFileToDisk: true },
                  loadScene: true,
                  saveToActiveFile: true,
                  toggleTheme: true
                }
              }}
            >
              <WelcomeScreen>
                <WelcomeScreen.Hints.MenuHint />
                <WelcomeScreen.Hints.ToolbarHint />
                <WelcomeScreen.Hints.HelpHint />
                <WelcomeScreen.Center>
                  <WelcomeScreen.Center.Logo />
                  <WelcomeScreen.Center.Heading>
                    Syncora Collaborative Whiteboard
                  </WelcomeScreen.Center.Heading>
                  <WelcomeScreen.Center.Menu>
                    <WelcomeScreen.Center.MenuItemLoadScene />
                    <WelcomeScreen.Center.MenuItemHelp />
                  </WelcomeScreen.Center.Menu>
                </WelcomeScreen.Center>
              </WelcomeScreen>
              
              <MainMenu>
                <MainMenu.DefaultItems.LoadScene />
                <MainMenu.DefaultItems.SaveToActiveFile />
                <MainMenu.DefaultItems.SaveAsImage />
                <MainMenu.DefaultItems.Help />
                <MainMenu.DefaultItems.ClearCanvas />
                <MainMenu.DefaultItems.ChangeCanvasBackground />
                <MainMenu.Separator />
                <MainMenu.Item onSelect={handleClearCanvas}>
                  Clear Canvas
                </MainMenu.Item>
                <MainMenu.Item onSelect={() => setShowLibraries(true)}>
                  Show Library
                </MainMenu.Item>
              </MainMenu>
              
            </Excalidraw>
          </div>

          {/* Libraries Panel */}
          {showLibraries && (
            <div className="w-80 border-l border-border bg-card/80 backdrop-blur-sm flex flex-col z-50">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold">Libraries</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowLibraries(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Your saved elements and shapes will appear here. 
                    Drag and drop to use them in your canvas.
                  </div>
                  
                  {libraryItems.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      <Library className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No library items yet</p>
                      <p className="text-xs">Save elements to build your library</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          </div>
        </div>
      </div>
    </SubscriptionGuard>
  );
};

export default CollaboratePage;