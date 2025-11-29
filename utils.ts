import { FormSchema } from './types';

// Simple Base64 encode/decode for demo purposes. 
// In production, use 'lz-string' for better compression on long JSONs.

export const encodeFormToUrl = (form: FormSchema): string => {
  try {
    const json = JSON.stringify(form);
    return btoa(encodeURIComponent(json));
  } catch (e) {
    console.error("Error encoding form", e);
    return "";
  }
};

export const decodeFormFromUrl = (encoded: string): FormSchema | null => {
  try {
    const json = decodeURIComponent(atob(encoded));
    return JSON.parse(json);
  } catch (e) {
    console.error("Error decoding form", e);
    return null;
  }
};