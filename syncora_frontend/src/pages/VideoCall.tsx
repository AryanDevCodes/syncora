import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Loader2, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import ZegoCloudVideoCall from "@/components/video/ZegoCloudVideoCall";
import { useZegoCloudCall } from "@/hooks/useZegoCloudCall";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { saveCallHistory, getCallStats } from "@/api/videoHistoryApi";

export default function VideoCallPage(): JSX.Element {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const roomIdFromUrl = searchParams.get('roomId');
  
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [totalUsedSeconds, setTotalUsedSeconds] = useState<number>(0); // Total time used this week
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);
  const lastCallDataRef = useRef<{ startTime: number; duration: number; roomId: string } | null>(null);
  
  const {
    isInCall,
    roomId,
    isInitiating,
    error,
    startCall,
    endCall,
    clearError,
  } = useZegoCloudCall({
    autoCleanup: true,
    onCallEnd: () => {
      console.log('[VideoCallPage] Call ended');
      handleCallEnd();
    },
  });

  const [inputRoomId, setInputRoomId] = useState<string>(roomIdFromUrl || "demo-chat-room");
  
  // Get video call duration limit (in minutes)
  const videoDurationLimit = subscription?.plan?.videoCallDurationMinutes || 0;
  const hasTimeLimit = videoDurationLimit > 0 && videoDurationLimit !== -1;
  const timeLimitSeconds = hasTimeLimit ? videoDurationLimit * 60 : 0;
  
  // Fetch total used time on mount
  useEffect(() => {
    const fetchStats = async () => {
      if (hasTimeLimit) {
        setIsLoadingStats(true);
        try {
          const stats = await getCallStats();
          setTotalUsedSeconds(stats.totalSecondsThisWeek);
          console.log('[VideoCall] Total used this week:', stats.totalSecondsThisWeek, 'seconds');
        } catch (error) {
          console.error('[VideoCall] Failed to fetch call stats:', error);
          setTotalUsedSeconds(0);
        } finally {
          setIsLoadingStats(false);
        }
      }
    };
    
    fetchStats();
  }, [hasTimeLimit]);
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate remaining time - this will recalculate every time elapsedTime changes
  const remainingTime = React.useMemo(() => {
    if (!hasTimeLimit) return 0;
    
    // Calculate total time used including current call
    const totalUsedIncludingCurrent = totalUsedSeconds + elapsedTime;
    const remaining = Math.max(0, timeLimitSeconds - totalUsedIncludingCurrent);
    
    console.log('[VideoCall] Timer update - elapsed:', elapsedTime, 'totalUsed:', totalUsedSeconds, 'remaining:', remaining);
    return remaining;
  }, [hasTimeLimit, timeLimitSeconds, elapsedTime, totalUsedSeconds]);
  
  const remainingMinutes = Math.floor(remainingTime / 60);
  
  // Check if user has exceeded their monthly limit before starting call
  const hasExceededLimit = hasTimeLimit && totalUsedSeconds >= timeLimitSeconds;
  const canStartCall = !hasExceededLimit;
  
  // Handle call end - cleanup timers and save history
  const handleCallEnd = useCallback(async () => {
    console.log('[VideoCall] handleCallEnd called - callStartTime:', callStartTime, 'roomId:', roomId, 'elapsedTime:', elapsedTime);
    console.log('[VideoCall] lastCallDataRef:', lastCallDataRef.current);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Use ref data if state is already cleared
    const callData = lastCallDataRef.current || {
      startTime: callStartTime,
      duration: elapsedTime,
      roomId: roomId
    };
    
    const duration = callData.duration;
    const savedRoomId = callData.roomId;
    
    if (duration > 0 && savedRoomId) {
      const endTime = Date.now();
      const startTime = callData.startTime || (endTime - duration * 1000);
      const totalUsedIncludingCurrent = totalUsedSeconds + duration;
      const wasLimitReached = hasTimeLimit && totalUsedIncludingCurrent >= timeLimitSeconds;
      
      console.log('[VideoCall] Saving call history - duration:', duration, 'seconds, roomId:', savedRoomId);
      
      try {
        await saveCallHistory({
          roomId: savedRoomId,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          durationSeconds: duration,
          wasLimitReached: wasLimitReached
        });
        console.log('[VideoCall] Call history saved:', { duration, wasLimitReached });
        
        // Update total used time and clear ref
        setTotalUsedSeconds(prev => prev + duration);
        lastCallDataRef.current = null;
      } catch (error) {
        console.error('[VideoCall] Failed to save call history:', error);
      }
    } else {
      console.log('[VideoCall] Skipping call history save - duration:', duration, 'roomId:', savedRoomId);
    }
    
    setCallStartTime(null);
    setElapsedTime(0);
    setShowTimeWarning(false);
    warningShownRef.current = false;
  }, [callStartTime, roomId, hasTimeLimit, timeLimitSeconds, totalUsedSeconds]);
  
  // Start timer when call starts
  useEffect(() => {
    if (isInCall && !callStartTime && roomId) {
      console.log('[VideoCall] Starting timer, hasTimeLimit:', hasTimeLimit, 'limit:', videoDurationLimit);
      const startTime = Date.now();
      setCallStartTime(startTime);
      setElapsedTime(0);
      warningShownRef.current = false;
      
      // Initialize ref with call data
      lastCallDataRef.current = {
        startTime: startTime,
        duration: 0,
        roomId: roomId
      };
      console.log('[VideoCall] Initialized lastCallDataRef:', lastCallDataRef.current);
      
      console.log('[VideoCall] Creating interval');
      // Update elapsed time every second
      const intervalId = setInterval(() => {
        console.log('[VideoCall] Timer tick');
        setElapsedTime(prev => {
          const newElapsed = prev + 1;
          console.log('[VideoCall] Elapsed time:', newElapsed);
          
          // Update ref duration continuously
          if (lastCallDataRef.current) {
            lastCallDataRef.current.duration = newElapsed;
          }
          
          // Only check time limits if they exist
          if (hasTimeLimit) {
            // Calculate remaining time based on total usage (this month + current call)
            const totalUsedIncludingCurrent = totalUsedSeconds + newElapsed;
            const remaining = timeLimitSeconds - totalUsedIncludingCurrent;
            
            console.log('[VideoCall] Total used (including current):', totalUsedIncludingCurrent, 'Remaining:', remaining);
            
            // Show warning at 5 minutes remaining
            if (remaining === 300 && !warningShownRef.current) {
              warningShownRef.current = true;
              setShowTimeWarning(true);
              toast({
                title: "5 Minutes Remaining",
                description: "You have 5 minutes left this week. Upgrade to Professional for unlimited calls.",
                variant: "default",
              });
            }
            
            // Show warning at 1 minute remaining
            if (remaining === 60) {
              toast({
                title: "1 Minute Remaining",
                description: "Your weekly limit is almost reached.",
                variant: "destructive",
              });
            }
            
            // End call when time limit reached
            if (remaining <= 0) {
              toast({
                title: "Weekly Call Limit Reached",
                description: `You've used all ${videoDurationLimit} minutes this week. Upgrade to Professional for unlimited calls.`,
                variant: "destructive",
              });
              endCall();
              return newElapsed;
            }
          }
          
          return newElapsed;
        });
      }, 1000);
      
      timerRef.current = intervalId;
      console.log('[VideoCall] Interval created:', intervalId);
    }
    
    // Clean up timer when call ends
    if (!isInCall && timerRef.current) {
      console.log('[VideoCall] Cleaning up timer, lastCallDataRef:', lastCallDataRef.current);
      clearInterval(timerRef.current);
      timerRef.current = null;
      setCallStartTime(null);
      setElapsedTime(0);
      setShowTimeWarning(false);
      warningShownRef.current = false;
    }
  }, [isInCall, callStartTime]);

  useEffect(() => {
    if (roomIdFromUrl && !isInCall && !isInitiating) {
      console.log('[VideoCallPage] Auto-joining room from URL:', roomIdFromUrl);
      startCall(roomIdFromUrl).catch(err => {
        console.error('[VideoCallPage] Error auto-joining:', err);
      });
    }
  }, [roomIdFromUrl, isInCall, isInitiating]);

  const startVideoCall = async () => {
    if (!inputRoomId.trim()) return;

    try {
      await startCall(inputRoomId);
    } catch (err) {
      console.error('[VideoCallPage] Error starting call:', err);
    }
  };

  const endVideoCall = async () => {
    try {
      await endCall();
    } catch (err) {
      console.error('[VideoCallPage] Error ending call:', err);
    }
  };

  return (
    <div className="h-full flex flex-col p-1  bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0 "> {/* Crucial: min-h-0 prevents overflow */}
          {isInCall && roomId ? (
          <div 
            className="flex-1 flex flex-col bg-gray-900 rounded-xl p-4 min-h-0"
            style={{
              maxHeight: '100vh', 
              minHeight: '500px'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white">
                  In Call: <span className="text-blue-300">{roomId}</span>
                </h2>
                <div className="text-sm text-gray-400 mt-1">
                  Share this room ID: <span className="font-mono text-white">{roomId}</span>
                </div>
              </div>
              
              {/* Time Limit Indicator for STARTER plan */}
              {hasTimeLimit && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  remainingMinutes <= 1 ? 'bg-red-500/20 border border-red-500' :
                  remainingMinutes <= 5 ? 'bg-yellow-500/20 border border-yellow-500' :
                  'bg-blue-500/20 border border-blue-500'
                }`}>
                  <Clock className={`w-5 h-5 ${
                    remainingMinutes <= 1 ? 'text-red-400' :
                    remainingMinutes <= 5 ? 'text-yellow-400' :
                    'text-blue-400'
                  }`} />
                  <div className="text-right">
                    <div className={`text-lg font-bold font-mono ${
                      remainingMinutes <= 1 ? 'text-red-400' :
                      remainingMinutes <= 5 ? 'text-yellow-400' :
                      'text-blue-400'
                    }`}>
                      {formatTime(remainingTime)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {videoDurationLimit} min limit
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Warning Banner */}
            {showTimeWarning && remainingMinutes <= 5 && (
              <Alert className="mb-3 border-yellow-500 bg-yellow-500/10">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <AlertTitle className="text-yellow-400">Time Limit Warning</AlertTitle>
                <AlertDescription className="text-gray-300">
                  Your call will end in {remainingMinutes} minute{remainingMinutes !== 1 ? 's' : ''}. 
                  Upgrade to Professional for unlimited video calls.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Video Container with STRICT constraints */}
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden">
              <ZegoCloudVideoCall
                roomId={roomId}
                userId={(user?.id ? String(user?.id) : undefined) || user?.email.replace(/[^a-zA-Z0-9]/g, '') || `user_${Date.now()}`}
                userName={user?.email || `Guest_${Date.now()}`}
                onCallEnd={endVideoCall}
                className="w-full h-full"
                minHeight="400px"
                maxHeight="100%" // Will respect parent's maxHeight
              />
            </div>
          </div>
        ) : (
          /* Start Call Interface */
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-center text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Start Video Call
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Monthly limit exceeded warning */}
                {hasExceededLimit && (
                  <Alert className="border-red-500 bg-red-500/10">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <AlertTitle className="text-red-400">Monthly Limit Reached</AlertTitle>
                    <AlertDescription className="text-gray-300">
                      You've used all {videoDurationLimit} minutes this week. 
                      Upgrade to Professional for unlimited video calls or wait until next week.
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Time Limit Notice for STARTER plan */}
                {hasTimeLimit && !hasExceededLimit && (
                  <Alert className="border-blue-500 bg-blue-500/10">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <AlertTitle className="text-blue-400">Weekly Call Limit</AlertTitle>
                    <AlertDescription className="text-gray-300">
                      <div className="space-y-2">
                        <div>
                          Total limit: {videoDurationLimit} minutes/week
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Used this week:</span>
                          <span className="font-bold text-blue-300">
                            {Math.floor(totalUsedSeconds / 60)} min {totalUsedSeconds % 60} sec
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Remaining:</span>
                          <span className="font-bold text-green-300">
                            {formatTime(timeLimitSeconds - totalUsedSeconds)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                          Upgrade to Professional for unlimited call duration.
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                {error && (
                  <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={clearError} className="text-red-200 hover:text-white ml-2">
                      ✕
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Room ID
                    </label>
                    <input
                      type="text"
                      value={inputRoomId}
                      onChange={(e) => setInputRoomId(e.target.value)}
                      placeholder="Enter room ID to join"
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isInitiating}
                    />
                  </div>

                  <Button
                    onClick={startVideoCall}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!inputRoomId.trim() || isInitiating || hasExceededLimit || isLoadingStats}
                  >
                    {isLoadingStats ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : hasExceededLimit ? (
                      <>
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Monthly Limit Reached
                      </>
                    ) : isInitiating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Video className="w-5 h-5 mr-2" />
                        Start Video Call
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-400">
                    Share the room ID with others to join the call
                  </p>
                </div>
              </CardContent>
            </Card>
            </div>
          )}
        </div>
      </div>
  );
}
