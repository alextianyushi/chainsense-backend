"use strict";
// src/index.ts
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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const langchainHandler_1 = require("./langchainHandler");
dotenv_1.default.config(); // Load environment variables from .env file
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
// Middleware
app.use((0, cors_1.default)({ origin: 'https://chainsense-frontend.vercel.app/' }));
app.use(express_1.default.json()); // Parse incoming JSON requests
// Route to handle chat messages
app.post('/api/chat', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userMessage = req.body.message;
    const userId = req.body.userId || 'default_user'; // Use 'default_user' if userId is not provided
    if (!userMessage) {
        res.status(400).json({ error: 'No message provided' });
        return;
    }
    try {
        // Call LangChain handler with user message and userId
        const aiReply = yield (0, langchainHandler_1.handleLangChainChat)(userMessage, userId);
        res.json({ reply: aiReply });
    }
    catch (error) {
        console.error('Error communicating with AI:', error.message);
        res.status(500).json({ error: 'Error communicating with AI' });
    }
}));
// Route to handle loading memory from Auto Drive
app.post('/api/load', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { cid, password, userId } = req.body;
    if (!cid || !password || !userId) {
        res.status(400).json({ error: 'Missing CID, password, or userId' });
        return;
    }
    try {
        // Send the /load command to LangChain handler
        const loadResponse = yield (0, langchainHandler_1.handleLangChainChat)(`/load ${cid} ${password}`, userId);
        res.json({ message: loadResponse });
    }
    catch (error) {
        console.error('Error loading memory:', error.message);
        res.status(500).json({ error: 'Failed to load memory from Auto Drive' });
    }
}));
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
