# CampusPulse — Real OpenAI AI setup

This version uses Google's official `@google/genai` JavaScript SDK on the existing Express backend.

## 1. Install
cd server
npm install

## 2. Configure server/.env
OPENAI_API_KEY=YOUR_REAL_KEY
OPENAI_MODEL=gpt-5-mini

Never put the key in the React/Vite environment.

## 3. Start
npm run dev

## 4. Configuration check
GET http://localhost:5000/api/ai/health

This reports whether a key is configured. It does NOT claim that OpenAI has responded.

## 5. Real OpenAI verification
Open the CampusPulse homepage AI and ask:
"Explain the MERN stack in simple terms."

The request goes:
React -> Express /api/ai/assistant -> Google GenAI SDK -> OpenAI -> Express -> React.

Without OPENAI_API_KEY, the endpoint returns a clear 503 configuration error. There are no hardcoded general AI answers in this implementation.

Provider failures return a friendly 503 response and do not crash CampusPulse.
