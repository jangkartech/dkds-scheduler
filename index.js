import {getOrders, getDetailOrder, refetchCookies, getDKDSSaleOrders} from './services/dkds.service.js';
import {createTwinOrder, getTwinOrder, refetchTwinToken} from "./services/twin.service.js";

const main = async () => {
    await refetchCookies();
    const orders = await getDKDSSaleOrders();
    console.log(orders);
    //
    // if (Array.isArray(orders) && orders.length > 0) {
    //     for (const order of orders) {
    //         const orderDetail = await getDetailOrder(order.id);
    //         console.log(orderDetail);
    //     }
    // } else if (orders && orders.id) {
    //     for (const id of orders.id) {
    //         const orderDetail = await getDetailOrder(id);
    //         console.log(orderDetail);
    //     }
    // }
    // const twinUser = await refetchTwinToken();
    // const order = await getTwinOrder();
    // console.log(order);
};

main().then();
