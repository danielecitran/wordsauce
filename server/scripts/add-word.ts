import fs from 'fs';
import path from 'path';

const wordsPath = path.join(__dirname, '../data/words.json');

function addWord(word: string, hints: string[]) {
  if (hints.length !== 4) {
    console.error('Bitte genau 4 Hinweise angeben.');
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(wordsPath, 'utf-8'));
  data.push({ word, hints });
  fs.writeFileSync(wordsPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Wort "${word}" hinzugefügt.`);
}

const [,, word, ...hints] = process.argv;
if (!word || hints.length !== 4) {
  console.log('Nutzung: ts-node scripts/add-word.ts <Wort> <Hinweis1> <Hinweis2> <Hinweis3> <Hinweis4>');
  process.exit(1);
}
addWord(word, hints); 