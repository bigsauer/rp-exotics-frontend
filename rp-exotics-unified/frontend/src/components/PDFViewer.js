import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const PDFViewer = () => {
  const { fileName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use the viewUrl from navigation state if available, otherwise fallback to the old method
  const viewUrl = location.state?.viewUrl || `/api/documents/download/${encodeURIComponent(fileName || 'document')}`;
  const documentTitle = fileName || 'Document';

  useEffect(() => {
    console.log('[PDFViewer] Component mounted');
    console.log('[PDFViewer] fileName:', fileName);
    console.log('[PDFViewer] location.state:', location.state);
    console.log('[PDFViewer] viewUrl:', viewUrl);

    const loadPDF = async () => {
      try {
        setLoading(true);
        console.log('[PDFViewer] Fetching PDF from:', viewUrl);
        
        const response = await fetch(viewUrl, { 
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load PDF: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const dataUrl = URL.createObjectURL(blob);
        console.log('[PDFViewer] PDF loaded successfully, data URL created');
        setPdfUrl(dataUrl);
        setError(null);
      } catch (err) {
        console.error('[PDFViewer] Error loading PDF:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, [viewUrl]);

  const handleIframeError = () => {
    console.error('[PDFViewer] Iframe failed to load:', pdfUrl);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col items-center justify-center p-8">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col items-center justify-center p-8">
        <div className="text-red-400 text-center">
          <p>Error loading PDF: {error}</p>
          <button 
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col items-center justify-center p-8">
      <button
        className="mb-6 flex items-center text-blue-400 hover:text-blue-300 font-medium self-start"
        onClick={() => navigate(-1)}
      >
        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Back
      </button>
      <div className="w-full max-w-5xl h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center">
        <iframe
          src={pdfUrl}
          title={documentTitle}
          className="w-full h-full border-0"
          onError={handleIframeError}
        />
      </div>
    </div>
  );
};

export default PDFViewer; 