const fs = require('fs');
const crypto = require('crypto');
function uuidv4() { return crypto.randomUUID(); }

const inputFile = '../raw_data/ma-nguon-mo.txt';
const outputFile = '../backend/data/ma-nguon-mo.json';

const rawHtml = fs.readFileSync(inputFile, 'utf-8');
// Replace block elements with newlines, strip other tags
let text = rawHtml
  .replace(/<\/(p|h1|h2|h3|h4|h5|h6|li|div)>/gi, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&ldquo;/g, '"')
  .replace(/&rdquo;/g, '"')
  .replace(/&quot;/g, '"');

const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

const questions = [];
let currentQuestion = null;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];

  // Skip "Câu X (Một đáp án)"
  if (line.match(/^Câu \d+ \(Một đáp án\)$/)) {
    continue;
  }

  // Detect question start: "Câu X:" or "Câu X: HA(X)="
  const qMatch = line.match(/^Câu\s+\d+:\s*(?:H[ABC]\(\d+\)=“)?(.+?)(?:”)?$/i);
  if (qMatch) {
    if (currentQuestion) {
      questions.push(currentQuestion);
    }
    currentQuestion = {
      id: uuidv4(),
      question: qMatch[1].trim(),
      answers: [],
      correctAnswerId: null
    };
    continue;
  }

  // If we have a current question, parse answers
  if (currentQuestion) {
    let isCorrect = line.startsWith('*');
    if (isCorrect) {
      line = line.substring(1).trim();
    }

    // Handle format: TA( 1,1 )=“ Answer ”
    const aMatch = line.match(/^T[ABC]\(\s*\d+\s*,\s*\d+\s*\)=“(.+?)”$/i);
    let answerText = line;
    if (aMatch) {
      answerText = aMatch[1];
    } else {
      // Remove prefixes like "a. ", "b. ", "1. "
      const prefixMatch = answerText.match(/^[a-d1-4]\.\s*(.+)/i);
      if (prefixMatch) {
        answerText = prefixMatch[1];
      }
    }
    
    answerText = answerText.trim();
    
    // Ignore lines that look like "Phần 1:", "Phần 2:"
    if (answerText.match(/^Phần \d+:$/i)) {
      continue;
    }

    if (answerText.length > 0) {
      const ansId = uuidv4();
      currentQuestion.answers.push({
        id: ansId,
        text: answerText
      });
      if (isCorrect) {
        currentQuestion.correctAnswerId = ansId;
      }
    }
  }
}

// Push the last question
if (currentQuestion) {
  questions.push(currentQuestion);
}

// Clean up questions (e.g. some might not have answers if parsed wrongly)
const validQuestions = questions.filter(q => q.answers.length > 0);

fs.writeFileSync(outputFile, JSON.stringify(validQuestions, null, 2));
console.log(`Đã parse thành công ${validQuestions.length} câu hỏi, lưu vào ${outputFile}`);
