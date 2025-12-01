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

  const loadData = async () => {
    setLoading(true);
    // Pass the form's custom Google Sheet URL to the service
    const data = await storageService.fetchResponses(form.id, form.googleSheetUrl);
    // Sort by date descending
    setResponses(data.sort((a, b) => b.submittedAt - a.submittedAt));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [form.id]);

  // FILTERING LOGIC
  const filteredResponses = responses.filter(r => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();
    
    // Check submission date
    if (new Date(r.submittedAt).toLocaleString().toLowerCase().includes(lowerTerm)) return true;

    // Check all answer values
    const answers = Object.values(r.answers);
    return answers.some(val => 
        val && String(val).toLowerCase().includes(lowerTerm)
    );
  });

  const downloadCSV = () => {
    // 1. Headers: Submission Date + All Fields
    const headers = ['Fecha Envío', ...form.fields.map(f => f.label.replace(/,/g, ''))]; 
    
    // 2. Rows (Use filtered responses so user gets what they see)
    const rows = filteredResponses.map(r => {
      const date = new Date(r.submittedAt).toLocaleString();
      const answerCells = form.fields.map(f => {
        // En la BD de la nube, las claves son las Etiquetas (Labels), no los IDs
        let val = r.answers[f.label];
        
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
                        {loading ? 'Cargando datos...' : `Mostrando ${filteredResponses.length} de ${responses.length} respuestas`}
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
                           <p>Leyendo datos de Google Sheets...</p>
                        </td>
                    </tr>
                ) : filteredResponses.length === 0 ? (
                   <tr>
                     <td colSpan={form.fields.length + 1} className="px-6 py-12 text-center text-gray-400 italic">
                       {responses.length > 0 
                         ? "No se encontraron resultados para tu búsqueda." 
                         : "Aún no hay respuestas en la nube para este formulario."}
                     </td>
                   </tr>
                ) : (
                  filteredResponses.map((response) => (
                    <tr key={response.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(response.submittedAt).toLocaleString()}
                      </td>
                      {form.fields.map(field => {
                        const val = response.answers[field.label];
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
                            <span className="line-clamp-2">{val || '-'}</span>
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