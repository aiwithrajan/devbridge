"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { 
  Camera, 
  CameraOff, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Eye, 
  EyeOff, 
  Sliders,
  Play
} from "lucide-react";
import { soundFX } from "@/lib/soundEffects";

interface PhoneWatchdogProps {
  onPhoneDetected?: (distractionCount: number) => void;
  onPhoneCleared?: () => void;
  isActive?: boolean;
}

interface DetectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  class: string;
  score: number;
}

export default function PhoneWatchdog({
  onPhoneDetected,
  onPhoneCleared,
  isActive = true,
}: PhoneWatchdogProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<unknown>(null);
  const detectIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Detection states
  const [isPhoneDetected, setIsPhoneDetected] = useState(false);
  const [distractionCount, setDistractionCount] = useState(0);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [allDetectedObjects, setAllDetectedObjects] = useState<{ name: string; score: number }[]>([]);
  
  // Streak refs to eliminate false positives
  const phoneStreakRef = useRef(0);
  const clearStreakRef = useRef(0);
  const isAlarmTriggeredRef = useRef(false);
  const lastAlarmTimeRef = useRef(0);

  // Optimal threshold for zero false positives
  const [threshold, setThreshold] = useState(0.55);

  const handleUserInteraction = () => {
    soundFX.unlockAudio();
  };

  // Initialize TensorFlow.js and COCO-SSD
  useEffect(() => {
    let isMounted = true;

    async function loadModel() {
      try {
        setIsLoadingModel(true);
        setModelError(null);

        await import("@tensorflow/tfjs");
        const cocoSsd = await import("@tensorflow-models/coco-ssd");

        const loadedModel = await cocoSsd.load({ base: "mobilenet_v2" });
        if (isMounted) {
          modelRef.current = loadedModel;
          setIsLoadingModel(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error("Failed to load COCO-SSD model:", err);
          const msg = err instanceof Error ? err.message : "Failed to load detection model";
          setModelError(msg);
          setIsLoadingModel(false);
        }
      }
    }

    loadModel();

    return () => {
      isMounted = false;
    };
  }, []);

  // Start webcam
  const startCamera = useCallback(async () => {
    handleUserInteraction();
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraActive(true);
        };
      }
    } catch (err: unknown) {
      console.error("Camera access error:", err);
      const msg = err instanceof Error ? err.message : "Webcam permission denied or camera not found";
      setCameraError(msg);
      setIsCameraActive(false);
    }
  }, []);

  // Stop webcam
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsPhoneDetected(false);
    isAlarmTriggeredRef.current = false;
    phoneStreakRef.current = 0;
    clearStreakRef.current = 0;
    if (detectIntervalRef.current) {
      clearInterval(detectIntervalRef.current);
    }
  }, []);

  // Auto-start camera when ready
  useEffect(() => {
    if (!isLoadingModel && !modelError && isActive && !isCameraActive && !cameraError) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isLoadingModel, modelError, isActive, isCameraActive, cameraError, startCamera, stopCamera]);

  // Main Detection Loop (runs every 250ms)
  useEffect(() => {
    if (!isCameraActive || !modelRef.current || !isActive) {
      if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
      return;
    }

    detectIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      try {
        const model = modelRef.current as {
          detect: (
            element: HTMLVideoElement
          ) => Promise<Array<{ bbox: [number, number, number, number]; class: string; score: number }>>;
        };

        const predictions = await model.detect(videoRef.current);

        const detectedObjects: DetectionBox[] = [];
        const objectLabels: { name: string; score: number }[] = [];
        let phoneInThisFrame = false;
        let highestPhoneScore = 0;

        predictions.forEach((pred) => {
          const [x, y, width, height] = pred.bbox;
          detectedObjects.push({
            x,
            y,
            width,
            height,
            class: pred.class,
            score: pred.score,
          });

          objectLabels.push({
            name: pred.class,
            score: Math.round(pred.score * 100),
          });

          // STRICT CHECK: Only genuine "cell phone" with score >= threshold
          if (pred.class === "cell phone" && pred.score >= threshold) {
            phoneInThisFrame = true;
            if (pred.score > highestPhoneScore) {
              highestPhoneScore = pred.score;
            }
          }
        });

        setAllDetectedObjects(objectLabels);
        setConfidenceScore(highestPhoneScore);

        // Draw bounding boxes on canvas
        if (canvasRef.current && videoRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            canvas.width = videoRef.current.videoWidth || 640;
            canvas.height = videoRef.current.videoHeight || 480;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            detectedObjects.forEach((box) => {
              const isPhone = box.class === "cell phone" && box.score >= threshold;
              ctx.strokeStyle = isPhone ? "#ef4444" : "rgba(148, 163, 184, 0.4)";
              ctx.lineWidth = isPhone ? 3 : 1.5;

              ctx.strokeRect(box.x, box.y, box.width, box.height);

              // Label tag
              const tagText = `${box.class} ${Math.round(box.score * 100)}%`;
              ctx.fillStyle = isPhone ? "#ef4444" : "rgba(15, 23, 42, 0.75)";
              ctx.fillRect(box.x, Math.max(0, box.y - 20), ctx.measureText(tagText).width + 12, 20);

              ctx.fillStyle = "#ffffff";
              ctx.font = "bold 11px sans-serif";
              ctx.fillText(tagText, box.x + 6, Math.max(14, box.y - 6));
            });
          }
        }

        // --- STREAK & DEBOUNCE FILTERING (Prevents False Positives) ---
        if (phoneInThisFrame) {
          phoneStreakRef.current += 1;
          clearStreakRef.current = 0;

          // Require 3 consecutive detections (~750ms of stable phone presence)
          if (phoneStreakRef.current >= 3 && !isAlarmTriggeredRef.current) {
            isAlarmTriggeredRef.current = true;
            setIsPhoneDetected(true);
            setDistractionCount((prev) => {
              const updated = prev + 1;
              if (onPhoneDetected) onPhoneDetected(updated);
              return updated;
            });

            // Prevent audio spam (max once per 5 seconds)
            const now = Date.now();
            if (soundEnabled && now - lastAlarmTimeRef.current > 5000) {
              lastAlarmTimeRef.current = now;
              soundFX.playAlert();
              soundFX.speakAlert("फोन नीचे रखो! कोड पर ध्यान दो।", "hi");
            }
          }
        } else {
          // No phone in this frame
          phoneStreakRef.current = 0;
          clearStreakRef.current += 1;

          // Require 2 consecutive clean frames (~500ms) to dismiss alert
          if (clearStreakRef.current >= 2 && isAlarmTriggeredRef.current) {
            isAlarmTriggeredRef.current = false;
            setIsPhoneDetected(false);
            if (onPhoneCleared) onPhoneCleared();
            if (soundEnabled) {
              soundFX.playRestored();
            }
          }
        }
      } catch (err) {
        console.error("Frame detection tick error:", err);
      }
    }, 250);

    return () => {
      if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
    };
  }, [isCameraActive, threshold, isActive, soundEnabled, onPhoneDetected, onPhoneCleared]);

  // Manually trigger test alert
  const triggerManualTestAlert = () => {
    soundFX.unlockAudio();
    setIsPhoneDetected(true);
    isAlarmTriggeredRef.current = true;
    setDistractionCount((c) => c + 1);
    soundFX.playAlert();
    soundFX.speakAlert("फोन नीचे रखो! कोड पर ध्यान दो।", "hi");
  };

  return (
    <div 
      onClick={handleUserInteraction}
      className="relative w-full rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-2xl backdrop-blur-xl"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
            isPhoneDetected 
              ? "border-red-500/50 bg-red-500/10 text-red-400 animate-pulse" 
              : isCameraActive 
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" 
              : "border-slate-700 bg-slate-800/50 text-slate-400"
          }`}>
            {isPhoneDetected ? <ShieldAlert className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-100">Webcam Phone Watchdog</h3>
              <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-400 border border-indigo-500/20">
                100% Private (COCO-SSD)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isLoadingModel 
                ? "Neural model loading..." 
                : isPhoneDetected 
                ? "🚨 PHONE IN HAND DETECTED!" 
                : isCameraActive 
                ? "Active • Monitoring frame" 
                : "Camera Paused"}
            </p>
          </div>
        </div>

        {/* Quick Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              handleUserInteraction();
              setSoundEnabled((v) => !v);
            }}
            title={soundEnabled ? "Mute audio alarms" : "Enable audio alarms"}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
              soundEnabled 
                ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20" 
                : "border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-300"
            }`}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          <button
            onClick={() => setShowPreview((v) => !v)}
            title={showPreview ? "Hide camera preview" : "Show camera preview"}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>

          <button
            onClick={isCameraActive ? stopCamera : startCamera}
            disabled={isLoadingModel}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
              isCameraActive
                ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
            }`}
          >
            {isCameraActive ? <CameraOff className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
            {isCameraActive ? "Stop Guard" : "Start Guard"}
          </button>
        </div>
      </div>

      {/* Main Status & Counter Bar */}
      <div className="grid grid-cols-3 gap-3 my-4">
        <div className={`rounded-xl border p-3 transition-colors ${
          isPhoneDetected 
            ? "border-red-500/40 bg-red-500/10" 
            : "border-slate-800/80 bg-slate-900/60"
        }`}>
          <div className="text-[11px] font-medium text-slate-400">Current Status</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`inline-block h-2 w-2 rounded-full ${
              isPhoneDetected ? "bg-red-500 animate-ping" : isCameraActive ? "bg-emerald-400" : "bg-slate-500"
            }`} />
            <span className={`text-xs font-bold ${
              isPhoneDetected ? "text-red-400" : isCameraActive ? "text-emerald-400" : "text-slate-400"
            }`}>
              {isPhoneDetected ? "Distracted" : isCameraActive ? "Focus Locked" : "Idle"}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
          <div className="text-[11px] font-medium text-slate-400">Distractions Caught</div>
          <div className="text-sm font-extrabold text-slate-100 mt-1 flex items-baseline gap-1">
            <span className="text-lg text-indigo-400">{distractionCount}</span>
            <span className="text-[10px] text-slate-500 font-normal">times today</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
          <div className="text-[11px] font-medium text-slate-400">Cell Phone Confidence</div>
          <div className="text-sm font-extrabold text-slate-100 mt-1 flex items-baseline gap-1">
            <span className={`text-lg ${confidenceScore >= threshold ? "text-red-400" : "text-slate-400"}`}>
              {Math.round(confidenceScore * 100)}%
            </span>
            <span className="text-[10px] text-slate-500 font-normal">score</span>
          </div>
        </div>
      </div>

      {/* Video & Bounding Box Feed */}
      {showPreview && (
        <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950 aspect-[4/3] max-h-72 w-full flex items-center justify-center">
          {isLoadingModel && (
            <div className="flex flex-col items-center gap-2 text-slate-400 text-xs">
              <Sparkles className="h-6 w-6 text-indigo-400 animate-spin" />
              <span>Loading AI Vision Model...</span>
            </div>
          )}

          {modelError && (
            <div className="p-4 text-center text-red-400 text-xs flex flex-col items-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              <span>Model error: {modelError}</span>
            </div>
          )}

          {cameraError && !modelError && (
            <div className="p-4 text-center text-amber-400 text-xs flex flex-col items-center gap-2">
              <CameraOff className="h-6 w-6" />
              <span>Camera access needed: {cameraError}</span>
              <button
                onClick={startCamera}
                className="mt-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-white text-xs font-semibold"
              >
                Click to Allow Camera
              </button>
            </div>
          )}

          {/* Video element */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`absolute inset-0 h-full w-full object-cover -scale-x-100 ${
              isCameraActive ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Canvas for bounding boxes */}
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover -scale-x-100"
          />

          {/* Visual Phone Detected Overlay on Video */}
          {isPhoneDetected && (
            <div className="absolute inset-0 bg-red-600/20 border-4 border-red-500 animate-pulse pointer-events-none flex items-center justify-center">
              <div className="rounded-xl bg-slate-950/90 border border-red-500 px-4 py-2 text-center shadow-xl">
                <div className="text-red-400 font-bold text-sm">🚨 CELL PHONE DETECTED!</div>
                <div className="text-slate-300 text-[11px] mt-0.5">Put phone face-down to resume</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live Object Inspector HUD (What AI currently sees) */}
      <div className="mt-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-medium">Objects currently in camera view:</span>
          <span className="text-slate-500">{allDetectedObjects.length} detected</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {allDetectedObjects.length === 0 ? (
            <span className="text-[11px] text-slate-500 italic">No objects recognized yet</span>
          ) : (
            allDetectedObjects.map((obj, i) => (
              <span
                key={i}
                className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold border ${
                  obj.name === "cell phone" && obj.score >= Math.round(threshold * 100)
                    ? "border-red-500/40 bg-red-500/20 text-red-300 animate-pulse"
                    : "border-slate-800 bg-slate-900 text-slate-300"
                }`}
              >
                {obj.name} ({obj.score}%)
              </span>
            ))
          )}
        </div>
      </div>

      {/* Sensitivity Slider & Direct Test Action */}
      <div className="mt-3 flex items-center justify-between gap-4 pt-3 border-t border-slate-800/80">
        <div className="flex items-center gap-2 flex-1">
          <Sliders className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="text-[11px] text-slate-400 shrink-0">Threshold:</span>
          <input
            type="range"
            min="0.40"
            max="0.80"
            step="0.05"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="text-[11px] font-mono text-indigo-400 shrink-0">
            {Math.round(threshold * 100)}%
          </span>
        </div>

        {/* Instant Simulator / Test Button */}
        <button
          onClick={triggerManualTestAlert}
          className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 text-xs font-semibold transition-colors shrink-0"
        >
          <Play className="h-3 w-3" />
          <span>Test Alert</span>
        </button>
      </div>

      {/* Full-Screen Warning Modal when Phone is in Hand */}
      {isPhoneDetected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="max-w-md w-full rounded-2xl border-2 border-red-500 bg-slate-950 p-6 text-center shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/30 animate-bounce">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <h2 className="mt-4 text-xl font-extrabold text-white">
              Hands Off Your Phone! 📱❌
            </h2>

            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Laptop khula hai aur aapka haath phone par hai! Reels ya social media scroll karne ke badle,
              apne code ke workflow par focus karo.
            </p>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-left">
              <div className="text-[11px] font-semibold text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Active Intervention:</span>
              </div>
              <p className="text-xs text-slate-200 mt-1">
                Put your phone face-down on your desk to dismiss this alert automatically.
              </p>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  setIsPhoneDetected(false);
                  isAlarmTriggeredRef.current = false;
                  phoneStreakRef.current = 0;
                  soundFX.playRestored();
                }}
                className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 text-xs font-semibold transition-colors"
              >
                Temporarily Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
