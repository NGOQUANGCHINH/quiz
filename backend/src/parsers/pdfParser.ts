import { BaseParser } from './BaseParser';
import { QuizData } from '../types';
import { parseTextToQuiz } from './textParser';
const pdfParse = require('pdf-parse');

export class PdfParser implements BaseParser {
  async parse(buffer: Buffer, originalFilename: string): Promise<QuizData> {
    const data = await pdfParse(buffer);
    return parseTextToQuiz(data.text, originalFilename);
  }
}
