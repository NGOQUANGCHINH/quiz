import { BaseParser } from './BaseParser';
import { PdfParser } from './pdfParser';
// import { DocxParser } from './docxParser';
import { QuizData } from '../types';
import { parseTextToQuiz } from './textParser';

class TxtParser implements BaseParser {
  async parse(buffer: Buffer, originalFilename: string): Promise<QuizData> {
    const text = buffer.toString('utf-8');
    return parseTextToQuiz(text, originalFilename);
  }
}

class JsonParser implements BaseParser {
  async parse(buffer: Buffer, originalFilename: string): Promise<QuizData> {
    const data = JSON.parse(buffer.toString('utf-8'));
    // Basic validation
    if (data && data.questions && Array.isArray(data.questions)) {
      return data as QuizData;
    }
    throw new Error('Invalid JSON format');
  }
}

export class ParserFactory {
  static getParser(mimetype: string, filename: string): BaseParser {
    if (mimetype === 'application/pdf' || filename.endsWith('.pdf')) {
      return new PdfParser();
    }
    if (mimetype === 'text/plain' || filename.endsWith('.txt')) {
      return new TxtParser();
    }
    if (mimetype === 'application/json' || filename.endsWith('.json')) {
      return new JsonParser();
    }
    // fallback or error
    throw new Error(`Unsupported file type: ${mimetype} (${filename})`);
  }
}
