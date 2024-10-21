import { getOrders, getDetailOrder } from './services/dkds.service.js';
import { JSDOM } from 'jsdom';

const main = async () => {
    // const orders = await getOrders();
    // console.log(orders);
    const orderId = '202210030001';
    const order = await getDetailOrder(orderId);
    const dom = new JSDOM(order); // Load the string HTML into JSDOM
    const { document } = dom.window; // Get the document from JSDOM

    const orderData = {};

    // Extract order and salesman details
    orderData.order_no = document.querySelector('th:contains("No. RO SFA")').textContent.trim();
    orderData.ro_dkds_no = document.querySelector('a[href*="transaksi%2Freal-order"]').textContent.trim();
    orderData.salesman = document.querySelector('th:contains("Salesman")').nextElementSibling.nextElementSibling.textContent.trim();
    orderData.real_order_date = document.querySelector('th:contains("Tgl. Real Order")').nextElementSibling.nextElementSibling.textContent.trim();
    orderData.po_no = document.querySelector('th:contains("No. Po")').nextElementSibling.nextElementSibling.textContent.trim();
    orderData.po_date = document.querySelector('th:contains("Tgl. PO")').nextElementSibling.nextElementSibling.textContent.trim();

    // Extract customer details
    const customerDetails = document.querySelector('th:contains("Customer")').nextElementSibling.nextElementSibling.textContent.trim().split(' ');
    orderData.customer = {
        id: customerDetails[0].trim(),
        name: customerDetails[1] ? customerDetails[1].trim() : '',
        address: document.querySelector('i:contains("JL.")').textContent.trim(),
    };

    // Extract payment type and terms
    orderData.payment_type = document.querySelector('td:contains("Type Bayar")').nextElementSibling.nextElementSibling.textContent.trim();
    orderData.payment_term = document.querySelector('td:contains("TOP")').textContent.trim();
    orderData.due_date = document.querySelector('i:contains("(")').textContent.replace(/[()]/g, '').trim();

    // Extract warehouse and products
    orderData.warehouse = document.querySelector('th:contains("Gudang")').nextElementSibling.nextElementSibling.textContent.trim();

    orderData.products = [];
    const rows = document.querySelectorAll('table.table-bordered tbody tr');
    rows.forEach((row) => {
        const product = {
            no: row.querySelector('td:nth-child(1)').textContent.trim(),
            product_code: row.querySelector('td:nth-child(2)').textContent.trim(),
            product_name: row.querySelector('td:nth-child(3)').textContent.trim(),
            qty_rcg: row.querySelector('td:nth-child(5)').textContent.trim(),
            price: row.querySelector('td:nth-child(9)').textContent.replace(/[^\d]/g, ''),
            total: row.querySelector('td:nth-child(14)').textContent.replace(/[^\d]/g, ''),
        };
        if (product.no) orderData.products.push(product);
    });

    // Total
    orderData.total = document.querySelector('strong:contains("JUMLAH")').nextSibling.textContent.replace(/[^\d]/g, '');

    return orderData;
};

main().then();
