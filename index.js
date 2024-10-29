import {JSDOM} from "jsdom";
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
    let allData = [];
    let currentPage = 1; // Start from the first page

    const fetchAndScrapeData = async (page) => {
        const orders = await getDKDSSaleOrders(page);
        const {document} = (new JSDOM(orders)).window;
        const rows = document.querySelectorAll('.table tbody tr');

        const scrapedData = Array.from(rows).map(row => {
            const cells = row.querySelectorAll('td');
            const salesman = cells[4].textContent.trim().split(' - ');
            const customer = cells[5].textContent.trim().split(' - ');
            const customerNameAndAddress = customer[1].split('Add: ');

            return {
                rowNumber: cells[0].textContent.trim(),
                salesOrder: cells[1].textContent.trim(),
                noRealOrder: cells[2].textContent.trim(),
                date: cells[3].textContent.trim(),
                salesmanCode: salesman[0],
                salesmanName: salesman[1],
                customerCode: customer[0],
                customerName: customerNameAndAddress[0].trim(),
                customerAddress: customerNameAndAddress[1].trim() || '',
                totalInv: cells[6].textContent.trim(),
                description: cells[7].textContent.trim(),
                postedBy: cells[8].textContent.trim(),
                postStatus: cells[9].textContent.trim(),
                blockOrder: cells[10].textContent.trim()
            };
        });

        // Initialize pagination object
        const pagination = {
            currentPage: null,
            totalPage: 0,
            total: 0,
            pages: []
        };

        // Find all page links
        const pageLinks = [...document.querySelectorAll('.pagination li a')]
            .filter(link => !['First', 'Last', '«', '»'].includes(link.textContent));

        pagination.totalPage = pageLinks.length;

        const activePage = document.querySelector('.pagination li.active a');
        if (activePage) {
            pagination.currentPage = parseInt(activePage.textContent, 10);
        }

        pagination.pages = pageLinks.map(link => parseInt(link.textContent, 10));
        pagination.total = scrapedData.length;

        return {scrapedData, pagination};
    };

// Fetch and scrape data in a loop
    let hasMorePages = true;
    while (hasMorePages) {
        const {scrapedData, pagination} = await fetchAndScrapeData(currentPage);
        console.log({data: scrapedData, meta: {pagination}});

        allData = allData.concat(scrapedData);

        // Check if there are more pages to process
        if (pagination.currentPage < pagination.totalPage) {
            currentPage++; // Move to the next page
        } else {
            hasMorePages = false; // No more pages
        }
    }

// Now allData contains data from all pages
    console.log(allData);
};

main().then();
