import type { RoleName } from "../enums/prisma-enums";

// Data role
export interface Role {
  id: string;
  name: string;
  description: string | null;

  createdAt: string;
  updatedAt: string;
}

// Payload untuk membuat role
export interface CreateRoleRequest {
  name: RoleName;
  description?: string | null;
}

// Payload untuk memperbarui role
export interface UpdateRoleRequest {
  name?: RoleName;
  description?: string | null;
}
