// src/langchainHandler.ts

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import dotenv from 'dotenv';
import { uploadFileFromMemory, downloadFileFromAutoDrive } from './drive';

dotenv.config(); // Load environment variables from .env file

const userConversations: { 
  [userId: string]: { 
    messages: { user: string; ai: string }[], 
    memory: string 
  } 
} = {};

/**
 * Handle user chat with the AI and optionally save/load the conversation.
 * @param userMessage The user's input message.
 * @param userId The unique user ID.
 * @returns The AI's response, save confirmation, or load status.
 */
export const handleLangChainChat = async (userMessage: string, userId: string): Promise<string> => {
  const chat = new ChatOpenAI({
    temperature: 0.5,
    modelName: 'gpt-4',
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // Initialize user conversation if it doesn't exist
  if (!userConversations[userId]) {
    userConversations[userId] = { messages: [], memory: '' };
  }

  // Static help context for saving and loading conversations
  const helpContext = `
    As a helpful assistant, you can guide the user on saving and loading conversations:
    - To save a conversation, the user can use: /save password.
      Example: /save mypassword123.
    - To load a saved conversation, the user can use: /load CID password.
      Example: /load bafkr6igcno3sajefv2ci2xdzwpdvjzjqijulvdxngichgfypsj6gt7gsa4 mypassword123.
  `;

  // Handle /save command
  if (userMessage.startsWith('/save')) {
    const password = userMessage.split(' ')[1]; // Extract password after /save
    if (!password) {
      return 'Please provide a password using the format: /save password';
    }

    const conversationLog = userConversations[userId].messages;
    const logContent = { userId, conversation: conversationLog, timestamp: new Date().toISOString() };

    try {
      const cid = await uploadFileFromMemory(logContent, `conversation_${userId}_${Date.now()}.json`, password);
      return `Conversation saved successfully!\nCID: ${cid}\nPassword: ${password}`;
    } catch (error) {
      console.error('Failed to upload conversation to Auto Drive:', error);
      return 'An error occurred while saving the conversation. Please try again later.';
    }
  }

  // Handle /load command
  if (userMessage.startsWith('/load')) {
    const [_, cid, password] = userMessage.split(' '); // Extract CID and password
    if (!cid || !password) {
      return 'Please provide both CID and password using the format: /load CID password';
    }

    try {
      const fileContent = await downloadFileFromAutoDrive(cid, password);
      userConversations[userId].memory = JSON.stringify(fileContent, null, 2); // Save memory as string
      return `Memory loaded successfully! CID: ${cid}`;
    } catch (error) {
      console.error('Failed to load memory from Auto Drive:', error);
      return 'An error occurred while loading the memory. Please check the CID and password.';
    }
  }

  // Generate AI response with memory and help context
  try {
    const memory = userConversations[userId].memory;
    const messages = [
      new SystemMessage(helpContext),
      ...(memory ? [new SystemMessage(`Here is some context: ${memory}`)] : []),
      new HumanMessage(userMessage),
    ];

    const response = await chat.invoke(messages);

    // Handle response content and ensure it is a string
    const aiResponse = Array.isArray(response.content)
      ? response.content.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join('\n')
      : typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    // Store conversation history
    userConversations[userId].messages.push({ user: userMessage, ai: aiResponse });

    return aiResponse;
  } catch (error) {
    console.error('Error during Linky chat:', error);
    return 'An error occurred while communicating with Linky. Please try again later.';
  }
};










