import { readFileSync, writeFileSync } from 'fs';

const file = JSON.parse(readFileSync('dist/app/package.json', 'utf-8'));
delete file.build;
delete file.scripts;
writeFileSync('dist/app/package.json', JSON.stringify(file));