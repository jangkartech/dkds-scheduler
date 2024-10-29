import {JSDOM} from "jsdom";
import {promises as fs} from 'fs';
import {getDKDSSaleOrders, refetchCookies} from "./services/dkds.service.js";

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
    const orders = await getDKDSSaleOrders();
    const {document} = (new JSDOM(orders)).window;
    const rows = document.querySelectorAll('.table tbody tr');
    const scrapedData = Array.from(rows).map(row => {
        const cells = row.querySelectorAll('td');
        const salesman = cells[4].textContent.trim().split((' - '));
        const salesmanCode = salesman[0]
        const salesmanName = salesman[1]
        const customer = cells[5].textContent.trim().split((' - '));
        const customerCode = customer[0]
        const customerNameAndAddress = customer[1].split('Add: ')
        const customerName = customerNameAndAddress[0].trim()
        const customerAddress = customerNameAndAddress[1].trim()
        return {
            rowNumber: cells[0].textContent.trim(),
            salesOrder: cells[1].textContent.trim(),
            noRealOrder: cells[2].textContent.trim(),
            date: cells[3].textContent.trim(),
            salesmanCode,
            salesmanName,
            customerCode,
            customerName,
            customerAddress,
            totalInv: cells[6].textContent.trim(),
            keterangan: cells[7].textContent.trim(),
            postedBy: cells[8].textContent.trim(),
            postStatus: cells[9].textContent.trim(),
            blockOrder: cells[10].textContent.trim()
        };
    });
    // Initialize the pagination object
    const pagination = {
        currentPage: null,
        totalPage: 0,
        total: 0,
        pages: []
    };

    // Find all page links (ignoring 'First', 'Prev', 'Next', 'Last' links)
    const pageLinks = [...document.querySelectorAll('.pagination li a')]
        .filter(link => !['First', 'Last', '«', '»'].includes(link.textContent));

    // Set the total number of pages
    pagination.totalPage = pageLinks.length;

    // Find and set the current page
    const activePage = document.querySelector('.pagination li.active a');
    if (activePage) {
        pagination.currentPage = parseInt(activePage.textContent, 10);
    }

    // Extract all page numbers
    pagination.pages = pageLinks.map(link => parseInt(link.textContent, 10));
    pagination.total = scrapedData.length;

    const data = {
        data: scrapedData,
        meta: {
            pagination
        }
    }
    console.log(data)
};

main().then();
