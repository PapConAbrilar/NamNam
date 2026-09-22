export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  hasCompletedOnboarding?: boolean;
}

export interface UserCredentials {
  email: string;
  password?: string;
  name?: string;
}

