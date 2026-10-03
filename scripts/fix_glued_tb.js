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

  const fixAnswers = (q) => {
    if (!q.answers) return;
    
    for (let i = 0; i < q.answers.length; i++) {
      const a = q.answers[i];
      // Check for garbage like ” TB( 4,3 )=“ or similar TB(...)
      const match = a.text.match(/(.*?)”\s*TB\(\s*\d+,\d+\s*\)=“(.*)/);
      if (match) {
        const text1 = match[1].trim();
        const text2 = match[2].trim().replace(/”$/, '').replace(/"$/, ''); // remove trailing quotes if any

        a.text = text1;
        
        // Add the second part as a new answer right after this one
        q.answers.splice(i + 1, 0, {
          id: crypto.randomUUID(),
          text: text2
        });
        
        changed = true;
      }
    }
  };

  const traverse = (node) => {
    if (Array.isArray(node)) {
      node.forEach(traverse);
    } else if (typeof node === 'object' && node !== null) {
      if (node.answers && Array.isArray(node.answers)) {
        fixAnswers(node);
      }
      if (node.questions && Array.isArray(node.questions)) {
        node.questions.forEach(fixAnswers);
      }
      Object.values(node).forEach(traverse);
    }
  };

  traverse(data);

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Split glued TB(...) answers in ${file}`);
  }
});
