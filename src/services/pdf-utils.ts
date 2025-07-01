export interface PdfReference {
  filename: string;
  page?: number;
}

export function extractPdfReference(referenceText: string): PdfReference | null {
  // Example reference formats:
  // [document.pdf, page 5]
  // [report.pdf]
  // Source: document.pdf (page 3)
  
  const filenameMatch = referenceText.match(/\[([^\]]+\.pdf)(?:, page (\d+))?\]|Source: ([^\s]+\.pdf)(?: \(page (\d+))?\)/i);
  
  if (!filenameMatch) return null;

  // Check which pattern matched
  if (filenameMatch[1]) {
    return {
      filename: filenameMatch[1],
      page: filenameMatch[2] ? parseInt(filenameMatch[2]) : undefined
    };
  } else if (filenameMatch[3]) {
    return {
      filename: filenameMatch[3],
      page: filenameMatch[4] ? parseInt(filenameMatch[4]) : undefined
    };
  }

  return null;
}