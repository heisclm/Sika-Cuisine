import { Role } from "./order";

export interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: Role;
  createdAt: string;
}

export interface AuthSessionDTO {
  user: UserDTO;
  token?: string; // JWT token returned for mobile / bearer clients
  expiresAt: string;
}
