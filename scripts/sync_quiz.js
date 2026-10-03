const fs = require('fs');

const quizzesPath = './backend/data/quizzes.json';
const newQuizPath = './backend/data/dien-toan-dam-may.json';

let quizzes = JSON.parse(fs.readFileSync(quizzesPath, 'utf8'));
const newQuiz = JSON.parse(fs.readFileSync(newQuizPath, 'utf8'));

// Tìm và thay thế quiz cùng ID, hoặc thêm mới nếu chưa có
const existingIdx = quizzes.findIndex(q => q.id === newQuiz.id);
if (existingIdx >= 0) {
  quizzes[existingIdx] = newQuiz;
  console.log('Đã CẬP NHẬT quiz có ID: ' + newQuiz.id);
} else {
  quizzes.push(newQuiz);
  console.log('Đã THÊM MỚI quiz có ID: ' + newQuiz.id);
}

console.log('Tổng số bộ đề trong quizzes.json: ' + quizzes.length);
quizzes.forEach((q, i) => console.log(`  ${i+1}. ${q.title} (${q.questions.length} câu)`));

fs.writeFileSync(quizzesPath, JSON.stringify(quizzes, null, 2));
console.log('\nĐã lưu thành công!');
