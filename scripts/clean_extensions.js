const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../backend/data');
const files = ['ma-nguon-mo.json', 'quizzes.json', 'progress.json'];

files.forEach(file => {
  const filePath = path.join(dataDir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace "*.ext" with ".ext" in the text fields
  let newContent = content.replace(/\*\.(asp|aspx|php|jps|xml)/gi, '.$1');

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Cleaned asterisks in extensions in ${file}`);
  }
});
