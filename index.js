import {getOrders} from "./services/dkds.service.js";

const main  = async () => {
    const orders = await  getOrders();
    console.log(orders);
}

main().then();
