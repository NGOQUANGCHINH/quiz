const fs = require('fs');
const path = './frontend/public/data/ma-nguon-mo.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

let modified = 0;

// Helper to remove all tags
const cleanHtml = str => str.replace(/<[^>]+>/g, '');
const b = (text) => `<b style="color: var(--primary-color)">${text}</b>`;

data.questions.forEach(q => {
  let oldQ = q.question;
  let cleanQ = cleanHtml(oldQ);
  
  // 1. Apache
  if (cleanQ.includes('Phần mềm Apache Server sử dụng giấy phép nào sau đây')) {
    q.question = cleanQ.replace('Apache', b('Apache'));
    modified++;
  }
  
  // 2. Mozilla Firefox
  else if (cleanQ.includes('Phần mềm Mozilla Firefox sử dụng giấy phép mã nguồn mở nào')) {
    q.question = cleanQ.replace('Mozilla Firefox', b('Mozilla Firefox'));
    modified++;
  }
  
  // 3. GIMP
  else if (cleanQ.includes('Phần mềm GIMP sử dụng giấy phép mã nguồn mở nào')) {
    q.question = cleanQ.replace('GIMP', b('GIMP'));
    modified++;
  }
  
  // 4. Chọn phát biểu đúng?
  else if (cleanQ.startsWith('Chọn phát biểu đúng')) {
    // Remove all bolding for "Chọn phát biểu đúng"
    q.question = cleanQ; 
    modified++;
  }
  
  // 5. Bước 1, Bước 2... Moodle
  else if (cleanQ.includes('trong quy trình triển khai hệ thống Moodle thực hiện công')) {
    let match = cleanQ.match(/Bước \d+/);
    if (match) {
      let step = match[0];
      let newQ = cleanQ.replace(step, b(step)).replace('Moodle', b('Moodle'));
      q.question = newQ;
      modified++;
    }
  }
});

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log(`Modified ${modified} questions.`);
