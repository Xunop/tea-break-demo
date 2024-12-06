// Type Definitions
export interface User {
  id?: string;
  username?: string;
  email?: string;
  password?: string;
  role?: number;
}

export interface Reporter {
  id: string;
  username: string;
  email: string;
  password: string;
  qualification: string;
  applyNote: string;
}

export interface PaperFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface Paper {
  id?: number;
  title: string;
  author: string;
  conference: string;
  year: number;
  abstract?: string;
  file?: number;
  fileSize?: string;
  paperPath?: string;
  attachmentTag?: number;
  createTime?: string;
}

export interface Comment {
  id: string;
  pid?: string;
  userId?: string;
  content?: string;
  createAt?: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
  children?: Comment[];
}

export interface PaperStats {
  id: string;
  downloads: number;
  views: number;
  comments: number;
}
