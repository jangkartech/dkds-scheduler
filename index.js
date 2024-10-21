import {getOrders, getDetailOrder} from "./services/dkds.service.js";
import cheerio from 'cheerio';

const main  = async () => {
    // const orders = await  getOrders();
    // console.log(orders);
    const orderId = '202210030001';
    const order = await getDetailOrder(orderId);
    const $ = cheerio.load(order); // Load the string HTML into Cheerio

    const orderData = {};

    // Extract order and salesman details
    orderData.order_no = $('th:contains("No. RO SFA")').text().trim();
    orderData.ro_dkds_no = $('a[href*="transaksi%2Freal-order"]').text().trim();
    orderData.salesman = $('th:contains("Salesman")').next().next().text().trim();
    orderData.real_order_date = $('th:contains("Tgl. Real Order")').next().next().text().trim();
    orderData.po_no = $('th:contains("No. Po")').next().next().text().trim();
    orderData.po_date = $('th:contains("Tgl. PO")').next().next().text().trim();

    // Extract customer details
    orderData.customer = {
        id: $('th:contains("Customer")').next().next().text().split(' ')[0].trim(),
        name: $('th:contains("Customer")').next().next().text().split(' ')[1].trim(),
        address: $('i:contains("JL.")').text().trim(),
    };

    // Extract payment type and terms
    orderData.payment_type = $('td:contains("Type Bayar")').next().next().text().trim();
    orderData.payment_term = $('td:contains("TOP")').text().trim();
    orderData.due_date = $('i:contains("(")').text().replace(/[()]/g, '').trim();

    // Extract warehouse and products
    orderData.warehouse = $('th:contains("Gudang")').next().next().text().trim();

    orderData.products = [];
    $('table.table-bordered tbody tr').each((index, element) => {
        const product = {
            no: $(element).find('td:nth-child(1)').text().trim(),
            product_code: $(element).find('td:nth-child(2)').text().trim(),
            product_name: $(element).find('td:nth-child(3)').text().trim(),
            qty_rcg: $(element).find('td:nth-child(5)').text().trim(),
            price: $(element).find('td:nth-child(9)').text().replace(/[^\d]/g, ''),
            total: $(element).find('td:nth-child(14)').text().replace(/[^\d]/g, ''),
        };
        if (product.no) orderData.products.push(product);
    });

    // Total
    orderData.total = $('strong:contains("JUMLAH")').next().text().replace(/[^\d]/g, '');

    return orderData;
}

main().then();
