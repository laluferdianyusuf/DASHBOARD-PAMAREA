export interface FindingPhoto {
  id: string;
  findingId: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}
export interface CreateFindingPhotoRequest {
  findingId: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}
export interface UploadFindingPhotoRequest {
  findingId: string;
  file: File;
}
export interface FindingPhotoQuery {
  findingId?: string;
}
