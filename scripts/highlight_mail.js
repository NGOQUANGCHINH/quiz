const fs = require('fs');
const path = './frontend/public/data/ma-nguon-mo.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

let modified = 0;
data.questions.forEach(q => {
  if (q.question.includes('Phần mềm mail nào tính phí đắt nhất')) {
    let cleanQ = q.question.replace(/<[^>]+>/g, '');
    let newQ = cleanQ.replace('đắt nhất', '<b style="color: var(--primary-color)">đắt nhất</b>');
    if (q.question !== newQ) {
      q.question = newQ;
      modified++;
    }
  }
  if (q.question === 'Phần mềm mail nào là mã nguồn mở') {
    q.question = 'Phần mềm mail nào là <b style="color: var(--primary-color)">mã nguồn mở</b>';
    modified++;
  }
});

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log(`Modified ${modified} questions.`);
