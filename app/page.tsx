import FaceTracker from "@/components/FaceTracker";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white">
      <h1 className="text-3xl font-bold mt-4">Face Tracking App</h1>
      <FaceTracker />
    </main>
  );
}
