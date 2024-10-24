import {getOrders, getDetailOrder, refetchCookies} from './services/dkds.service.js';


const main = async () => {
    // const orders = await getOrders();
    // console.log(orders);
    await refetchCookies()
    const orderId = '202210030001';
    const order = await getDetailOrder(orderId);
    console.log(order);
};

main().then();
