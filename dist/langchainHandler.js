"use strict";
// src/langchainHandler.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleLangChainChat = void 0;
const openai_1 = require("@langchain/openai");
const messages_1 = require("@langchain/core/messages");
const dotenv_1 = __importDefault(require("dotenv"));
const drive_1 = require("./drive");
dotenv_1.default.config(); // Load environment variables from .env file
const userConversations = {};
/**
 * Handle user chat with the AI and optionally save/load the conversation.
 * @param userMessage The user's input message.
 * @param userId The unique user ID.
 * @returns The AI's response, save confirmation, or load status.
 */
const handleLangChainChat = (userMessage, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const chat = new openai_1.ChatOpenAI({
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
            const cid = yield (0, drive_1.uploadFileFromMemory)(logContent, `conversation_${userId}_${Date.now()}.json`, password);
            return `Conversation saved successfully!\nCID: ${cid}\nPassword: ${password}`;
        }
        catch (error) {
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
            const fileContent = yield (0, drive_1.downloadFileFromAutoDrive)(cid, password);
            userConversations[userId].memory = JSON.stringify(fileContent, null, 2); // Save memory as string
            return `Memory loaded successfully! CID: ${cid}`;
        }
        catch (error) {
            console.error('Failed to load memory from Auto Drive:', error);
            return 'An error occurred while loading the memory. Please check the CID and password.';
        }
    }
    // Generate AI response with memory and help context
    try {
        const memory = userConversations[userId].memory;
        const messages = [
            new messages_1.SystemMessage(helpContext),
            ...(memory ? [new messages_1.SystemMessage(`Here is some context: ${memory}`)] : []),
            new messages_1.HumanMessage(userMessage),
        ];
        const response = yield chat.invoke(messages);
        // Handle response content and ensure it is a string
        const aiResponse = Array.isArray(response.content)
            ? response.content.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join('\n')
            : typeof response.content === 'string'
                ? response.content
                : JSON.stringify(response.content);
        // Store conversation history
        userConversations[userId].messages.push({ user: userMessage, ai: aiResponse });
        return aiResponse;
    }
    catch (error) {
        console.error('Error during Linky chat:', error);
        return 'An error occurred while communicating with Linky. Please try again later.';
    }
});
exports.handleLangChainChat = handleLangChainChat;
