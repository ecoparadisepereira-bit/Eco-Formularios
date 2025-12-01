import { FormSchema, FormResponse } from '../types';

// TU URL MAESTRA DE GOOGLE APPS SCRIPT
const MASTER_SHEET_URL = "https://script.google.com/macros/s/AKfycbyQscuJzzO-2lQQiTwuNTL0-LrCQ-82LcVa8npwaK7AuG7LJa4sCLqJKSmL5qDZG851/exec";

export const storageService = {
  // --- Forms (CLOUD SYNC) ---
  
  fetchForms: async (): Promise<FormSchema[]> => {
    try {
      // Usamos text/plain para evitar Preflight CORS complejo
      const response = await fetch(MASTER_SHEET_URL, {
        method: 'POST',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
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
        mode: 'no-cors', // Escribir sin esperar respuesta legible (CORS opaco)
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ 
          action: 'save_form', 
          form: form 
        })
      });
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

  // --- Responses (CLOUD SYNC) ---
  
  fetchResponses: async (formId: string, sheetUrl?: string): Promise<FormResponse[]> => {
    try {
       // CRITICAL: Use the custom sheet URL if provided, otherwise fallback to Master
       const targetUrl = sheetUrl && sheetUrl.length > 10 ? sheetUrl : MASTER_SHEET_URL;

       const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ 
            action: 'get_responses',
            formId: formId
        })
      });
      const rawData = await response.json();
      
      // Mapear datos planos del Excel a estructura FormResponse
      if (Array.isArray(rawData)) {
        return rawData.map((row: any) => ({
            id: Math.random().toString(36).substr(2, 9), // ID temporal para la vista
            formId: formId,
            submittedAt: new Date(row.Fecha || Date.now()).getTime(),
            answers: row // Pasamos todo el objeto fila como respuestas
        }));
      }
      return [];
    } catch (e) {
        console.error("Error fetching responses from cloud", e);
        return [];
    }
  },

  // Método legacy local (ya no se usa como fuente principal)
  saveResponseLocal: (response: FormResponse): void => {
     // No-op o backup temporal
  },
  
  getResponsesByFormIdLocal: (formId: string): FormResponse[] => {
      return [];
  }
};