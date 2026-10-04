const fs = require('fs');
const path = './frontend/public/data/ma-nguon-mo.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

// Helper to remove existing bold tags so we can re-process safely
const cleanHtml = str => str.replace(/<[^>]+>/g, '');

const tokenize = str => {
  // Split by words/non-words to keep whitespace and punctuation intact
  return str.split(/([a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+)/).filter(Boolean);
};

let questions = data.questions;
let groups = [];
let visited = new Set();

for (let i = 0; i < questions.length; i++) {
  if (visited.has(i) || questions[i].image) continue; // Skip image questions, they are already highlighted
  
  let q1 = questions[i];
  let clean1 = cleanHtml(q1.question);
  let words1 = clean1.toLowerCase().split(/[\s,.\?]+/);
  
  let group = [i];
  visited.add(i);
  
  for (let j = i + 1; j < questions.length; j++) {
    if (visited.has(j) || questions[j].image) continue;
    
    let q2 = questions[j];
    let clean2 = cleanHtml(q2.question);
    let words2 = clean2.toLowerCase().split(/[\s,.\?]+/);
    
    let s1 = new Set(words1);
    let s2 = new Set(words2);
    let intersection = new Set([...s1].filter(x => s2.has(x)));
    let union = new Set([...s1, ...s2]);
    let similarity = intersection.size / union.size;
    
    if (similarity > 0.65 && clean1 !== clean2) {
      group.push(j);
      visited.add(j);
    }
  }
  
  if (group.length > 1) groups.push(group);
}

let modified = 0;

groups.forEach(groupIndices => {
  // Tokenize all questions in the group
  let tokenized = groupIndices.map(idx => tokenize(cleanHtml(questions[idx].question)));
  
  // Find longest common prefix
  let prefixLen = 0;
  while (true) {
    let allMatch = true;
    if (prefixLen >= tokenized[0].length) break;
    let token = tokenized[0][prefixLen];
    for (let i = 1; i < tokenized.length; i++) {
      if (prefixLen >= tokenized[i].length || tokenized[i][prefixLen].toLowerCase() !== token.toLowerCase()) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) prefixLen++;
    else break;
  }
  
  // Find longest common suffix
  let suffixLen = 0;
  while (true) {
    let allMatch = true;
    if (tokenized[0].length - 1 - suffixLen < prefixLen) break;
    let token = tokenized[0][tokenized[0].length - 1 - suffixLen];
    for (let i = 1; i < tokenized.length; i++) {
      if (tokenized[i].length - 1 - suffixLen < prefixLen || 
          tokenized[i][tokenized[i].length - 1 - suffixLen].toLowerCase() !== token.toLowerCase()) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) suffixLen++;
    else break;
  }
  
  // Reconstruct with highlighting
  groupIndices.forEach((idx, groupIdx) => {
    let tokens = tokenized[groupIdx];
    let prefix = tokens.slice(0, prefixLen).join('');
    let suffix = tokens.slice(tokens.length - suffixLen).join('');
    let diff = tokens.slice(prefixLen, tokens.length - suffixLen).join('');
    
    if (diff.trim().length > 0) {
      // Highlight diff
      let original = cleanHtml(questions[idx].question);
      let newQuestion = prefix + `<b style="color: var(--primary-color)">${diff}</b>` + suffix;
      questions[idx].question = newQuestion;
      modified++;
    }
  });
});

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log(`Modified ${modified} questions in groups.`);
