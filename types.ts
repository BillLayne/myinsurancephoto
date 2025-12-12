export enum PhotoStatus {
  PENDING = 'PENDING',
  ANALYZING = 'ANALYZING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export interface PhotoRequirement {
  id: string;
  label: string;
  description: string;
  isMandatory: boolean;
}

export interface ClientUploadRequest {
  clientName: string;
  policyNumber: string;
  insuranceCompany?: string;
  address: string;
  requirements: PhotoRequirement[];
  agentEmail?: string;
}

export interface UploadedFile {
  requirementId: string;
  file: File;
  previewUrl: string;
  status: PhotoStatus;
  aiFeedback?: string;
}