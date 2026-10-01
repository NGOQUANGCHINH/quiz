const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch'); // we might not have node-fetch in root, let's use built-in fetch in node 18+

async function testUpload() {
  const form = new FormData();
  form.append('file', fs.createReadStream('./Điện toán đám mây và ứng dụng HUBT - Update 2025.pdf'));

  try {
    const res = await fetch('http://localhost:3001/api/quizzes/import', {
      method: 'POST',
      body: form
    });
    const data = await res.json();
    console.log(`Parsed Title: ${data.title}`);
    console.log(`Parsed Questions: ${data.questions.length}`);
    const valid = data.questions.filter(q => q.correctAnswerId && q.answers.length >= 2).length;
    console.log(`Valid Questions: ${valid}`);
  } catch(e) {
    console.error(e);
  }
}
testUpload();
