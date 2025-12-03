import { useState, useEffect, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { API } from '../config';

// Configure PDF.js worker
// Use the worker from the installed package (copied to public folder)
// This ensures version compatibility and avoids CDN issues
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const PdfViewer = ({
  sheetId,
  onNumPagesChange,
  width = 800,
  renderAnnotations,
  onClickPage,
  onMouseMovePage,
  onMouseUpPage,
  quality = 'high', // 'high' or 'fast' - fast reduces resolution for quicker loading
}) => {
  const [numPages, setNumPages] = useState(null);
  const [visiblePages, setVisiblePages] = useState(null);
  const token = localStorage.getItem('token');

  const fileUrl = `${API}/answer-sheets/${sheetId}/download`;

  // Memoize the file object to prevent unnecessary re-renders
  const fileConfig = useMemo(() => ({
    url: fileUrl,
    httpHeaders: token ? { Authorization: `Bearer ${token}` } : {},
  }), [fileUrl, token]);

  // Continuous mode: no explicit pageNumber tracking here

  const handleLoadSuccess = async (pdf) => {
    const nextNumPages = pdf?.numPages || 0;
    setNumPages(nextNumPages);
    if (onNumPagesChange) onNumPagesChange(nextNumPages);

    // Skip blank detection for performance - just show all pages
    // Blank detection is too expensive and causes loading delays
    setVisiblePages(Array.from({ length: nextNumPages }, (_, i) => i + 1));
  };

  // Helper to compute normalized coordinates relative to a page wrapper
  const computeNorm = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return { x, y };
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="border rounded-md bg-gray-50 w-full">
        <Document
          file={fileConfig}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={(error) => {
            console.error('PDF load error:', error);
          }}
          loading={
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          }
          error={
            <div className="flex items-center justify-center p-8 text-red-600">
              <p>Failed to load PDF. Please try again.</p>
            </div>
          }
        >
          {numPages && (visiblePages || Array.from({ length: numPages }, (_, i) => i + 1)).map((p) => (
            <div
              key={`page-${p}`}
              className="relative mb-4"
              onClick={(e) => {
                if (onClickPage) {
                  const { x, y } = computeNorm(e);
                  onClickPage({ pageNumber: p, x, y, event: e });
                }
              }}
              onMouseMove={(e) => {
                if (onMouseMovePage) {
                  const { x, y } = computeNorm(e);
                  onMouseMovePage({ pageNumber: p, x, y, event: e });
                }
              }}
              onMouseUp={(e) => {
                if (onMouseUpPage) {
                  const { x, y } = computeNorm(e);
                  onMouseUpPage({ pageNumber: p, x, y, event: e });
                }
              }}
            >
              <Page 
                pageNumber={p} 
                width={width}
                scale={quality === 'fast' ? 0.75 : 1}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={
                  <div className="flex items-center justify-center p-8 bg-gray-100" style={{ width: width, height: width * 1.414 }}>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  </div>
                }
              />
              {typeof renderAnnotations === 'function' && (
                <div className="absolute inset-0">
                  {renderAnnotations(p)}
                </div>
              )}
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
};

export default PdfViewer;
