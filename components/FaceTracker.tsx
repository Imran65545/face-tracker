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

  const loadModels = async () => {
    const MODEL_URL = "/models";
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);
  };

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

            const ctx = canvas.getContext("2d");
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
    if (!outputCanvasRef.current || !videoRef.current) return;

    // 🔐 Force video to play (especially on mobile)
    try {
      await videoRef.current.play();
    } catch (err) {
      console.warn("Unable to force play video:", err);
    }

    const stream = outputCanvasRef.current.captureStream();
    const recorder = new MediaRecorder(stream);
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
