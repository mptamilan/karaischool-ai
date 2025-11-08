/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// Chat message
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string; // ISO timestamp
}

// Generate API
export interface GenerateRequest {
  prompt: string;
}

export interface GenerateResponse {
  text: string;
  usage: { remaining: number; limit: number };
  timestamp: string;
  error?: string;
}
