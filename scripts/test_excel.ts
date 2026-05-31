import * as fs from 'fs';
import * as xlsx from 'xlsx';

const buffer = fs.readFileSync('Recetas/Recetas cocteles vermut.xlsx');
const workbook = xlsx.read(buffer, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet);

console.log("First row:", data[0]);
console.log("Columns:", Object.keys(data[0] as any));
