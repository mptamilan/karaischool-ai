const API_BASE_URL = 'https://karaischoolai-server.vercel.app';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface ChatRequest {
  message: string;
  model?: string;
  history?: ChatMessage[];
}

export interface GenerateRequest {
  prompt: string;
  model?: string;
}

export interface ApiResponse {
  success: boolean;
  response?: string;
  model?: string;
  error?: string;
  timestamp?: string;
}

export class GeminiApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'GeminiApiError';
  }
}

// Utility function to delay execution
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry wrapper for fetch calls
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Retry on server errors (5xx) or rate limit (429)
      if (response.status >= 500 || response.status === 429) {
        if (attempt < retries) {
          const waitTime = RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
          console.warn(`Attempt ${attempt} failed with status ${response.status}. Retrying in ${waitTime}ms...`);
          await delay(waitTime);
          continue;
        }
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      
      // Retry on network errors
      if (attempt < retries) {
        const waitTime = RETRY_DELAY * Math.pow(2, attempt - 1);
        console.warn(`Attempt ${attempt} failed: ${lastError.message}. Retrying in ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }
    }
  }

  throw new GeminiApiError(
    `Request failed after ${retries} attempts: ${lastError?.message}`,
    undefined,
    false
  );
}

// Chat with conversation history
export async function chatWithGemini(
  message: string,
  history: ChatMessage[] = [],
  model: string = 'gemini-1.5-flash-latest'
): Promise<string> {
  if (!message || message.trim().length === 0) {
    throw new GeminiApiError('Message cannot be empty', 400, false);
  }

  try {
    const response = await fetchWithRetry(
      `${API_BASE_URL}/api/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          history,
          model,
        } as ChatRequest),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      
      const isRetryable = response.status === 429 || response.status >= 500;
      throw new GeminiApiError(
        errorData.error || `Request failed with status ${response.status}`,
        response.status,
        isRetryable
      );
    }

    const data: ApiResponse = await response.json();

    if (!data.success || !data.response) {
      throw new GeminiApiError(
        data.error || 'No response received from AI',
        undefined,
        false
      );
    }

    return data.response;
  } catch (error) {
    if (error instanceof GeminiApiError) {
      throw error;
    }
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new GeminiApiError('Request timeout', 408, true);
      }
      throw new GeminiApiError(`Network error: ${error.message}`, undefined, true);
    }
    
    throw new GeminiApiError('Unknown error occurred', undefined, false);
  }
}

// Simple content generation
export async function generateContent(
  prompt: string,
  model: string = 'gemini-1.5-flash-latest'
): Promise<string> {
  if (!prompt || prompt.trim().length === 0) {
    throw new GeminiApiError('Prompt cannot be empty', 400, false);
  }

  try {
    const response = await fetchWithRetry(
      `${API_BASE_URL}/api/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model,
        } as GenerateRequest),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      
      const isRetryable = response.status === 429 || response.status >= 500;
      throw new GeminiApiError(
        errorData.error || `Request failed with status ${response.status}`,
        response.status,
        isRetryable
      );
    }

    const data: ApiResponse = await response.json();

    if (!data.success || !data.response) {
      throw new GeminiApiError(
        data.error || 'No response received from AI',
        undefined,
        false
      );
    }

    return data.response;
  } catch (error) {
    if (error instanceof GeminiApiError) {
      throw error;
    }
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new GeminiApiError('Request timeout', 408, true);
      }
      throw new GeminiApiError(`Network error: ${error.message}`, undefined, true);
    }
    
    throw new GeminiApiError('Unknown error occurred', undefined, false);
  }
}

// Streaming content generation
export async function streamContent(
  prompt: string,
  onChunk: (text: string) => void,
  onError?: (error: GeminiApiError) => void,
  model: string = 'gemini-1.5-flash-latest'
): Promise<void> {
  if (!prompt || prompt.trim().length === 0) {
    const error = new GeminiApiError('Prompt cannot be empty', 400, false);
    onError?.(error);
    throw error;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        model,
      } as GenerateRequest),
    });

    if (!response.ok) {
      const error = new GeminiApiError(
        `Stream request failed with status ${response.status}`,
        response.status,
        response.status === 429 || response.status >= 500
      );
      onError?.(error);
      throw error;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      const error = new GeminiApiError('Response body is not readable', undefined, false);
      onError?.(error);
      throw error;
    }

    const decoder = new TextDecoder();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '[DONE]') {
              return;
            }
            
            if (data) {
              try {
                const parsed = JSON.parse(data);
                
                if (parsed.text) {
                  onChunk(parsed.text);
                } else if (parsed.error) {
                  const error = new GeminiApiError(parsed.error, undefined, false);
                  onError?.(error);
                  throw error;
                }
              } catch (parseError) {
                if (parseError instanceof GeminiApiError) {
                  throw parseError;
                }
                // Skip invalid JSON chunks
                continue;
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    if (error instanceof GeminiApiError) {
      onError?.(error);
      throw error;
    }
    
    if (error instanceof Error) {
      const geminiError = new GeminiApiError(
        `Stream error: ${error.message}`,
        undefined,
        true
      );
      onError?.(geminiError);
      throw geminiError;
    }
    
    const unknownError = new GeminiApiError('Unknown streaming error occurred', undefined, false);
    onError?.(unknownError);
    throw unknownError;
  }
}

// Health check
export async function checkApiHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_BASE_URL}/api/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    
    if (!response.ok) return false;
    
    const data = await response.json();
    return data.status === 'ok' && data.apiKeyConfigured === true;
  } catch {
    return false;
  }
}

// Get API base URL (useful for debugging)
export function getApiUrl(): string {
  return API_BASE_URL;
}