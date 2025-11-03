import { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, Settings } from "lucide-react";
import { Button } from "./components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Label } from "./components/ui/label";
import { Input } from "./components/ui/input";
import { toast } from "sonner@2.0.3";
import { Toaster } from "./components/ui/sonner";

type TimerMode = "session" | "break";

export default function App() {
  const [sessionDuration, setSessionDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [timeLeft, setTimeLeft] = useState(sessionDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<TimerMode>("session");
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    // Using a lo-fi music stream from YouTube Audio Library equivalent
    // Replace this URL with your own lo-fi music file
    audioRef.current = new Audio("https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer finished
      setIsRunning(false);
      if (audioRef.current) {
        audioRef.current.pause();
        setIsMusicPlaying(false);
      }

      if (mode === "session") {
        setSessionsCompleted((prev) => prev + 1);
        toast.success("Session Complete! Time for a break 🎉", {
          description: `You've completed ${sessionsCompleted + 1} session${sessionsCompleted + 1 > 1 ? 's' : ''} today!`,
          duration: 5000,
        });
        setMode("break");
        setTimeLeft(breakDuration * 60);
      } else {
        toast.success("Break's over! Ready for another session? 💪", {
          duration: 5000,
        });
        setMode("session");
        setTimeLeft(sessionDuration * 60);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, sessionDuration, breakDuration, sessionsCompleted]);

  // Music control
  useEffect(() => {
    if (audioRef.current) {
      if (isMusicPlaying && mode === "session") {
        audioRef.current.play().catch(err => console.log("Audio play failed:", err));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isMusicPlaying, mode]);

  const handlePlayPause = () => {
    setIsRunning(!isRunning);
    if (!isRunning && mode === "session") {
      setIsMusicPlaying(true);
    } else {
      setIsMusicPlaying(false);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsMusicPlaying(false);
    setMode("session");
    setTimeLeft(sessionDuration * 60);
  };

  const handleSaveSettings = (sessionMins: number, breakMins: number) => {
    setSessionDuration(sessionMins);
    setBreakDuration(breakMins);
    
    if (!isRunning) {
      if (mode === "session") {
        setTimeLeft(sessionMins * 60);
      } else {
        setTimeLeft(breakMins * 60);
      }
    }
    
    setSettingsOpen(false);
    toast.success("Settings updated!");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = mode === "session" 
    ? (timeLeft / (sessionDuration * 60)) * 100
    : (timeLeft / (breakDuration * 60)) * 100;

  // Calculate fill level - inverse of time remaining (starts empty, fills up)
  const fillLevel = mode === "session" 
    ? ((sessionDuration * 60 - timeLeft) / (sessionDuration * 60)) * 100
    : ((breakDuration * 60 - timeLeft) / (breakDuration * 60)) * 100;

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-8">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 bg-gradient-mesh"></div>
      
      <Toaster />
      
      <div className="w-full max-w-2xl flex flex-col items-center relative z-10">
        {/* Tomato Visualization - Centered */}
        <div className="relative mb-8 group cursor-pointer" onClick={handlePlayPause}>
          <TomatoSVG fillLevel={fillLevel} mode={mode} isRunning={isRunning} />
          
          {/* Sparkles effect when running */}
          {isRunning && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32">
              <div className="animate-float-up opacity-60">
                <div className="text-4xl">✨</div>
              </div>
            </div>
          )}
          
          {/* Completion celebration */}
          {fillLevel === 100 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-6xl animate-bounce">🎉</div>
            </div>
          )}
        </div>

        {/* Timer Display - Editable */}
        <Input
          type="text"
          value={formatTime(timeLeft)}
          onChange={(e) => {
            const value = e.target.value;
            const match = value.match(/^(\d{1,2}):(\d{2})$/);
            if (match) {
              const mins = parseInt(match[1]);
              const secs = parseInt(match[2]);
              if (mins >= 0 && mins <= 99 && secs >= 0 && secs <= 59) {
                setTimeLeft(mins * 60 + secs);
              }
            }
          }}
          className="text-orange-700 text-7xl tracking-tight font-outfit text-center border-none bg-transparent shadow-none mb-6 w-auto max-w-md focus-visible:ring-0 focus-visible:ring-offset-0"
          disabled={isRunning}
        />

        {/* Controls - Glass morphism */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Button
            onClick={handlePlayPause}
            size="lg"
            className="glass-button-primary w-16 h-16"
          >
            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </Button>
          
          <Button
            onClick={handleStop}
            size="lg"
            className="glass-button-secondary w-16 h-16"
          >
            <Square className="w-5 h-5" />
          </Button>

          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="glass-button-secondary w-16 h-16"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-0">
              <DialogHeader>
                <DialogTitle className="font-outfit">Timer Settings</DialogTitle>
                <DialogDescription>
                  Customize your pomodoro session and break durations.
                </DialogDescription>
              </DialogHeader>
              <SettingsForm
                initialSession={sessionDuration}
                initialBreak={breakDuration}
                onSave={handleSaveSettings}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Music Indicator */}
        {mode === "session" && isMusicPlaying && (
          <div className="text-center mb-6 text-orange-600 text-sm flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            Lo-fi music playing
          </div>
        )}

        {/* Stats panel - Stacked below */}
        <div className="w-full glass-card p-8">
          <h2 className="text-orange-700 text-2xl mb-6 font-outfit">🍅 Tomatoes Grown</h2>

          {/* Current session in progress */}
          {isRunning && (
            <div className="glass-item mb-3">
              <p className="text-orange-700 text-sm">🌱 Tomato growing...</p>
            </div>
          )}

          {/* Completed sessions */}
          {sessionsCompleted === 0 && !isRunning && (
            <div className="glass-item">
              <p className="text-orange-600 text-sm">No tomatoes yet. Start growing! 🌱</p>
            </div>
          )}

          <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
            {Array.from({ length: sessionsCompleted }, (_, i) => (
              <div key={i} className="glass-item">
                <p className="text-orange-700 text-sm mb-1 font-outfit">🍅 Tomato #{i + 1}</p>
                <p className="text-orange-600 text-xs opacity-70">Fully ripened ✓</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TomatoSVG({ fillLevel, mode, isRunning }: { fillLevel: number; mode: TimerMode; isRunning: boolean }) {
  // Calculate color based on ripeness (fill level)
  const getTomatoColor = () => {
    if (mode === "break") return "#F59E0B"; // Golden for break
    if (fillLevel < 30) return "#86EFAC"; // Light green (unripe)
    if (fillLevel < 60) return "#FB923C"; // Orange (ripening)
    return "#EF4444"; // Red (ripe)
  };

  const tomatoColor = getTomatoColor();
  const scale = 0.7 + (fillLevel / 100) * 0.3; // Grow from 70% to 100% size

  return (
    <svg
      width="500"
      height="500"
      viewBox="0 0 500 500"
      className={`drop-shadow-2xl transition-transform duration-500 ${isRunning ? '' : 'group-hover:scale-105'}`}
      style={{ transform: `scale(${scale})` }}
    >
      <defs>
        {/* Gradient for tomato body */}
        <radialGradient id="tomatoGradient" cx="45%" cy="40%">
          <stop offset="0%" stopColor={tomatoColor} stopOpacity="1" />
          <stop offset="70%" stopColor={tomatoColor} stopOpacity="0.9" />
          <stop offset="100%" stopColor={tomatoColor} stopOpacity="0.7" />
        </radialGradient>

        {/* Shine gradient */}
        <radialGradient id="shineGradient" cx="30%" cy="30%">
          <stop offset="0%" stopColor="white" stopOpacity="0.8" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>

        {/* Leaf gradient */}
        <linearGradient id="leafGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
      </defs>

      {/* Main tomato body */}
      <circle
        cx="250"
        cy="280"
        r="120"
        fill="url(#tomatoGradient)"
        className={`transition-all duration-1000 ${isRunning ? 'animate-gentle-pulse' : ''}`}
      />

      {/* Tomato segments/indentations */}
      {fillLevel > 20 && (
        <>
          <path
            d="M 250 160 Q 240 200 245 280 Q 250 350 255 400"
            fill="none"
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="3"
            className="transition-opacity duration-500"
          />
          <path
            d="M 250 160 Q 260 200 255 280 Q 250 350 245 400"
            fill="none"
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="3"
            className="transition-opacity duration-500"
          />
        </>
      )}

      {/* Shine/highlight */}
      {fillLevel > 10 && (
        <ellipse
          cx="200"
          cy="240"
          rx="50"
          ry="70"
          fill="url(#shineGradient)"
          className="transition-opacity duration-500"
        />
      )}

      {/* Shadow at bottom */}
      <ellipse
        cx="250"
        cy="395"
        rx="80"
        ry="15"
        fill="rgba(0,0,0,0.2)"
        className="transition-all duration-500"
        style={{ opacity: fillLevel / 100 }}
      />

      {/* Stem and leaves (appear as tomato grows) */}
      {fillLevel > 40 && (
        <g className="transition-all duration-500" style={{ opacity: (fillLevel - 40) / 60 }}>
          {/* Stem */}
          <path
            d="M 250 160 Q 248 140 250 120"
            fill="none"
            stroke="#92400E"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Leaves */}
          <path
            d="M 250 130 Q 220 120 200 140 Q 210 150 230 145 Q 240 140 250 135"
            fill="url(#leafGradient)"
            className={isRunning ? 'animate-leaf-sway' : ''}
          />
          <path
            d="M 250 130 Q 280 120 300 140 Q 290 150 270 145 Q 260 140 250 135"
            fill="url(#leafGradient)"
            className={isRunning ? 'animate-leaf-sway-reverse' : ''}
          />
          <path
            d="M 250 125 Q 245 100 230 90 Q 235 105 245 115 Q 248 120 250 125"
            fill="url(#leafGradient)"
            className={isRunning ? 'animate-leaf-sway-delayed' : ''}
          />
        </g>
      )}

      {/* Sparkle effects when running */}
      {isRunning && fillLevel > 0 && (
        <>
          <circle cx="180" cy="250" r="3" fill="#FDE047" className="animate-sparkle" />
          <circle cx="320" cy="280" r="2.5" fill="#FDE047" className="animate-sparkle-delayed" />
          <circle cx="250" cy="210" r="2" fill="#FDE047" className="animate-sparkle-slow" />
        </>
      )}
    </svg>
  );
}

function SettingsForm({
  initialSession,
  initialBreak,
  onSave,
}: {
  initialSession: number;
  initialBreak: number;
  onSave: (session: number, breakTime: number) => void;
}) {
  const [session, setSession] = useState(initialSession);
  const [breakTime, setBreakTime] = useState(initialBreak);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(session, breakTime);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="session">Session Duration (minutes)</Label>
        <Input
          id="session"
          type="number"
          min="1"
          max="120"
          value={session}
          onChange={(e) => setSession(Number(e.target.value))}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="break">Break Duration (minutes)</Label>
        <Input
          id="break"
          type="number"
          min="1"
          max="60"
          value={breakTime}
          onChange={(e) => setBreakTime(Number(e.target.value))}
        />
      </div>
      
      <div className="flex gap-2">
        <Button type="submit" className="flex-1 glass-button-primary font-outfit">
          Save Settings
        </Button>
      </div>
    </form>
  );
}
