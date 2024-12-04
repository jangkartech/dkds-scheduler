import { promises as fs } from 'fs';
import {
  orderDKDSToTwin,
  orderItemDKDSToTwin,
} from './services/mapper.service.js';
import { createTwinOrder, refetchTwinToken } from './services/twin.service.js';
import { sendAlertMessage } from './services/telegram.bot.service.js';

const main = async () => {
  // const twinUser = await refetchTwinToken();
  // const order = await createTwinOrder();
  // console.log(order);
  // await refetchCookies();
  // const orders = await getAllDKDSSaleOrders();
  // const mergedOrders = [];
  // for (const order of orders) {
  //   const orderDetail = await getDKDSSaleOrderById(order.noSalesOrder);
  //   // console.log(orderDetail);
  //   const orderItems = await getDKDSSaleOrderItemsById(
  //     order.noSalesOrder,
  //     order.customerCode
  //   );
  //   // console.dir(orderItems, { depth: null });
  //   // Merge items into orderDetail
  //   orderDetail.items = orderItems;
  //   mergedOrders.push(orderDetail);
  // }
  // await fs.writeFile(
  //   'orders.json',
  //   JSON.stringify(mergedOrders, null, 2),
  //   'utf8'
  // );

  const mergedOrders = await fs.readFile('orders.json', 'utf8');
  const orders = JSON.parse(mergedOrders);
  const order = orders[0];
  const orderItems = order.items;

  const orderPayload = await orderDKDSToTwin(order);
  orderPayload.items = await Promise.all(
    orderItems.map((item) => orderItemDKDSToTwin(item))
  );
  console.dir(orderPayload, { depth: null });

  try {
    await refetchTwinToken();
    const createdOrder = await createTwinOrder(orderPayload);
    console.log(createdOrder);
  } catch (error) {
    console.error(error);
    await sendAlertMessage(error.message || error);
  }
};

process.on('unhandledRejection', async (reason, promise) => {
  const errorMessage = `Unhandled promise rejection: ${reason}`;
  await sendAlertMessage(errorMessage);
  console.error(errorMessage);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  const errorMessage = `Uncaught exception: ${error.message || error}`;
  await sendAlertMessage(errorMessage);
  console.error(errorMessage);
});
main().then();
