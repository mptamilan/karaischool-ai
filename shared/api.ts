export interface GenerateRequest {
  prompt: string;
}

export interface GenerateResponse {
  text: string;
  timestamp: string;
  usage: {
    remaining: number;
    limit: number;
  };
}

export interface User {
  id: number;
  google_sub: string;
  name: string;
  email: string;
  picture?: string;
  created_at: string;
}
