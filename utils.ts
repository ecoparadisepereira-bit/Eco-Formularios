import { FormSchema } from './types';

// Simple Base64 encode/decode for demo purposes. 

export const encodeFormToUrl = (form: FormSchema): string => {
  try {
    const json = JSON.stringify(form);
    // encodeURIComponent is essential to handle Unicode characters correctly before btoa
    return btoa(encodeURIComponent(json));
  } catch (e) {
    console.error("Error encoding form", e);
    return "";
  }
};

export const decodeFormFromUrl = (encoded: string): FormSchema | null => {
  try {
    // Attempt standard decode
    // URLSearchParams automatically decodes %2B to +, but if the link was generated 
    // incorrectly without encoding, spaces might have replaced + signs.
    
    // Fix common URL Base64 corruption (spaces instead of pluses)
    let safeEncoded = encoded.replace(/ /g, '+');
    
    const json = decodeURIComponent(atob(safeEncoded));
    return JSON.parse(json);
  } catch (e) {
    console.error("Error decoding form", e);
    return null;
  }
};