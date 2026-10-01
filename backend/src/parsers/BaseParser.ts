import { QuizData } from '../types';

export interface BaseParser {
  parse(buffer: Buffer, originalFilename: string): Promise<QuizData>;
}
