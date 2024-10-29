import fetch from 'node-fetch';
import {URLSearchParams} from 'url';
import {promises as fs} from 'fs';
import path from 'path';
import {config} from 'dotenv';
import {JSDOM} from "jsdom";
import puppeteer from 'puppeteer';

config();

export const refetchCookies = async () => {
    const baseUrl = process.env.DKDS_BASE_URL;
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Navigate to the login page
    await page.goto(baseUrl+'/dkds/web/index.php?r=site%2Flogin', { waitUntil: 'networkidle2' });

    // Wait for the form fields to be visible
    await page.waitForSelector('#loginform-username');
    await page.waitForSelector('#loginform-password');

    // Fill in the username and password from .env
    await page.type('#loginform-username', process.env.DKDS_USERNAME, { delay: 100 });
    await page.type('#loginform-password', process.env.DKDS_PASSWORD, { delay: 100 });

    // Submit the form
    await Promise.all([
        page.click('button[type="submit"]'),  // Click the login button
        page.waitForNavigation({ waitUntil: 'networkidle2' })  // Wait for the next page to load
    ]);

    // Extract the CSRF token from the dashboard
    const csrfToken = await page.$eval('meta[name="csrf-token"]', el => el.content);
    // Read all cookies after login, including HttpOnly cookies
    const cookies = await page.cookies();

    // Read existing data from credential.json
    let existingData = {};
    try {
        const fileContent = await fs.readFile('credential.json', 'utf-8');
        existingData = JSON.parse(fileContent);
    } catch (error) {
        console.log('No existing credential.json file found, creating a new one.');
    }

    // Update the cookies key
    existingData["COOKIES"] = cookies;
    existingData["DKDS_CSRF"] = csrfToken;

    // Write updated data back to credential.json
    await fs.writeFile('credential.json', JSON.stringify(existingData, null, 2));

    console.log('Cookies updated in credential.json');

    await browser.close();
}


// Define an async function to perform the POST request
export const getOrders = async () => {
    try {
        // Read and parse the credentials JSON file
        const credentialsPath = path.resolve('./credential.json');
        const credentialsData = await fs.readFile(credentialsPath, 'utf-8');
        const credentials = JSON.parse(credentialsData);

        const csrf = credentials.DKDS_CSRF;
        const csrfCookie = credentials.COOKIES[0].value;
        const phpsessid = credentials.COOKIES[1].value;
        const cookie = "PHPSESSID="+phpsessid+"; _csrf="+csrfCookie;
        const baseUrl = process.env.DKDS_BASE_URL;

        console.log({
            'csrf': csrf,
            'cookie': cookie,
            'baseUrl': baseUrl
        })

        // Create URLSearchParams for the form data
        const formData = new URLSearchParams();
        formData.append('_csrf', csrf);
        formData.append('RealOrder[distributor_code]', '70006022');
        formData.append('RealOrder[start_sales]', '');
        formData.append('RealOrder[end_sales]', '');
        formData.append('RealOrder[start_outlet]', '');
        formData.append('RealOrder[end_outlet]', '');
        formData.append('RealOrder[start_ro]', '');
        formData.append('RealOrder[end_ro]', '');
        formData.append('RealOrder[start_date]', '');
        formData.append('RealOrder[end_date]', '');

        // Perform the POST request
        const response = await fetch(baseUrl + '/dkds/web/index.php?r=sfa%2Freal-order%2Flist-rorder', {
            method: 'POST',
            headers: {
                'Cookie': cookie,
                'Accept': 'text/plain, */*; q=0.01',
                'Accept-Encoding': 'gzip, deflate',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Host': '192.168.1.253',
                'Origin': baseUrl,
                'Referer': baseUrl + '/dkds/web/index.php?r=sfa%2Freal-order%2Fmultiple',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        });

        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            return await response.json()
        } else {
            const text = await response.text();
            return JSON.parse(text);
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
    }
};

export const getDetailOrder = async (orderId) => {
    try {
        // Read and parse the credentials JSON file
        const credentialsPath = path.resolve('./credential.json');
        const credentialsData = await fs.readFile(credentialsPath, 'utf-8');
        const credentials = JSON.parse(credentialsData);

        const csrf = credentials.DKDS_CSRF;
        const csrfCookie = credentials.COOKIES[0].value;
        const phpsessid = credentials.COOKIES[1].value;
        const cookie = "PHPSESSID="+phpsessid+"; _csrf="+csrfCookie;
        const baseUrl = process.env.DKDS_BASE_URL;

        console.log({
            'csrf': csrf,
            'cookie': cookie,
            'baseUrl': baseUrl
        })
        // Perform the POST request
        const response = await fetch(baseUrl + '/dkds/web/index.php?r=sfa%2Freal-order%2Fview&id=' + orderId + '&distributor_code=70006022', {
            method: 'GET',
            headers: {
                'Cookie': cookie,
                'Accept': 'text/plain, */*; q=0.01',
                'Accept-Encoding': 'gzip, deflate',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Host': '192.168.1.253',
                'Origin': baseUrl,
                'Referer': baseUrl + '/dkds/web/index.php?r=sfa%2Freal-order%2Fmultiple',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest'
            },
        });

        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            return await response.json()
        } else {
            const order = await response.text()
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
            const dueDate = getTextContent('.real-order-view .col-lg-4:nth-of-type(2) table tbody tr:nth-child(4) td:nth-child(3) i').replace('(', '').replace(')', '');
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
            return {
                'noROSFA': noROSFA,
                'noRODKDS': noRODKDS,
                'salesman': salesman,
                'realOrderDate': realOrderDate,
                'noPO': noPO,
                'PODate': PODate,
                'customerName': customerName,
                'customerAddress': customerAddress,
                'paymentType': paymentType,
                'dueDate': dueDate,
                'warehouse': warehouse,
                'description': description,
                'items': items
            }
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
    }
}

export const getDKDSSaleOrders = async (page = 1) => {
    try {
        // Read and parse the credentials JSON file
        const credentialsPath = path.resolve('./credential.json');
        const credentialsData = await fs.readFile(credentialsPath, 'utf-8');
        const credentials = JSON.parse(credentialsData);

        const csrf = credentials.DKDS_CSRF;
        const csrfCookie = credentials.COOKIES[0].value;
        const phpsessid = credentials.COOKIES[1].value;
        const cookie = "PHPSESSID="+phpsessid+"; _csrf="+csrfCookie;
        const baseUrl = process.env.DKDS_BASE_URL;

        console.log({
            'csrf': csrf,
            'cookie': cookie,
            'baseUrl': baseUrl
        })

        // Perform the POST request
        const response = await fetch(baseUrl + '/dkds/web/index.php?r=transaksi/sales-order/index&TransaksiSorderSearch[id]=&TransaksiSorderSearch[no_rorder]=&TransaksiSorderSearch[date]=&TransaksiSorderSearch[sales_id]=&TransaksiSorderSearch[outlet_code]=&TransaksiSorderSearch[total_inv]=&TransaksiSorderSearch[keterangan]=&TransaksiSorderSearch[user_id]=&TransaksiSorderSearch[post]=1&TransaksiSorderSearch[block_order]=&page='+page, {
            method: 'GET',
            headers: {
                'Cookie': cookie,
                'Accept': 'text/plain, */*; q=0.01',
                'Accept-Encoding': 'gzip, deflate',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Host': '192.168.1.253',
                'Origin': baseUrl,
                'Referer': baseUrl + '/dkds/web/index.php?r=sfa%2Freal-order%2Fmultiple',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest'
            },
        });
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json()
        } else {
            const text = await response.text();
            return JSON.parse(text);
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
    }
};
