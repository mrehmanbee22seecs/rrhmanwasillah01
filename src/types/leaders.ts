export interface Leader {
  id: string;
  name: string;
  role: string;
  bio: string;
  profileImage: string;
  email: string;
  phone: string;
  linkedIn?: string;
  twitter?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectLeader extends Leader {
  projectId: string;
  specialization?: string;
  yearsOfExperience?: number;
}

export interface EventOrganizer extends Leader {
  eventId: string;
  department?: string;
  responsibilities?: string[];
}
