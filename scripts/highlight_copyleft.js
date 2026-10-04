const fs = require('fs');
const path = './frontend/public/data/ma-nguon-mo.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

let modified = 0;
data.questions.forEach(q => {
  let oldQ = q.question;
  let newQ = oldQ
    .replace(/\bCopyleft\b/g, '<b style="color: var(--primary-color)">Copyleft</b>')
    .replace(/\bcopyleft\b/g, '<b style="color: var(--primary-color)">copyleft</b>')
    .replace(/\bCopyright\b/g, '<b style="color: var(--primary-color)">Copyright</b>')
    .replace(/\bcopyright\b/g, '<b style="color: var(--primary-color)">copyright</b>');
  
  if (oldQ !== newQ) {
    q.question = newQ;
    modified++;
  }
});

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log(`Modified ${modified} questions.`);
