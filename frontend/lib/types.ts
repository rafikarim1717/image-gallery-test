export const CATEGORIES = ["nature", "architecture", "people", "technology"] as const;
export type Category = (typeof CATEGORIES)[number];

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ImageItem {
  id: string;
  title: string;
  category: Category;
  url: string;
  imageUrl: string; // normalized, ready for <img src>
  clickCount: number;
  createdAt: string;
  userId: string | null; // null = seed image, read-only
}

export interface ImageListResponse {
  images: ImageItem[];
  total: number;
}

export interface ApiErrorBody {
  message: string | string[];
  error?: string;
  statusCode: number;
}
