import React, { useEffect, useState } from 'react';
import { FormSchema, FormResponse, FieldType } from '../../types';
import { storageService } from '../../services/storageService';
import { ArrowLeftIcon, DownloadIcon, SearchIcon, RefreshIcon } from '../ui/Icons';

interface ResponseViewerProps {
  form: FormSchema;
  onBack: () => void;
}

export const ResponseViewer: React.FC<ResponseViewerProps> = ({ form, onBack }) => {
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Helper para buscar valores de forma tolerante (ignora mayúsculas y espacios extra)
  const getFuzzyValue = (answers: any, label: string) => {
    if (!answers) return '';
    // 1. Intento exacto
    if (answers[label] !== undefined) return answers[label];
    
    // 2. Intento difuso (buscando keys)
    const normalizedLabel = label.toLowerCase().trim();
    const foundKey = Object.keys(answers).find(k => k.toLowerCase().trim() === normalizedLabel);
    
    return foundKey ? answers[foundKey] : '';
  };

  const loadData = async () => {
    setLoading(true);
    // Traemos TODAS las respuestas de la hoja
    const allData = await storageService.fetchResponses(form.id, form.googleSheetUrl);
    
    // FILTRADO INTELIGENTE:
    // Solo nos quedamos con las filas que tengan AL MENOS UN dato que coincida con los campos de este formulario.
    // Esto descarta filas vacías o de otros formularios que comparten hoja.
    const relevantData = allData.filter(row => {
        // Si tiene el ID exacto, pasa seguro
        if (row.formId === form.id) return true;

        // Si no tiene ID o es distinto, verificamos si tiene respuestas para nuestros campos
        const hasMatchingAnswers = form.fields.some(field => {
            const val = getFuzzyValue(row.answers, field.label);
            return val !== '' && val !== null && val !== undefined;
        });
        return hasMatchingAnswers;
    });

    // Ordenar por fecha descendente
    setResponses(relevantData.sort((a, b) => b.submittedAt - a.submittedAt));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [form.id]);

  // Lógica de Búsqueda
  const filteredResponses = responses.filter(r => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();
    
    // Buscar en fecha
    if (new Date(r.submittedAt).toLocaleString().toLowerCase().includes(lowerTerm)) return true;

    // Buscar en valores de respuesta
    return form.fields.some(field => {
        const val = getFuzzyValue(r.answers, field.label);
        return String(val).toLowerCase().includes(lowerTerm);
    });
  });

  const downloadCSV = () => {
    // 1. Headers
    const headers = ['Fecha Envío', ...form.fields.map(f => f.label.replace(/,/g, ''))]; 
    
    // 2. Rows
    const rows = filteredResponses.map(r => {
      const date = new Date(r.submittedAt).toLocaleString();
      const answerCells = form.fields.map(f => {
        let val = getFuzzyValue(r.answers, f.label);
        
        if (f.type === FieldType.IMAGE_UPLOAD && val) {
            return '[Imagen Adjunta]';
        }
        if (val === null || val === undefined) return '';
        // Escape quotes
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      return [date, ...answerCells].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // 3. Trigger Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${form.title.replace(/\s+/g, '_')}_respuestas.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-white rounded-full text-gray-600 transition-colors shadow-sm border border-transparent hover:border-gray-200">
                    <ArrowLeftIcon />
                    </button>
                    <div>
                    <h2 className="text-2xl font-bold text-gray-900">Respuestas: {form.title}</h2>
                    <p className="text-gray-500 text-sm">
                        {loading ? 'Cargando datos...' : `Mostrando ${filteredResponses.length} registros`}
                    </p>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button 
                        onClick={loadData}
                        title="Actualizar Datos"
                        className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-green-700 transition-colors shadow-sm"
                    >
                        <RefreshIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button 
                        onClick={downloadCSV}
                        disabled={filteredResponses.length === 0 || loading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Descargar CSV</span>
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 max-w-md w-full">
                <SearchIcon className="w-5 h-5 text-gray-400 ml-2" />
                <input 
                    type="text" 
                    placeholder="Filtrar por nombre, fecha o respuesta..." 
                    className="w-full py-1.5 px-2 outline-none text-gray-700 placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm('')} 
                        className="text-xs font-bold text-gray-400 hover:text-gray-600 px-2"
                    >
                        LIMPIAR
                    </button>
                )}
            </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Fecha</th>
                  {form.fields.map(field => (
                    <th key={field.id} className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[150px]">
                      {field.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                    <tr>
                        <td colSpan={form.fields.length + 1} className="px-6 py-12 text-center text-gray-500">
                           <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-200 border-t-green-700 mb-2"></div>
                           <p>Analizando hoja de cálculo...</p>
                        </td>
                    </tr>
                ) : filteredResponses.length === 0 ? (
                   <tr>
                     <td colSpan={form.fields.length + 1} className="px-6 py-12 text-center text-gray-400 italic">
                       {responses.length > 0 
                         ? "No se encontraron resultados para tu búsqueda." 
                         : "No se encontraron respuestas compatibles con este formulario en la nube."}
                     </td>
                   </tr>
                ) : (
                  filteredResponses.map((response) => (
                    <tr key={response.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(response.submittedAt).toLocaleString()}
                      </td>
                      {form.fields.map(field => {
                        const val = getFuzzyValue(response.answers, field.label);
                        return (
                        <td key={field.id} className="px-6 py-4 text-sm text-gray-800">
                          {field.type === FieldType.IMAGE_UPLOAD && val ? (
                            <div className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                                <img 
                                    src={val as string} 
                                    alt="User Upload" 
                                    className="w-full h-full object-cover" 
                                />
                                <a 
                                    href={val as string} 
                                    download={`upload_${field.id}.png`}
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                </a>
                            </div>
                          ) : (
                            <span className="line-clamp-2" title={String(val)}>{val || '-'}</span>
                          )}
                        </td>
                      )})}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};