import {getOrders, getDetailOrder} from './services/dkds.service.js';
import {JSDOM} from 'jsdom';

const main = async () => {
    // const orders = await getOrders();
    // console.log(orders);
    const orderId = '202210030001';
    const order = await getDetailOrder(orderId);
    const {document} = (new JSDOM(order)).window;
    const getTextContent = (selector) => {
        const element = document.querySelector(selector);
        return element ? element.textContent.trim() : 'Element not found';
    };

    // More specific selector: matching the exact row and column structure
    const noROSFA = getTextContent('.real-order-view .col-lg-4:nth-of-type(1) table tbody tr:nth-child(1) th.font12');
    const noRODKDS = getTextContent('.real-order-view .col-lg-4:nth-of-type(1) table tbody tr:nth-child(2) th.font12 a');
    const salesman = getTextContent('.real-order-view .col-lg-4:nth-of-type(1) table tbody tr:nth-child(3) th.font12');
    const realOrderDate = getTextContent('.real-order-view .col-lg-4:nth-of-type(1) table tbody tr:nth-child(4) th.font12');

    const noPO = getTextContent('.real-order-view .col-lg-4:nth-of-type(2) table tbody tr:nth-child(1) th.font12');
    const PODate = getTextContent('.real-order-view .col-lg-4:nth-of-type(2) table tbody tr:nth-child(2) th.font12');
    const customer = getTextContent('.real-order-view .col-lg-4:nth-of-type(2) table tbody tr:nth-child(3) th.font12');
    const paymentType = getTextContent('.real-order-view .col-lg-4:nth-of-type(2) table tbody tr:nth-child(4) td:nth-child(3) strong');
    const customerAddress = customer.split('\n')[1].trim()
    const customerName = customer.split('\n')[0].trim()
    const dueDate = getTextContent('.real-order-view .col-lg-4:nth-of-type(2) table tbody tr:nth-child(4) td:nth-child(3) i').replace('(','').replace(')','');
    const warehouse = getTextContent('.real-order-view .col-lg-4:nth-of-type(3) table tbody tr:nth-child(1) th.font12');
    const description = getTextContent('.real-order-view .col-lg-4:nth-of-type(3) table tbody tr:nth-child(2) th.font12');
    const items = [];
    const tableRows = Array.from(document.querySelectorAll('.table-custom-default tbody tr'));
    // Exclude the last row (assuming it's for totals)
    const rowsToProcess = tableRows.slice(0, -1);
    rowsToProcess.forEach((row) => {
        const productNumber = row.children[1] ? row.children[1].textContent.trim() : 'N/A'; // Product number
        const productName = row.children[2] ? row.children[2].textContent.trim() : 'N/A'; // Product name
        const productQty = [];
        for (let i = 3; i < 8; i++) {
            productQty.push(row.children[i] ? row.children[i].textContent.trim() : 'N/A'); // Quantity
        }
        const productPrices = [];
        for (let i = 8; i < 13; i++) {
            productPrices.push(row.children[i] ? row.children[i].textContent.trim() : 'N/A'); // Prices
        }
        const totalAmount = row.children[13] ? row.children[13].textContent.trim() : 'N/A'; // Total amount

        items.push({
            productNumber,
            productName,
            productQty,
            productPrices,
            totalAmount,
        });
    });
    console.log({
        'noROSFA' : noROSFA,
        'noRODKDS' : noRODKDS,
        'salesman' : salesman,
        'realOrderDate' : realOrderDate,
        'noPO' : noPO,
        'PODate' : PODate,
        'customerName' : customerName,
        'customerAddress' : customerAddress,
        'paymentType' : paymentType,
        'dueDate' : dueDate,
        'warehouse' : warehouse,
        'description' : description,
        'items' : items
    })
};

main().then();
