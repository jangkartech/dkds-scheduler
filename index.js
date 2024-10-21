import { getOrders, getDetailOrder } from './services/dkds.service.js';
import { JSDOM } from 'jsdom';

const main = async () => {
    // const orders = await getOrders();
    // console.log(orders);
    const orderId = '202210030001';
    const order = await getDetailOrder(orderId);
    const { document } = (new JSDOM(order)).window;

// Scrape data
    const orderNumber = document.querySelector('.real-order-view .font12').textContent.trim(); // First .font12 will give you No. RO SFA
    const customerInfo = document.querySelector('.real-order-view .font12').nextSibling.textContent.trim(); // Getting customer info

// Extract product details
    const products = [];
    const productRows = document.querySelectorAll('.table-custom-default tbody tr');

    productRows.forEach((row) => {
        const productNumber = row.children[1].textContent.trim(); // Product number
        const productName = row.children[2].textContent.trim(); // Product name
        const productQty = Array.from(row.children).slice(3, 8).map((cell) => cell.textContent.trim()); // Quantity
        const productPrices = Array.from(row.children).slice(8, 13).map((cell) => cell.textContent.trim()); // Prices
        const totalAmount = row.children[13].textContent.trim(); // Total amount

        products.push({
            productNumber,
            productName,
            productQty,
            productPrices,
            totalAmount,
        });
    });

// Display the scraped data
    console.log('Order Number:', orderNumber);
    console.log('Customer Info:', customerInfo);
    console.log('Products:', products);
};

main().then();
