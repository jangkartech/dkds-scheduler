import {getOrders, getDetailOrder, refetchCookies} from './services/dkds.service.js';

const main = async () => {
    await refetchCookies();
    const orders = await getOrders();
    console.log(orders);

    if (Array.isArray(orders) && orders.length > 0) {
        for (const order of orders) {
            const orderDetail = await getDetailOrder(order.id);
            console.log(orderDetail);
        }
    } else if (orders && orders.id) {
        for (const id of orders.id) {
            const orderDetail = await getDetailOrder(id);
            console.log(orderDetail);
        }
    }
};

main().then();
