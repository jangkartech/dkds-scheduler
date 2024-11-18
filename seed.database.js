import { promises as fs } from 'fs';
import XLSX from 'xlsx';
import Mapper from './database/models/mapper.js'; // adjust path to your Mapper model

const seed = async (filePath) => {
  try {
    const fileBuffer = await fs.readFile(filePath);

    // Parse the Excel file to JSON
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]]; // Assume first sheet
    const data = XLSX.utils.sheet_to_json(sheet);

    // Create array of promises to insert data
    const promises = data.map(async (row) => {
      // Map the data to your model
      await Mapper.create({
        id: row.id,
        mappedEntityId: row.mappedEntityId,
        entityType: row.entityType,
      });
    });

    // Wait for all insertions to complete
    await Promise.all(promises);
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

const main = async () => {
  await seed('./database/seeders/mapper.xlsx');
};

main().then();
