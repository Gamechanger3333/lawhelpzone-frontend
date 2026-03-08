"use client";
import { useEffect, useRef, useState } from "react";
import { X, Video, VideoOff, Mic, MicOff, Phone } from "lucide-react";

// Jitsi Meet integration via their free public server (meet.jit.si)
// For production, use your own Jitsi server or 8x8.vc JWT tokens

export default function VideoMeetingModal({ meeting, currentUser, onClose }) {
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!meeting?.roomName) return;

    // Load Jitsi Meet External API script
    const loadJitsi = () => {
      if (window.JitsiMeetExternalAPI) {
        initJitsi();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = initJitsi;
      script.onerror = () => setError("Failed to load video meeting. Please try again.");
      document.head.appendChild(script);
    };

    const initJitsi = () => {
      try {
        if (!jitsiContainerRef.current) return;

        const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si";

        const options = {
          roomName: meeting.roomName,
          parentNode: jitsiContainerRef.current,
          width: "100%",
          height: "100%",
          configOverwrite: {
            prejoinPageEnabled: false,
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableDeepLinking: true,
            enableWelcomePage: false,
            toolbarButtons: [
              "microphone",
              "camera",
              "closedcaptions",
              "desktop",
              "chat",
              "raisehand",
              "videoquality",
              "tileview",
              "hangup",
            ],
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_BRAND_WATERMARK: false,
            DEFAULT_BACKGROUND: "#1a1a2e",
            TOOLBAR_ALWAYS_VISIBLE: true,
          },
          userInfo: {
            displayName: currentUser?.name || "Participant",
            email: currentUser?.email || "",
          },
        };

        // Use JWT token if provided (for authenticated Jitsi)
        if (meeting.jitsiToken) {
          options.jwt = meeting.jitsiToken;
        }

        jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options);

        jitsiApiRef.current.addEventListeners({
          readyToClose: () => onClose(),
          videoConferenceJoined: () => setIsLoaded(true),
          videoConferenceLeft: () => onClose(),
        });
      } catch (err) {
        setError("Failed to initialize video meeting: " + err.message);
      }
    };

    loadJitsi();

    return () => {
      if (jitsiApiRef.current) {
        try { jitsiApiRef.current.dispose(); } catch {}
        jitsiApiRef.current = null;
      }
    };
  }, [meeting?.roomName, currentUser]);

  if (!meeting) return null;

  const scheduledDate = new Date(meeting.scheduledAt).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-gray-900 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <div>
            <p className="text-white font-semibold text-sm">{meeting.title}</p>
            <p className="text-gray-400 text-xs">{scheduledDate} · {meeting.duration} min</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {meeting.participants?.map((p, i) => (
              <div
                key={p._id || i}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-semibold border-2 border-gray-900"
                title={p.name}
              >
                {p.name?.[0]?.toUpperCase() || "?"}
              </div>
            ))}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Jitsi container */}
      <div className="flex-1 relative">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <VideoOff className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-lg font-medium mb-2">Unable to load meeting</p>
            <p className="text-gray-400 text-sm mb-6">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {!isLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 bg-gray-900">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-lg font-medium">Joining meeting...</p>
                <p className="text-gray-400 text-sm mt-2">Room: {meeting.roomName}</p>
              </div>
            )}
            <div ref={jitsiContainerRef} className="w-full h-full" />
          </>
        )}
      </div>
    </div>
  );
}