const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataDir = path.join(__dirname, '../backend/data');
const files = ['ma-nguon-mo.json', 'quizzes.json', 'progress.json'];

files.forEach(file => {
  const filePath = path.join(dataDir, file);
  if (!fs.existsSync(filePath)) return;
  
  let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let changed = false;

  const fixQuestionStr = (q) => {
    if (!q.question) return;

    // Check if question ends with "a. Something" or "A. Something"
    const match = q.question.match(/(.*?)\s+[a-dA-D1-4]\.\s+(.+)$/);
    if (match) {
      q.question = match[1].trim();
      const extractedAnswerText = match[2].trim();
      
      // Ensure the extracted answer isn't already in the answers array
      if (q.answers) {
        const alreadyExists = q.answers.some(a => a.text === extractedAnswerText || a.text === `a. ${extractedAnswerText}`);
        if (!alreadyExists) {
          q.answers.unshift({
            id: crypto.randomUUID(),
            text: extractedAnswerText
          });
        }
      }
      changed = true;
    }
  };

  const traverse = (node) => {
    if (Array.isArray(node)) {
      node.forEach(traverse);
    } else if (typeof node === 'object' && node !== null) {
      if (node.question && typeof node.question === 'string') {
        fixQuestionStr(node);
      }
      if (node.questions && Array.isArray(node.questions)) {
        node.questions.forEach(fixQuestionStr);
      }
      Object.values(node).forEach(traverse);
    }
  };

  traverse(data);

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Extracted answers from questions in ${file}`);
  }
});
