// Enum for Field Types
export enum FieldType {
  SHORT_TEXT = 'short_text',
  LONG_TEXT = 'long_text',
  NUMBER = 'number',
  SINGLE_SELECT = 'single_select',
  CHECKBOX = 'checkbox', // NEW: Multi-select
  DATE = 'date',         // NEW
  TIME = 'time',         // NEW
  IMAGE_UPLOAD = 'image_upload',
}

// Validation Rules
export interface ValidationRules {
  min?: number;
  max?: number;
  maxSizeMB?: number; // For images
  acceptedFormats?: string[]; // e.g. ['image/jpeg', 'image/png']
}

// Field Definition
export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For Select and Checkbox
  validation?: ValidationRules;
}

// Thank You Screen Configuration
export interface ThankYouScreen {
  title: string;
  message: string; // Rich text (simple markdown or html)
  redirectUrl?: string;
  buttonText?: string;
}

// Form Schema
export interface FormSchema {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: number;
  fields: FormField[];
  thankYouScreen: ThankYouScreen;
  googleSheetUrl?: string; // NEW: Webhook URL for Google Sheets
}

// Form Response
export interface FormResponse {
  id: string;
  formId: string;
  submittedAt: number;
  answers: Record<string, string | number | string[] | null>; // Field ID -> Value
}