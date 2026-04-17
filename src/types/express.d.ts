declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: 'MEMBER' | 'ADMIN';
        isActive: boolean;
      };
    }
  }
}

export {};
