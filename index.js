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

    // await refetchCookies();
    // const orders = await getAllDKDSSaleOrders();
    // const order = await getDKDSSaleOrderById(orders[0].noSalesOrder);
    // console.log(order);
    // const items = await getDKDSSaleOrderItemsById(order.noSalesOrder, order.customerCode);
    // console.log(items);

    const items = await fs.readFile('index.html', 'utf-8');
    const {document} = (new JSDOM(items)).window;
    const rows = Array.from(document.querySelectorAll('.table-items tr')); // Convert NodeList to array
    const data = [];
    rows.shift();
    rows.splice(-2);
    rows.forEach((row, index) => {
        const getTextContent = (selector) => {
            const subRow = row.querySelector(selector);
            return subRow ? subRow.textContent.trim() : '';
        };

        const no = parseFloat(getTextContent('td:nth-child(1)').replace(/[,.-]/g, '')) || 0;
        const productCode = getTextContent('td:nth-child(2)');
        const productName = getTextContent('td:nth-child(3)');
        const color = getTextContent('td:nth-child(5)');

        const productQty = [];
        for (let i = 6; i <= 10; i++) {
            const qtyText = getTextContent(`td:nth-child(${i})`).replace(/\t+/g, '').trim().replace(getTextContent(`td:nth-child(${i}) span`), '');
            productQty.push({
                qty: parseFloat(qtyText.replace(/[,.-]/g, '')) || 0, // Convert qty to float
                uom: getTextContent(`td:nth-child(${i}) span`),
            });
        }

        const productPrices = [];
        for (let i = 11; i <= 15; i++) {
            const priceText = getTextContent(`td:nth-child(${i})`);
            productPrices.push(parseFloat(priceText.replace(/[,.-]/g, '')) || 0); // Convert prices to float
        }

        const amount = getTextContent('td:nth-child(16)');
        const adjustmentPrice = getTextContent('td:nth-child(17)');
        const discountAmount = getTextContent('td:nth-child(18)');

        const item = {
            no,
            productCode,
            productName,
            color,
            productQty,
            productPrices,
            amount: parseFloat(amount.replace(/[,.-]/g, '')) || 0,
            adjustmentPrice: parseFloat(adjustmentPrice.replace(/[,.-]/g, '')) || 0,
            discountAmount: parseFloat(discountAmount.replace(/[,.-]/g, '') || 0)
        };

        data.push(item);
    });
    console.dir(data, { depth: null });
};

main().then();
