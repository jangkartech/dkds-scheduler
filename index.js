import { createTwinOrder, refetchTwinToken } from './services/twin.service.js';
import Order from './database/models/order.js';
import OrderItem from './database/models/orderItem.js';

const main = async () => {
  const twinUser = await refetchTwinToken();
  const order = await createTwinOrder();
  console.log(order);
  // await refetchCookies();
  // const orders = await getAllDKDSSaleOrders();
  // const order = await getDKDSSaleOrderById(orders[0].noSalesOrder);
  // console.log(order);
  // const items = await getDKDSSaleOrderItemsById(
  //   order.noSalesOrder,
  //   order.customerCode
  // );
  // console.dir(items, { depth: null });
};

main().then();
