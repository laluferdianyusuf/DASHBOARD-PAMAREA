export interface PatrolPhoto {
  id: string;
  patrolId: string;
  answerId?: string | null;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  latitude?: number | null;
  longitude?: number | null;
  capturedAt?: string | null;
  createdAt: string;
}
export interface SubmitPatrolPhotoRequest {
  answerId?: string;
  latitude?: number;
  longitude?: number;
  capturedAt?: string;
}
export interface CreatePatrolPhotoRequest {
  patrolId: string;
  answerId?: string | null;

  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;

  latitude?: number | null;
  longitude?: number | null;
  capturedAt?: string | null;
}

export interface PatrolPhotoQuery {
  patrolId?: string;
  answerId?: string;
}
