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
    const order = await getDKDSSaleOrderById(orders[0].noSalesOrder);
    console.log(order);
    const items = await getDKDSSaleOrderItemsById(order.noSalesOrder, order.customerCode);
    console.dir(items, { depth: null });
};

main().then();
