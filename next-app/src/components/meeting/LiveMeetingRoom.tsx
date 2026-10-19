'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Share2,
  PhoneOff,
  AlertTriangle,
  Users,
  Settings,
  Maximize2,
  RotateCcw,
} from 'lucide-react';

interface LiveMeetingRoomProps {
  roomName: string;
  userName: string;
  onLeave?: () => void;
}

export const LiveMeetingRoom: React.FC<LiveMeetingRoomProps> = ({
  roomName,
  userName,
  onLeave,
}) => {
  // Device controls
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Platform & Orientation states
  const [isMobilePlatform, setIsMobilePlatform] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 1. Platform Detection (Explicit platform check, NOT feature detection)
  // Mobile Chrome exposes getDisplayMedia in window.navigator.mediaDevices but always throws NotSupportedError
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent || '';
    const mobileCheck =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
      Boolean((navigator as any).userAgentData?.mobile);

    setIsMobilePlatform(mobileCheck);

    // Orientation detection
    const handleOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    handleOrientation();
    window.addEventListener('resize', handleOrientation);
    window.addEventListener('orientationchange', handleOrientation);

    return () => {
      window.removeEventListener('resize', handleOrientation);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, []);

  // 2. Request Camera & Mic with Permission Denial Handling
  const startMedia = async () => {
    setPermissionError(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setPermissionError('Media devices API is not supported in this browser environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoOn,
        audio: isAudioOn,
      });

      streamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn('[Meeting Room] Media error:', err);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError(
          'Camera or Microphone access was denied. Tap the lock/tune icon in your browser address bar to allow permissions, then retry.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionError('No camera or microphone hardware found on this device.');
      } else {
        setPermissionError(`Failed to access media hardware: ${err.message || 'Unknown error'}`);
      }
    }
  };

  useEffect(() => {
    startMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isVideoOn, isAudioOn]);

  // 3. Screen Sharing (Only permitted on desktop platforms)
  const handleToggleScreenShare = async () => {
    if (isMobilePlatform) {
      // Safety guard: mobile platforms do not support screen share
      return;
    }

    try {
      if (!isScreenSharing) {
        if (!navigator.mediaDevices?.getDisplayMedia) {
          throw new Error('Screen sharing not supported');
        }
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          startMedia();
        };
      } else {
        setIsScreenSharing(false);
        startMedia();
      }
    } catch (err: any) {
      console.warn('[ScreenShare Error]:', err);
    }
  };

  return (
    <div
      id="livekit-meeting-room"
      className="flex flex-col h-full bg-slate-950 text-white rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative"
    >
      {/* Header Bar */}
      <div className="p-3 sm:p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <h3 className="text-xs sm:text-sm font-bold text-white font-display truncate max-w-[200px]">
            {roomName}
          </h3>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
            {isMobilePlatform ? 'Mobile WebRTC' : 'Desktop HD'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          <span>Connected</span>
        </div>
      </div>

      {/* Permission Denial Error Banner */}
      {permissionError && (
        <div
          role="alert"
          id="media-permission-denial-banner"
          className="m-3 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-3 z-20 animate-in fade-in"
        >
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="block font-semibold mb-0.5">Hardware Permission Required</strong>
            <span>{permissionError}</span>
          </div>
          <button
            onClick={startMedia}
            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Video Tiles Grid (Adapts between Portrait 1-col stack and Landscape 2-col) */}
      <div
        className={`flex-1 p-3 grid gap-3 overflow-y-auto ${
          isLandscape ? 'grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {/* Local Participant Tile */}
        <div className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center min-h-[220px]">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${!isVideoOn ? 'hidden' : ''}`}
          />

          {!isVideoOn && (
            <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-lg font-bold text-white">
                {userName.slice(0, 1).toUpperCase()}
              </div>
              <span className="text-xs">Camera is off</span>
            </div>
          )}

          <div className="absolute bottom-2 left-2 bg-slate-950/70 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white flex items-center gap-1.5">
            <span>{userName} (You)</span>
            {!isAudioOn && <MicOff className="w-3 h-3 text-rose-400" />}
          </div>
        </div>

        {/* Remote Mock Faculty / Mentor Tile for Realistic Room Testing */}
        <div className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center min-h-[220px]">
          <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
            <div className="w-14 h-14 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-lg font-bold">
              SP
            </div>
            <span className="text-xs font-semibold text-slate-300">Dr. Sheetal Patil (Guide)</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Active Audio
            </span>
          </div>

          <div className="absolute bottom-2 left-2 bg-slate-950/70 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white">
            Dr. Sheetal Patil
          </div>
        </div>
      </div>

      {/* Control Bar (Touch targets min 44px) */}
      <div className="p-3 sm:p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-center gap-3 pb-safe z-10">
        {/* Mic Toggle */}
        <button
          onClick={() => setIsAudioOn(!isAudioOn)}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all min-h-[44px] min-w-[44px] ${
            isAudioOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-rose-600 text-white'
          }`}
          title={isAudioOn ? 'Mute Mic' : 'Unmute Mic'}
          aria-label={isAudioOn ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Video Toggle */}
        <button
          onClick={() => setIsVideoOn(!isVideoOn)}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all min-h-[44px] min-w-[44px] ${
            isVideoOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-rose-600 text-white'
          }`}
          title={isVideoOn ? 'Turn Video Off' : 'Turn Video On'}
          aria-label={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* Screen Share Control: STRICTLY HIDDEN ON MOBILE PLATFORMS */}
        {!isMobilePlatform && (
          <button
            id="btn-desktop-screen-share"
            onClick={handleToggleScreenShare}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all min-h-[44px] min-w-[44px] ${
              isScreenSharing
                ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
            aria-label="Toggle Screen Share"
          >
            <Share2 className="w-5 h-5" />
          </button>
        )}

        {/* Leave Room Button */}
        <button
          onClick={() => {
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((t) => t.stop());
            }
            if (onLeave) onLeave();
          }}
          className="w-12 h-12 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition-all min-h-[44px] min-w-[44px]"
          title="Leave Meeting"
          aria-label="Leave Meeting Room"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
