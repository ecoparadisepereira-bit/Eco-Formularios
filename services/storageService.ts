import { FormSchema, FormResponse, AppConfig } from '../types';

// TU URL MAESTRA DE GOOGLE APPS SCRIPT
const MASTER_SHEET_URL = "https://script.google.com/macros/s/AKfycbyQscuJzzO-2lQQiTwuNTL0-LrCQ-82LcVa8npwaK7AuG7LJa4sCLqJKSmL5qDZG851/exec";

export const storageService = {
  // --- Global Config (CLOUD SYNC) ---
  fetchGlobalConfig: async (): Promise<AppConfig | null> => {
      try {
          const response = await fetch(MASTER_SHEET_URL, {
              method: 'POST',
              headers: { "Content-Type": "text/plain;charset=utf-8" },
              body: JSON.stringify({ action: 'get_config' })
          });
          const data = await response.json();
          if (data && data.appName) {
              return data as AppConfig;
          }
          return null;
      } catch (e) {
          console.error("Error loading global config", e);
          return null;
      }
  },

  saveGlobalConfig: async (config: AppConfig): Promise<void> => {
      try {
          await fetch(MASTER_SHEET_URL, {
              method: 'POST',
              mode: 'no-cors',
              headers: { 'Content-Type': 'text/plain' },
              body: JSON.stringify({ 
                  action: 'save_config', 
                  config: config 
              })
          });
      } catch (e) {
          console.error("Error saving global config", e);
          throw e;
      }
  },

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

  fetchFormById: async (id: string): Promise<FormSchema | null> => {
      try {
        // Obtenemos todos los formularios y filtramos en el cliente (Estrategia más segura para este backend)
        const response = await fetch(MASTER_SHEET_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: 'get_forms' })
        });
        const data = await response.json();
        if (Array.isArray(data)) {
            const found = data.find((f: any) => f.id === id);
            return found || null;
        }
        return null;
      } catch (e) {
          console.error("Error fetching specific form", e);
          return null;
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

       const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ 
            action: 'get_responses'
        })
      });
      
      const rawData = await response.json();
      
      if (!Array.isArray(rawData) && rawData && rawData.result === 'success') {
          throw new Error("SCRIPT_OUTDATED");
      }

      if (Array.isArray(rawData)) {
        return rawData.map((row: any) => {
            // FIX: Desempaquetar respuestas anidadas del nuevo Script
            const realAnswers = row.answers ? row.answers : row;
            
            let time = Date.now();
            if (row.submittedAt) time = new Date(row.submittedAt).getTime();
            else if (row.Fecha) time = new Date(row.Fecha).getTime();

            return {
                id: Math.random().toString(36).substr(2, 9),
                formId: row.formId || 'unknown',
                submittedAt: time,
                answers: realAnswers 
            };
        });
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

  saveResponseLocal: (response: FormResponse): void => {
     // No-op
  },
  
  getResponsesByFormIdLocal: (formId: string): FormResponse[] => {
      return [];
  }
};