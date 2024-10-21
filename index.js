import {getOrders} from "./services/dkds.service.js";

const main  = async () => {
    await  getOrders();
}

main().then();
