# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Server Setup

1. Copy `server/.env.example` to `server/.env` and fill in your database credentials.
2. Install server dependencies:
   `cd server && npm install`
3. Start the server:
   `npm start`
