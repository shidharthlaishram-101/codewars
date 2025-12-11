🚀 Competitive Coding Platform & Code Execution System (Judge0 + AWS + Docker)

A full-fledged competitive coding platform designed for Prajyuktam 2025’s Competitive Coding 2.1 event.
This system allows users to write, run, and test code in 70+ programming languages, with a fully custom, scalable backend powered by Judge0, AWS Linux, Docker, and NGINX.

📌 Project Overview

This platform enables students to solve coding problems directly in the browser with real-time code execution.
It was built to support high-concurrency, low-latency, and secure execution of user-submitted programs.

Due to limitations of public code-execution APIs (rate limits, token limits, slow response), a custom self-hosted Judge0 API was deployed on AWS to allow unrestricted execution during the event.

⭐ Features
👨‍💻 User Features

Write, run, and test code in 70+ programming languages

Real-time execution output

Save and resume submissions

View problem statements with examples, constraints, and starter code

🛠️ Admin Features

Add / edit / delete coding questions

Provide sample test cases and code snippets

View and evaluate user submissions

Check for possible cheating (code similarity, timestamps, etc.)

⚙️ Backend Capabilities

AWS-hosted Judge0 server capable of handling continuous execution requests

Dockerized environment for sandboxed compilation and execution

NGINX reverse proxy + CERTBOT HTTPS integration

Logging, monitoring, and fail-safe mechanisms

Caching of language lists and system health status

🧱 System Architecture
Frontend  → Custom API Layer → NGINX → Judge0 (Docker) → Execution Sandbox
Database (Questions, Users, Submissions)

Core Components

Frontend: Coding interface with editor & execution pipeline

Backend API: Manages requests, database, authentication

Judge0 Engine: Executes user code in isolated containers

AWS EC2 Linux: Server hosting the execution engine

NGINX + CERTBOT: Secure reverse proxy for HTTPS
🎥 Demo

🔗 YouTube Execution Demo:
https://www.youtube.com/watch?v=mRbdIkk3ur4

🔗 Supported Languages List (Live Judge0 Instance):
https://compilerjudge.shidharthlaishram101.online/languages

🧰 Tech Stack
Frontend

HTML / CSS / JavaScript

CodeMirror / Monaco Editor (choose depending on your repo)

REST-based execution API

Backend

Node.js / Express (If applicable — modify based on your repo)

Judge0 API wrapper

MySQL / PostgreSQL database

Infrastructure

AWS EC2 (Ubuntu/Linux)

Docker & Docker Compose

NGINX Reverse Proxy

CERTBOT (Let’s Encrypt SSL)

🚀 Installation and Setup
1️⃣ Clone the Repository
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>
2️⃣ Install Dependencies
npm install   # or pip install, etc — modify based on your stack
3️⃣ Environment Variables
Create a .env file:
JUDGE0_URL=https://your-compiler-endpoint
DB_HOST=
DB_USER=
DB_PASS=
DB_NAME=
PORT=5000
4️⃣ Start Development Server
npm start
5️⃣ Running Judge0 with Docker (if included locally)
docker pull judge0/judge0:1.13.0
docker run -d -p 2358:2358 judge0/judge0:1.13.0
📡 API Usage Example
POST /submissions
{
  "language_id": 52,
  "source_code": "print('Hello World')",
  "stdin": ""
}
Response
{
  "token": "f3b1c8-..."
}
Fetch Result
GET /submissions/{token}
🏆 Event
This system powered the Competitive Coding 2.1 event during Prajyuktam 2025, enabling seamless execution for hundreds of participants.
🙌 Acknowledgements
Judge0 team for the open-source execution engine
Coding Club, ADBU
Mentors and peers for testing & feedback
📜 License
MIT License
