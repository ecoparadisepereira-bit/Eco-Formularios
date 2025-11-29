import { FormSchema, FormResponse } from '../types';

const FORMS_KEY = 'novaform_forms';
const RESPONSES_KEY = 'novaform_responses';

export const storageService = {
  // --- Forms ---
  getForms: (): FormSchema[] => {
    try {
      const data = localStorage.getItem(FORMS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading forms", e);
      return [];
    }
  },

  saveForm: (form: FormSchema): void => {
    const forms = storageService.getForms();
    const index = forms.findIndex(f => f.id === form.id);
    if (index >= 0) {
      forms[index] = form;
    } else {
      forms.push(form);
    }
    localStorage.setItem(FORMS_KEY, JSON.stringify(forms));
  },

  deleteForm: (id: string): void => {
    const forms = storageService.getForms().filter(f => f.id !== id);
    localStorage.setItem(FORMS_KEY, JSON.stringify(forms));
  },

  getFormById: (id: string): FormSchema | undefined => {
    return storageService.getForms().find(f => f.id === id);
  },

  // --- Responses ---
  saveResponse: (response: FormResponse): void => {
    try {
      const data = localStorage.getItem(RESPONSES_KEY);
      const responses: FormResponse[] = data ? JSON.parse(data) : [];
      responses.push(response);
      localStorage.setItem(RESPONSES_KEY, JSON.stringify(responses));
    } catch (e) {
      console.error("Error saving response", e);
    }
  },
  
  getResponsesByFormId: (formId: string): FormResponse[] => {
     try {
      const data = localStorage.getItem(RESPONSES_KEY);
      const responses: FormResponse[] = data ? JSON.parse(data) : [];
      return responses.filter(r => r.formId === formId);
    } catch (e) {
      return [];
    }
  }
};
