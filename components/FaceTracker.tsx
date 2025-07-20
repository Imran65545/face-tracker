"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FaceTracker = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const loadModels = async () => {
    const MODEL_URL = "/models";
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);
  };

  useEffect(() => {
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(
      navigator.userAgent
    );
    setIsMobile(isMobileDevice);
    if (isMobileDevice) {
      console.log("📱 Running on mobile device");
    }
  }, []);

  useEffect(() => {
    const setup = async () => {
      await loadModels();
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.addEventListener("play", () => {
          const interval = setInterval(async () => {
            if (!videoRef.current || !overlayCanvasRef.current) return;

            const video = videoRef.current;
            const canvas = overlayCanvasRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const detections = await faceapi
              .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks()
              .withFaceExpressions();

            const resized = faceapi.resizeResults(detections, {
              width: canvas.width,
              height: canvas.height,
            });

            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              faceapi.draw.drawDetections(canvas, resized);
              faceapi.draw.drawFaceLandmarks(canvas, resized);
              faceapi.draw.drawFaceExpressions(canvas, resized);
            }

            if (outputCanvasRef.current) {
              const outCtx = outputCanvasRef.current.getContext("2d");
              if (outCtx) {
                outputCanvasRef.current.width = canvas.width;
                outputCanvasRef.current.height = canvas.height;
                outCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
                outCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height);
              }
            }
          }, 100);

          return () => clearInterval(interval);
        });
      }
    };

    setup();
  }, []);

  const startCountdown = () => {
    console.log("🎬 Start Countdown Triggered");
    setIsCountingDown(true);
    setCountdown(3);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          setCountdown(null);
          setIsCountingDown(false);
          startRecording();
          return null;
        }
        return prev! - 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    console.log("🎥 Starting recording");
    if (typeof MediaRecorder === "undefined") {
      alert("MediaRecorder is not supported on this browser/device.");
      return;
    }

    if (!outputCanvasRef.current || !videoRef.current) return;

    try {
      await videoRef.current.play(); // Required on mobile
    } catch (err) {
      console.warn("Video play failed on mobile:", err);
    }

    const stream = outputCanvasRef.current.captureStream();
    if (!stream) {
      alert("Unable to capture stream from canvas.");
      return;
    }

    try {
      const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8",
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () =>
        setRecordedBlob(new Blob(chunks, { type: "video/webm" }));

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("MediaRecorder failed:", err);
      alert("Recording not supported on this device.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
  };

  const deleteRecording = () => {
    setRecordedBlob(null);
  };

  return (
    <div className="flex flex-col items-center gap-6 mt-10 px-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="relative p-4 flex justify-center">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="rounded-xl border-4 border-pink-500 shadow-lg w-full"
            style={{ WebkitTransform: "scale(1)", transform: "scale(1)" }}
          />
          <canvas
            ref={overlayCanvasRef}
            className="absolute top-0 left-0 z-10"
          />
          <canvas ref={outputCanvasRef} className="hidden" />
        </CardContent>
      </Card>

      {isCountingDown && countdown !== null && (
        <div className="text-4xl font-bold text-yellow-600">{countdown}</div>
      )}

      {isRecording && (
        <div className="text-lg text-red-600 font-semibold">
          ⏺ Recording: {String(recordingTime).padStart(2, "0")}s
        </div>
      )}

      <div className="flex gap-4">
        {!isRecording ? (
          <Button
            onClick={startCountdown}
            onTouchStart={startCountdown} // 👈 Fix for mobile
            disabled={isCountingDown}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isCountingDown
              ? `Starting in ${countdown}s...`
              : "Start Recording"}
          </Button>
        ) : (
          <Button
            onClick={stopRecording}
            onTouchStart={stopRecording} // 👈 Fix for mobile
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Stop Recording
          </Button>
        )}
      </div>

      {recordedBlob && (
        <Card className="w-full max-w-md mt-6">
          <CardContent className="p-4 text-center">
            <h2 className="text-xl font-semibold mb-3">🎥 Recorded Video</h2>
            <video controls className="rounded-lg border shadow-lg w-full mb-3">
              <source
                src={URL.createObjectURL(recordedBlob)}
                type="video/webm"
              />
            </video>
            <div className="flex gap-3 justify-center">
              <Button onClick={deleteRecording} variant="secondary">
                Delete
              </Button>
              <a
                href={URL.createObjectURL(recordedBlob)}
                download="recording.webm"
              >
                <Button
                  variant="default"
                  className="bg-blue-700 hover:bg-blue-800"
                >
                  Download
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FaceTracker;
