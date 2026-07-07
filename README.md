# ⚔️ CodeBattle

**Live Arena:** [mycodebattle.dev](https://mycodebattle.dev)

CodeBattle is a real-time, competitive programming multiplayer platform. It matches developers of similar skill levels into isolated 1v1 arenas where they race to solve algorithmic challenges. Featuring a fully synchronized MERN stack architecture, WebSockets for instant state updates, and cloud-based code compilation.

## ✨ Core Features

*   **Real-Time Matchmaking:** Players are queued and dynamically paired into live WebSocket rooms based on active sessions.
*   **Live Code Execution:** Integrated with the Judge0 compiler engine to securely compile and test C++ and Java code against hidden test cases.
*   **Dynamic Elo Rating System:** A competitive ranking algorithm that dynamically calculates points gained or lost based on match outcomes and opponent difficulty.
*   **Post-Match Analysis:** A split-screen review mode utilizing the Monaco Editor, allowing players to analyze and compare their solution alongside their opponent's code.
*   **In-Arena Battle Comms:** Real-time WebSocket-powered chat interface within the arena for opponent communication.
*   **Achievement & Badge System:** Unlockable visual badges and ranks tied to Elo progression and match victories.
*   **Secure Authentication:** JWT-based user sessions with encrypted credential storage.

## 🛠️ Tech Stack

**Frontend**
*   **Framework:** React + Vite
*   **Styling:** Tailwind CSS
*   **Routing:** React Router DOM
*   **Editor:** Monaco Editor (`@monaco-editor/react`)
*   **State & Networking:** Axios, Socket.io-client

**Backend**
*   **Environment:** Node.js + Express
*   **Database:** MongoDB Atlas + Mongoose
*   **Real-Time Engine:** Socket.io
*   **Code Execution:** Judge0 CE (via RapidAPI)
*   **Security:** JWT, CORS, bcrypt
