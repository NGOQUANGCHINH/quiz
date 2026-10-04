const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'backend/data/ma-nguon-mo.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let count = 0;
for (const q of data) {
  const match = q.question.match(/Nhìn vào hình (0[1-9])/i);
  if (match) {
    q.image = `/img/hinh_${match[1]}.png`;
    count++;
  }
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`Updated ${count} questions with images.`);
