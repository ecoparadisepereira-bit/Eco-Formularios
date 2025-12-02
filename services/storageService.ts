import { FormSchema, FormResponse } from '../types';

// TU URL MAESTRA DE GOOGLE APPS SCRIPT
const MASTER_SHEET_URL = "https://script.google.com/macros/s/AKfycbyQscuJzzO-2lQQiTwuNTL0-LrCQ-82LcVa8npwaK7AuG7LJa4sCLqJKSmL5qDZG851/exec";

export const storageService = {
  // --- Forms (CLOUD SYNC) ---
  
  fetchForms: async (): Promise<FormSchema[]> => {
    try {
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
        mode: 'no-cors',
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

       // IMPORTANTE: NO enviamos formId en el cuerpo para pedir TODAS las filas.
       const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ 
            action: 'get_responses'
        })
      });
      
      const rawData = await response.json();
      
      // DIAGNÓSTICO: Si recibimos { result: "success" } pero no un array, 
      // significa que el script ejecutó la lógica de GUARDAR (fallback) en lugar de LEER.
      // Esto pasa cuando el usuario no ha desplegado la NUEVA versión del script.
      if (!Array.isArray(rawData) && rawData && rawData.result === 'success') {
          throw new Error("SCRIPT_OUTDATED");
      }

      // Mapear datos planos del Excel a estructura FormResponse
      if (Array.isArray(rawData)) {
        return rawData.map((row: any) => ({
            id: Math.random().toString(36).substr(2, 9), // ID temporal para la vista
            formId: row.formId || 'unknown', // Usamos el del excel o desconocido
            submittedAt: row.Fecha ? new Date(row.Fecha).getTime() : Date.now(),
            answers: row // Pasamos todo el objeto fila como respuestas
        }));
      }
      return [];
    } catch (e: any) {
        console.error("Error fetching responses from cloud", e);
        if (e.message === "SCRIPT_OUTDATED") {
            throw e;
        }
        return [];
    }
  },

  // Método legacy local (ya no se usa como fuente principal)
  saveResponseLocal: (response: FormResponse): void => {
     // No-op
  },
  
  getResponsesByFormIdLocal: (formId: string): FormResponse[] => {
      return [];
  }
};