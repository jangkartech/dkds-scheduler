import { promises as fs } from 'fs';
import {
  orderDKDSToTwin,
  orderItemDKDSToTwin,
} from './services/mapper.service.js';
import { createTwinOrder, refetchTwinToken } from './services/twin.service.js';
import { sendAlertMessage } from './services/telegram.bot.service.js';
import {
  getAllDKDSSaleOrders,
  getDKDSSaleOrderById,
  getDKDSSaleOrderItemsById,
  refetchCookies 
} from './services/dkds.service.js';
import { getOrderById } from './services/order.service.js';

const main = async () => {
  await refetchCookies();
  const orders = await getAllDKDSSaleOrders();

  // const data = await fs.readFile(
  //   'order.json',
  //   {
  //     encoding:'utf-8',
  //   }
  // );
  // const orders = JSON.parse(data);

  for (const order of orders) {
    const orderItems = await getDKDSSaleOrderItemsById(
      order.noSalesOrder,
      order.customerCode
    );

    const existsOrder = await getOrderById(order.noSalesOrder);
    if (existsOrder) {
      continue;
    }

    const payloadTwin = await orderDKDSToTwin(order);
    payloadTwin.items = await Promise.all(
      orderItems.map((item) => orderItemDKDSToTwin(item))
    );

    await refetchTwinToken();
    await createTwinOrder(payloadTwin);
  }

  // const twinUser = await refetchTwinToken();
  // await refetchCookies();
  // const orders = await getAllDKDSSaleOrders();

  // const mergedOrders = [];

  // for (const order of orders) {
    // const orderDetail = await getDKDSSaleOrderById(order.noSalesOrder);
    // console.log(orderDetail);
    // const orderItems = await getDKDSSaleOrderItemsById(
    //   order.noSalesOrder,
    //   order.customerCode
    // );

    // console.dir(orderItems, { depth: null });
    // Merge items into orderDetail
    // orderDetail.items = orderItems;
    
    // order.items = orderItems;
    // mergedOrders.push(orderDetail);
  // }

  // await fs.writeFile(
  //   'orders.json',
  //   JSON.stringify(mergedOrders, null, 2),
  //   'utf8'
  // );

  // const order = orders[0];
  // const orderItems = order.items;

  // const orderPayload = await orderDKDSToTwin(order);
  // orderPayload.items = await Promise.all(
  //   orderItems.map((item) => orderItemDKDSToTwin(item))
  // );
  // console.dir(orderPayload, { depth: null });

  // try {
  //   await refetchTwinToken();
  //   const createdOrder = await createTwinOrder(orderPayload);
  //   console.log(createdOrder);
  // } catch (error) {
  //   console.error(error);
  //   await sendAlertMessage(error.message || error);
  // }
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
