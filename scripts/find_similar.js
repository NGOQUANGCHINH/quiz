const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./frontend/public/data/ma-nguon-mo.json', 'utf8'));

// Helper to clean HTML tags for comparison
const clean = str => str.replace(/<[^>]+>/g, '').toLowerCase().trim();

// Get words
const getWords = str => clean(str).split(/[\s,.\?]+/);

const questions = data.questions.map((q, i) => ({
  index: i,
  original: q.question,
  clean: clean(q.question),
  words: getWords(q.question)
}));

// Group questions that have a high word overlap
let groups = [];
let visited = new Set();

for (let i = 0; i < questions.length; i++) {
  if (visited.has(i)) continue;
  let q1 = questions[i];
  let group = [q1];
  visited.add(i);
  
  for (let j = i + 1; j < questions.length; j++) {
    if (visited.has(j)) continue;
    let q2 = questions[j];
    
    // Calculate Jaccard similarity of words
    let s1 = new Set(q1.words);
    let s2 = new Set(q2.words);
    let intersection = new Set([...s1].filter(x => s2.has(x)));
    let union = new Set([...s1, ...s2]);
    let similarity = intersection.size / union.size;
    
    // If similarity > 0.6 and they are not identical
    if (similarity > 0.65 && q1.clean !== q2.clean) {
      group.push(q2);
      visited.add(j);
    }
  }
  
  if (group.length > 1) {
    groups.push(group);
  }
}

// Write to a temporary log
let output = '';
groups.forEach((g, idx) => {
  output += `Group ${idx + 1}:\n`;
  g.forEach(q => {
    output += ` - [Q${q.index + 1}] ${q.original}\n`;
  });
  output += '\n';
});

fs.writeFileSync('similar_questions.log', output);
console.log(`Found ${groups.length} groups of similar questions.`);
