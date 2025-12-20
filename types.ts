
// Enum for Field Types
export enum FieldType {
  SHORT_TEXT = 'short_text',
  LONG_TEXT = 'long_text',
  NUMBER = 'number',
  SINGLE_SELECT = 'single_select',
  CHECKBOX = 'checkbox', 
  DATE = 'date',         
  TIME = 'time',         
  IMAGE_UPLOAD = 'image_upload',
  PRODUCT = 'product',   
  PAYMENT = 'payment',
  ADDITIONAL_PERSON = 'additional_person', 
  STAR_RATING = 'star_rating', // NEW: Star rating field
}

// Validation Rules
export interface ValidationRules {
  min?: number;
  max?: number;
  maxSizeMB?: number; 
  acceptedFormats?: string[]; 
}

export interface ProductOption {
  label: string;
  price: number;
  isPerNight?: boolean;
}

// Field Definition
export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; 
  productOptions?: ProductOption[]; 
  validation?: ValidationRules;
  // Configuration for Additional Person
  additionalPrice?: number;
  isPerNight?: boolean;
}

// Thank You Screen Configuration
export interface ThankYouScreen {
  title: string;
  message: string; 
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
  googleSheetUrl?: string; 
  backgroundImageUrl?: string; 
}

// Form Response
export interface FormResponse {
  id: string;
  formId: string;
  submittedAt: number;
  answers: Record<string, any>; 
}

// Global App Configuration
export interface AppConfig {
  appName: string;
  logoUrl: string;
  faviconUrl: string;
  loginImageUrl: string; 
}
