const fs = require('fs');
const path = './frontend/public/data/ma-nguon-mo.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

let modified = 0;
data.questions.forEach(q => {
  if (q.question.includes('OpenOffice') && q.question.includes('Micorsoft Office')) {
    // Remove old bold tags
    let cleanQ = q.question.replace(/<[^>]+>/g, '');
    
    // The target words are Writer, Impress, Calc, Draw, Base, Math
    let words = ['Writer', 'Impress', 'Calc', 'Draw', 'Base', 'Math'];
    let newQ = cleanQ;
    for (let w of words) {
      if (cleanQ.includes(w)) {
        newQ = cleanQ.replace(w, `<b style="color: var(--primary-color)">${w}</b>`);
        break;
      }
    }
    
    if (q.question !== newQ) {
      q.question = newQ;
      modified++;
    }
  }
});

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log(`Modified ${modified} questions.`);
