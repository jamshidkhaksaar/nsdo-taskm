export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Card {
  id: number;
  title: string;
  description: string;
  order: number;
  list_id: number;
}

export interface List {
  id: number;
  title: string;
  board_id: number;
  order: number;
  cards: Card[];
}

export interface Board {
  id: number;
  title: string;
  description: string;
  owner: number;
  members: number[];
  lists: List[];
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface BoardState {
  boards: Board[];
  currentBoard: Board | null;
  loading: boolean;
  error: string | null;
}

export interface RootState {
  auth: AuthState;
  board: BoardState;
} 