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
  const [allRawResponses, setAllRawResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllRaw, setShowAllRaw] = useState(false);
  const [errorType, setErrorType] = useState<'none' | 'outdated' | 'generic'>('none');

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

  // Helper para renderizar celdas de forma segura (evita [object Object])
  const renderSafeValue = (val: any) => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'object') {
        try {
            return JSON.stringify(val);
        } catch (e) {
            return '[Dato Complejo]';
        }
    }
    return String(val);
  };

  const loadData = async () => {
    setLoading(true);
    setErrorType('none');
    
    try {
        // Traemos TODAS las respuestas de la hoja
        const allData = await storageService.fetchResponses(form.id, form.googleSheetUrl);
        setAllRawResponses(allData);
        
        // FILTRADO INTELIGENTE:
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
    } catch (err: any) {
        if (err.message === "SCRIPT_OUTDATED") {
            setErrorType('outdated');
        } else {
            setErrorType('generic');
        }
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [form.id]);

  // Selección de dataset (Filtrado o Crudo)
  const dataToDisplay = showAllRaw ? allRawResponses : responses;

  // Lógica de Búsqueda sobre el dataset seleccionado
  const filteredResponses = dataToDisplay.filter(r => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();
    
    // Buscar en fecha
    if (new Date(r.submittedAt).toLocaleString().toLowerCase().includes(lowerTerm)) return true;

    // Buscar en valores de respuesta (Fuzzy o Raw)
    if (showAllRaw) {
        return Object.values(r.answers).some(val => String(val).toLowerCase().includes(lowerTerm));
    } else {
        return form.fields.some(field => {
            const val = getFuzzyValue(r.answers, field.label);
            return String(val).toLowerCase().includes(lowerTerm);
        });
    }
  });

  const downloadCSV = () => {
    // 1. Headers
    const headers = showAllRaw 
        ? ['Fecha', ...Object.keys(allRawResponses[0]?.answers || {}).filter(k => k !== 'Fecha' && k !== 'formId')]
        : ['Fecha Envío', ...form.fields.map(f => f.label.replace(/,/g, ''))]; 
    
    // 2. Rows
    const rows = filteredResponses.map(r => {
      const date = new Date(r.submittedAt).toLocaleString();
      let answerCells: string[] = [];

      if (showAllRaw) {
         // Dump all keys
         const keys = Object.keys(allRawResponses[0]?.answers || {}).filter(k => k !== 'Fecha' && k !== 'formId');
         answerCells = keys.map(k => {
             const val = r.answers[k];
             return `"${renderSafeValue(val).replace(/"/g, '""')}"`;
         });
      } else {
         answerCells = form.fields.map(f => {
            let val = getFuzzyValue(r.answers, f.label);
            if (f.type === FieldType.IMAGE_UPLOAD && val) return '[Imagen Adjunta]';
            return `"${renderSafeValue(val).replace(/"/g, '""')}"`;
         });
      }
      return [date, ...answerCells].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `respuestas_${showAllRaw ? 'RAW' : 'FILTRADAS'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Error Warning */}
        {errorType === 'outdated' && (
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6 rounded shadow-sm">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-orange-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-bold text-orange-800 uppercase tracking-wide">Actualización de Script Necesaria</h3>
                        <div className="mt-2 text-sm text-orange-700">
                            <p>Tu Google Apps Script no soporta la lectura de datos. Por favor sigue estos pasos:</p>
                            <ol className="list-decimal list-inside mt-1 space-y-1">
                                <li>Ve a tu Google Sheet &rarr; Extensiones &rarr; Apps Script.</li>
                                <li>Asegúrate de que el código sea el último que te proporcioné.</li>
                                <li>Haz clic en <strong>Implantar</strong> &rarr; <strong>Gestionar implantaciones</strong>.</li>
                                <li>Haz clic en el icono de lápiz (Editar) arriba a la derecha.</li>
                                <li>En "Versión", selecciona <strong>"Nueva versión"</strong>.</li>
                                <li>Haz clic en <strong>Implantar</strong>.</li>
                            </ol>
                            <button onClick={loadData} className="mt-3 px-3 py-1 bg-orange-200 hover:bg-orange-300 text-orange-900 rounded font-medium text-xs">
                                Ya lo hice, intentar de nuevo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

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
                        {loading ? 'Cargando datos...' : `Mostrando ${filteredResponses.length} registros ${showAllRaw ? '(Modo Crudo)' : ''}`}
                    </p>
                    </div>
                </div>
                
                <div className="flex gap-2 items-center">
                    <div className="flex items-center gap-2 mr-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Ver Todo</span>
                        <button 
                            onClick={() => setShowAllRaw(!showAllRaw)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showAllRaw ? 'bg-green-600' : 'bg-gray-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showAllRaw ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

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
                        <span className="hidden sm:inline">CSV</span>
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 max-w-md w-full">
                <SearchIcon className="w-5 h-5 text-gray-400 ml-2" />
                <input 
                    type="text" 
                    placeholder="Buscar en las respuestas..." 
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
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Fecha</th>
                  
                  {showAllRaw ? (
                     // Show all unique keys found in the first few rows
                     Object.keys(allRawResponses[0]?.answers || {}).filter(k => k !== 'Fecha' && k !== 'formId').map(key => (
                        <th key={key} className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[150px]">{key}</th>
                     ))
                  ) : (
                     form.fields.map(field => (
                        <th key={field.id} className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[150px]">
                        {field.label}
                        </th>
                     ))
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                    <tr>
                        <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                           <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-200 border-t-green-700 mb-2"></div>
                           <p>Conectando con Google Sheets...</p>
                        </td>
                    </tr>
                ) : filteredResponses.length === 0 ? (
                   <tr>
                     <td colSpan={10} className="px-6 py-12 text-center text-gray-400 italic">
                       {responses.length > 0 || allRawResponses.length > 0
                         ? "No se encontraron resultados para tu búsqueda." 
                         : "La hoja de cálculo está vacía o no pudimos leer los datos."}
                     </td>
                   </tr>
                ) : (
                  filteredResponses.map((response) => (
                    <tr key={response.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(response.submittedAt).toLocaleString()}
                      </td>
                      
                      {showAllRaw ? (
                          Object.keys(allRawResponses[0]?.answers || {}).filter(k => k !== 'Fecha' && k !== 'formId').map(key => (
                              <td key={key} className="px-6 py-4 text-sm text-gray-800">
                                  {renderSafeValue(response.answers[key])}
                              </td>
                          ))
                      ) : (
                        form.fields.map(field => {
                            const val = getFuzzyValue(response.answers, field.label);
                            return (
                            <td key={field.id} className="px-6 py-4 text-sm text-gray-800">
                            {field.type === FieldType.IMAGE_UPLOAD && val ? (
                                <div className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                                    <img 
                                        src={val as string} 
                                        alt="Upload" 
                                        className="w-full h-full object-cover" 
                                    />
                                    <a 
                                        href={val as string} 
                                        download={`upload.png`}
                                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                    >
                                        <DownloadIcon className="w-4 h-4" />
                                    </a>
                                </div>
                            ) : (
                                <span className="line-clamp-2" title={String(val)}>{renderSafeValue(val)}</span>
                            )}
                            </td>
                        )})
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};