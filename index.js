import { createTwinOrder, refetchTwinToken } from './services/twin.service.js';
import Order from './database/models/order.js';
import OrderItem from './database/models/orderItem.js';
import {
  getAllDKDSSaleOrders,
  getDKDSSaleOrderById,
  getDKDSSaleOrderItemsById,
  refetchCookies,
} from './services/dkds.service.js';
import { promises as fs } from 'fs';

const main = async () => {
  // const twinUser = await refetchTwinToken();
  // const order = await createTwinOrder();
  // console.log(order);
  await refetchCookies();
  const orders = await getAllDKDSSaleOrders();
  const mergedOrders = [];
  for (const order of orders) {
    const orderDetail = await getDKDSSaleOrderById(order.noSalesOrder);
    // console.log(orderDetail);
    const orderItems = await getDKDSSaleOrderItemsById(
      order.noSalesOrder,
      order.customerCode
    );
    // console.dir(orderItems, { depth: null });
    // Merge items into orderDetail
    orderDetail.items = orderItems;
    mergedOrders.push(orderDetail);
  }
  await fs.writeFile(
    'orders.json',
    JSON.stringify(mergedOrders, null, 2),
    'utf8'
  );
};

main().then();
