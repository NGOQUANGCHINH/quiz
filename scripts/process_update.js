const fs = require('fs');

const rawPath = './raw_update.json';
const data = JSON.parse(fs.readFileSync(rawPath, 'utf8'));

const b = (text) => `<b style="color: var(--primary-color)">${text}</b>`;
const cleanHtml = str => str.replace(/<[^>]+>/g, '');

data.questions.forEach(q => {
  let cleanQ = cleanHtml(q.question);
  
  // Apply Highlight rules
  if (cleanQ.includes('sai về Copyleft:')) {
    q.question = cleanQ.replace('Copyleft', b('Copyleft'));
  }
  else if (cleanQ.includes('Ký hiệu của Copyleft:')) {
    q.question = cleanQ.replace('Copyleft', b('Copyleft'));
  }
  else if (cleanQ.includes('Ký hiệu của Copyright:')) {
    q.question = cleanQ.replace('Copyright', b('Copyright'));
  }
  else if (cleanQ.includes('OpenOffice Calc')) {
    q.question = cleanQ.replace('Calc', b('Calc'));
  }
  else if (cleanQ.includes('Phần mềm mail nào tính phí đắt nhất')) {
    q.question = cleanQ.replace('đắt nhất', b('đắt nhất'));
  }
  else if (cleanQ.includes('Phần mềm Apache Server')) {
    q.question = cleanQ.replace('Apache', b('Apache'));
  }
  else if (cleanQ.includes('Phần mềm Mozilla Firefox')) {
    q.question = cleanQ.replace('Mozilla Firefox', b('Mozilla Firefox'));
  }
  else if (cleanQ.includes('Phần mềm GIMP')) {
    q.question = cleanQ.replace('GIMP', b('GIMP'));
  }
  else if (cleanQ.startsWith('Chọn phát biểu đúng?')) {
    q.question = cleanQ.replace('?', '');
  }
  else if (cleanQ.includes('trong quy trình triển khai hệ thống Moodle')) {
    let match = cleanQ.match(/Bước \d+/);
    if (match) {
      let step = match[0];
      q.question = cleanQ.replace(step, b(step)).replace('Moodle', b('Moodle'));
    }
  }

  // Apply Image mappings
  if (q.figure) {
    if (q.figure === 'Hình 02') {
      q.image = '/img/hinh_02.png';
    } else if (q.figure === 'Hình 03') {
      q.image = '/img/hinh_03.png';
    } else if (q.figure === 'Hình 05') {
      q.image = '/img/hinh_05.png';
    } else if (q.figure === 'Hình 06') {
      q.image = '/img/hinh_06.png';
    }
    // Hình 01 is deliberately ignored
  }
});

const destPathFront = './frontend/public/data/dien-toan-dam-may-data.json';
const destPathBack = './backend/data/dien-toan-dam-may-data.json';
const destPathFront2 = './frontend/public/data/ma-nguon-mo-update-2025.json';
const destPathBack2 = './backend/data/ma-nguon-mo-update-2025.json';

fs.writeFileSync(destPathFront, JSON.stringify(data, null, 2));
fs.writeFileSync(destPathBack, JSON.stringify(data, null, 2));
fs.writeFileSync(destPathFront2, JSON.stringify(data, null, 2));
fs.writeFileSync(destPathBack2, JSON.stringify(data, null, 2));

console.log('Successfully processed data!');
