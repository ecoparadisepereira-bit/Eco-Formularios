import React, { useState } from 'react';
import { FormSchema } from '../../types';
import { PlusIcon, EditIcon, TrashIcon, CheckIcon, TableIcon, LinkIcon } from '../ui/Icons';
import { encodeFormToUrl } from '../../utils';

interface DashboardProps {
  forms: FormSchema[];
  onCreate: () => void;
  onEdit: (form: FormSchema) => void;
  onDelete: (id: string) => void;
  onViewClient: (form: FormSchema) => void;
  onViewResponses: (form: FormSchema) => void;
  onToggleStatus: (form: FormSchema) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  forms, 
  onCreate, 
  onEdit, 
  onDelete, 
  onViewClient, 
  onViewResponses,
  onToggleStatus 
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleShare = (form: FormSchema) => {
    // We encode the ENTIRE form definition into the URL
    // This allows the client to open it without a backend database for the schema
    const encoded = encodeFormToUrl(form);
    
    // Use window.location.href (without query params) to support subpaths/deployments
    const baseUrl = window.location.href.split('?')[0];
    
    // IMPORTANT: encodeURIComponent is crucial here because Base64 contains '+' 
    // which URLSearchParams interprets as a space, breaking the data.
    const url = `${baseUrl}?data=${encodeURIComponent(encoded)}`;
    
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(form.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#043200] tracking-tight">Panel de Control</h1>
          <p className="text-gray-500 mt-1">Gestiona formularios y analiza las respuestas de tus clientes.</p>
        </div>
        <button 
          onClick={onCreate}
          className="flex items-center gap-2 bg-[#043200] text-white px-5 py-3 rounded-xl hover:bg-[#064e00] transition-all font-medium shadow-lg hover:shadow-xl shadow-green-900/20"
        >
          <PlusIcon className="w-5 h-5" />
          Crear Nuevo
        </button>
      </div>

      {forms.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <PlusIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No tienes formularios aún</h3>
          <p className="text-gray-500 mt-1 max-w-sm mx-auto">Comienza creando uno manualmente o usa nuestra IA para generarlo en segundos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map(form => (
            <div key={form.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 group flex flex-col justify-between h-full">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${form.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {form.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onToggleStatus(form)} title={form.isActive ? "Desactivar" : "Activar"} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                      <CheckIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => onEdit(form)} title="Editar Estructura" className="p-2 hover:bg-green-50 hover:text-green-700 rounded-lg text-gray-500 transition-colors">
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(form.id)} title="Eliminar" className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-gray-500 transition-colors">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 truncate" title={form.title}>{form.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 h-10">{form.description || 'Sin descripción'}</p>
                <div className="mt-4 text-xs text-gray-400 font-medium flex items-center gap-2">
                   <span className="bg-gray-100 px-2 py-1 rounded">{form.fields.length} campos</span>
                   <span>•</span>
                   <span>{form.googleSheetUrl ? 'Sincronizado con Sheets' : 'Local'}</span>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
                 <button 
                  onClick={() => handleShare(form)}
                  className={`col-span-2 flex items-center justify-center gap-2 py-2 px-3 ${copiedId === form.id ? 'bg-green-600 text-white' : 'bg-green-50 text-green-800'} font-medium rounded-lg hover:brightness-95 transition-all text-sm shadow-sm`}
                >
                  <LinkIcon className="w-4 h-4" />
                  {copiedId === form.id ? '¡Enlace Copiado!' : 'Copiar Enlace Público'}
                </button>
                <button 
                  onClick={() => onViewResponses(form)}
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:border-green-300 hover:text-green-700 transition-all text-sm shadow-sm"
                >
                  <TableIcon className="w-4 h-4" />
                  Local
                </button>
                <button 
                  onClick={() => onViewClient(form)}
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-all text-sm shadow-md"
                >
                  Vista Previa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};