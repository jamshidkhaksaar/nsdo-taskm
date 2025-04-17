export * from './index';

// Add this new type for the creation payload
export interface CreateDepartmentPayload {
  name: string;
  description?: string;
  head?: string | null; // User ID (UUID string) or null
  provinceId?: string | null; // Province ID (UUID string) or null
}

// Interface for Task entity
// ... existing code ...