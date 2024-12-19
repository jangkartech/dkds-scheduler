import { promises as fs } from 'fs';
import { sendAlertMessage } from './services/telegram.bot.service.js';
import {
  getAllDKDSPFIConfirmOrders,
  refetchCookies 
} from './services/dkds.service.js';

const main = async () => {
  await refetchCookies();
  const pfiConfirms = await getAllDKDSPFIConfirmOrders();

  await fs.writeFile(
    'pfi-confirm.json',
    JSON.stringify(pfiConfirms, null, 2),
    'utf8'
  );
};

// process.on('unhandledRejection', async (reason, promise) => {
//   const errorMessage = `Unhandled promise rejection: ${reason}`;
//   await sendAlertMessage(errorMessage);
//   console.error(errorMessage);
// });

// // Handle uncaught exceptions
// process.on('uncaughtException', async (error) => {
//   const errorMessage = `Uncaught exception: ${error.message || error}`;
//   await sendAlertMessage(errorMessage);
//   console.error(errorMessage);
// });
main().then();
