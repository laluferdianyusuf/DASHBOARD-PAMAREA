import type { RoleName } from "../enums/prisma-enums";

// Data role yang diterima dari API
export interface RoleResponse {
  id: string;
  name: RoleName;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// Data role beserta jumlah user yang menggunakannya
export interface RoleWithCountResponse extends RoleResponse {
  _count: {
    users: number;
  };
}

// Payload untuk membuat role
export interface CreateRoleRequest {
  name: string;
  description?: string | null;
}

// Payload untuk memperbarui role
export interface UpdateRoleRequest {
  name?: string;
  description?: string | null;
}
