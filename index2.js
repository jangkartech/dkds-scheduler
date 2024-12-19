import { getAllOrderByStatuses } from './services/order.service.js';
import { sendAlertMessage } from './services/telegram.bot.service.js';
import { getTwinOrders, refetchTwinToken } from './services/twin.service.js';
import { updateOrderById } from './services/order.service.js';

const main = async () => {
  const ordersWaiting = await getAllOrderByStatuses(['waiting']);
  const ids = ordersWaiting.map((item) => item.id);

  await refetchTwinToken();
  const ordersTwin = await getTwinOrders(ids);

  for (const orderTwin of ordersTwin.data) {    
    if (orderTwin.status !== 'waiting') {
      const updated = {
        status: orderTwin.status
      }
      await updateOrderById(orderTwin.id, updated);
    }
  }
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
