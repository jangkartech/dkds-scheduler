import {JSDOM} from "jsdom";
import {
    getAllDKDSSaleOrders,
    getDKDSSaleOrders,
    getDKDSSaleOrdersById,
    refetchCookies
} from "./services/dkds.service.js";

const main = async () => {
    // console.log(orders);
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

    await refetchCookies();
    const orders = await getAllDKDSSaleOrders();
    // Now orders contains data from all pages
    console.log(orders);
    const order = await getDKDSSaleOrdersById(orders[0].id);
    console.log(order);
};

main().then();
