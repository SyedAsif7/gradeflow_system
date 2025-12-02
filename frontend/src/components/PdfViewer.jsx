import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { API } from '../config';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const PdfViewer = ({ sheetId }) => {
  const [numPages, setNumPages] = useState(null);
  const token = localStorage.getItem('token');

  const fileUrl = `${API}/answer-sheets/${sheetId}/download`;

  return (
    <div className="border rounded-md max-h-[70vh] overflow-auto bg-gray-50">
      <Document
        file={{
          url: fileUrl,
          httpHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        }}
        onLoadSuccess={({ numPages: nextNumPages }) => setNumPages(nextNumPages)}
      >
        {Array.from(new Array(numPages || 0), (_, idx) => (
          <Page key={idx + 1} pageNumber={idx + 1} width={600} />
        ))}
      </Document>
    </div>
  );
};

export default PdfViewer;


