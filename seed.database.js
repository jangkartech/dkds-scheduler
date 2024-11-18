import { promises as fs } from 'fs';
import XLSX from 'xlsx';
import Mapper from './database/models/mapper.js'; // adjust path to your Mapper model

const seedData = async (filePath, model) => {
  try {
    const fileBuffer = await fs.readFile(filePath);

    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    const promises = data.map(async (row) => {
      await model.create(row);
    });

    await Promise.all(promises);
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

const main = async () => {
  await seedData('./database/seeders/mapper.xlsx', Mapper);
};

main().then();
