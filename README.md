Face Tracker App
A Next.js face tracking and expression detection application that uses the face-api.js library with support for:

Live webcam face detection

Face landmark & expression tracking

Video recording & playback

Deleting recorded videos

Beautiful UI with ShadCN components and TailwindCSS

📸 Demo

🚀 Tech Stack
Framework: Next.js 14 App Router

Language: TypeScript

UI Library: ShadCN UI

Face Detection: face-api.js

Styling: TailwindCSS

📦 Features
🎥 Live webcam preview

🧠 Face detection, landmarks & expression recognition

🔴 Record video and save for preview

❌ Delete recorded video

💄 Modern UI with responsive design

🔧 Installation
Clone the repository

bash
Copy
Edit
git clone https://github.com/your-username/face-tracker-app.git
cd face-tracker-app
Install dependencies

bash
Copy
Edit
npm install
Install ShadCN (if not already)

bash
Copy
Edit
npx shadcn-ui@latest init
Run the app

bash
Copy
Edit
npm run dev
Visit http://localhost:3000

📁 Folder Structure
bash
Copy
Edit
/public/models           # face-api.js models
/components              # UI components
    WebcamFeed.tsx       # Webcam stream
    FaceTracker.tsx      # Expression detection
    VideoRecorder.tsx    # Recording functionality
    DeleteButton.tsx     # Delete functionality
    UI/                  # ShadCN-enhanced UI
/app/page.tsx            # Main entry
/tailwind.config.ts      # Tailwind config
🧠 How It Works
✅ 1. Face Detection (via face-api.js)
Loads the following models from /public/models:

tiny_face_detector

face_landmark_68

face_expression

Uses:

ts
Copy
Edit
await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
await faceapi.nets.faceExpressionNet.loadFromUri('/models')
Tracks faces in real time using:

ts
Copy
Edit
faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
  .withFaceLandmarks()
  .withFaceExpressions()
📹 2. Video Recording
Uses native MediaRecorder to record webcam stream:

ts
Copy
Edit
const mediaRecorder = new MediaRecorder(stream);
mediaRecorder.ondataavailable = (event) => chunks.push(event.data);
❌ 3. Video Delete Feature
Adds a delete button to remove the recorded video from state and UI.

🛠 Dependencies
face-api.js

next

react

tailwindcss

shadcn/ui

lucide-react

🧪 Face API Model Setup
📁 Place your face-api.js models inside public/models.

Download models from:
https://github.com/justadudewhohacks/face-api.js-models

Or use script:

bash
Copy
Edit
mkdir public/models
cd public/models

wget https://github.com/justadudewhohacks/face-api.js-models/raw/master/tiny_face_detector_model-shard1
wget https://github.com/justadudewhohacks/face-api.js-models/raw/master/tiny_face_detector_model-weights_manifest.json
# Repeat for face_landmark_68 and face_expression
📱 Responsiveness
The UI is built with Tailwind & ShadCN, ensuring a responsive layout across:

Mobile

Tablet

Desktop

🧠 Future Suggestions
Save videos to local storage or backend (e.g., MongoDB or Firebase)

Add screenshot capture

Support multiple faces

Add filters or overlays

Show expression percentages in charts

Share recorded videos

Use zustand or redux for state management

✨ Credits
Face detection via face-api.js

UI inspired by ShadCN

Icons from Lucide

