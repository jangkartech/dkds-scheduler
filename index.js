import {JSDOM} from "jsdom";
import {
    getAllDKDSSaleOrders,
    getDKDSSaleOrders,
    getDKDSSaleOrdersById,
    refetchCookies
} from "./services/dkds.service.js";
import {promises as fs} from 'fs';

const main = async () => {
    // const twinUser = await refetchTwinToken();
    // const order = await getTwinOrder();
    // console.log(order);

    await refetchCookies();
    const orders = await getAllDKDSSaleOrders();
    const order = await getDKDSSaleOrdersById(orders[0].salesOrder);
    console.log(order);
};

main().then();
