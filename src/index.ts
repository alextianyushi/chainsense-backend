// src/index.ts

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { handleLangChainChat } from './langchainHandler';

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT||5001;

// Middleware
app.use(cors({ origin: 'https://chainsense-frontend.vercel.app' })); 
app.use(express.json()); // Parse incoming JSON requests

// Route to handle chat messages
app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
  const userMessage: string = req.body.message;
  const userId: string = req.body.userId || 'default_user'; // Use 'default_user' if userId is not provided

  if (!userMessage) {
    res.status(400).json({ error: 'No message provided' });
    return;
  }

  try {
    // Call LangChain handler with user message and userId
    const aiReply = await handleLangChainChat(userMessage, userId);
    res.json({ reply: aiReply });
  } catch (error: any) {
    console.error('Error communicating with AI:', error.message);
    res.status(500).json({ error: 'Error communicating with AI' });
  }
});

// Route to handle loading memory from Auto Drive
app.post('/api/load', async (req: Request, res: Response): Promise<void> => {
  const { cid, password, userId } = req.body;

  if (!cid || !password || !userId) {
    res.status(400).json({ error: 'Missing CID, password, or userId' });
    return;
  }

  try {
    // Send the /load command to LangChain handler
    const loadResponse = await handleLangChainChat(`/load ${cid} ${password}`, userId);
    res.json({ message: loadResponse });
  } catch (error: any) {
    console.error('Error loading memory:', error.message);
    res.status(500).json({ error: 'Failed to load memory from Auto Drive' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
