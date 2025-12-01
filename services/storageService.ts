import { FormSchema, FormResponse } from '../types';

// TU URL MAESTRA DE GOOGLE APPS SCRIPT
const MASTER_SHEET_URL = "https://script.google.com/macros/s/AKfycbyQscuJzzO-2lQQiTwuNTL0-LrCQ-82LcVa8npwaK7AuG7LJa4sCLqJKSmL5qDZG851/exec";

export const storageService = {
  // --- Forms (CLOUD SYNC) ---
  
  fetchForms: async (): Promise<FormSchema[]> => {
    try {
      const response = await fetch(MASTER_SHEET_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'get_forms' })
      });
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("Error fetching forms from cloud", e);
      return [];
    }
  },

  saveForm: async (form: FormSchema): Promise<void> => {
    try {
      await fetch(MASTER_SHEET_URL, {
        method: 'POST',
        mode: 'no-cors', // Apps Script restriction
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ 
          action: 'save_form', 
          form: form 
        })
      });
      // Note: With no-cors we can't read the response, but we assume success/optimistic UI
    } catch (e) {
      console.error("Error saving form to cloud", e);
      throw e;
    }
  },

  deleteForm: async (id: string): Promise<void> => {
    try {
      await fetch(MASTER_SHEET_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ 
          action: 'delete_form', 
          id: id 
        })
      });
    } catch (e) {
      console.error("Error deleting form from cloud", e);
    }
  },

  // --- Responses (LOCAL CACHE ONLY FOR ADMIN VIEWER) ---
  // Las respuestas reales van directo a Sheet desde el FormRenderer.
  // Esto es solo para la vista previa "Local" del admin si se usa.
  saveResponseLocal: (response: FormResponse): void => {
    try {
      const RESPONSES_KEY = 'novaform_responses';
      const data = localStorage.getItem(RESPONSES_KEY);
      const responses: FormResponse[] = data ? JSON.parse(data) : [];
      responses.push(response);
      localStorage.setItem(RESPONSES_KEY, JSON.stringify(responses));
    } catch (e) {
      console.error("Error saving local response", e);
    }
  },
  
  getResponsesByFormIdLocal: (formId: string): FormResponse[] => {
     try {
      const RESPONSES_KEY = 'novaform_responses';
      const data = localStorage.getItem(RESPONSES_KEY);
      const responses: FormResponse[] = data ? JSON.parse(data) : [];
      return responses.filter(r => r.formId === formId);
    } catch (e) {
      return [];
    }
  }
};