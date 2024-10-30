import {JSDOM} from "jsdom";
import {
    getAllDKDSSaleOrders,
    getDKDSSaleOrders,
    getDKDSSaleOrderById,
    refetchCookies, getDKDSSaleOrderItemsById
} from "./services/dkds.service.js";
import {promises as fs} from 'fs';

const main = async () => {
    // const twinUser = await refetchTwinToken();
    // const order = await getTwinOrder();
    // console.log(order);

    await refetchCookies();
    const orders = await getAllDKDSSaleOrders();
    const order = await getDKDSSaleOrderById(orders[0].salesOrder);
    console.log(order);
    const items = await getDKDSSaleOrderItemsById(order.salesOrder, order.customerCode);
    console.log(items);
};

main().then();
