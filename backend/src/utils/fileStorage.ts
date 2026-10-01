import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../../data');

export const readJsonFile = <T>(filename: string, defaultValue: T): T => {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    return defaultValue;
  }
  try {
    const raw = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filename}`, err);
    return defaultValue;
  }
};

export const writeJsonFile = <T>(filename: string, data: T): void => {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
};
