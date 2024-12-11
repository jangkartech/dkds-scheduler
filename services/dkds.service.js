import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { promises as fs } from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { JSDOM } from 'jsdom';
import puppeteer from 'puppeteer';

config();

export const refetchCookies = async () => {
  const baseUrl = process.env.DKDS_BASE_URL;
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Navigate to the login page
  await page.goto(baseUrl + '/dkds/web/index.php?r=site%2Flogin', {
    waitUntil: 'networkidle2',
  });

  // Wait for the form fields to be visible
  await page.waitForSelector('#loginform-username');
  await page.waitForSelector('#loginform-password');

  // Fill in the username and password from .env
  await page.type('#loginform-username', process.env.DKDS_USERNAME, {
    delay: 100,
  });
  await page.type('#loginform-password', process.env.DKDS_PASSWORD, {
    delay: 100,
  });

  // Submit the form
  await Promise.all([
    page.click('button[type="submit"]'), // Click the login button
    page.waitForNavigation({ waitUntil: 'networkidle2' }), // Wait for the next page to load
  ]);

  // Extract the CSRF token from the dashboard
  const csrfToken = await page.$eval(
    'meta[name="csrf-token"]',
    (el) => el.content
  );
  // Read all cookies after login, including HttpOnly cookies
  const cookies = await page.cookies();

  // Read existing data from credential.json
  let existingData = {};
  try {
    const fileContent = await fs.readFile('credential.json', 'utf-8');
    existingData = JSON.parse(fileContent);
  } catch (error) {
    throw new Error(
      'No existing credential.json file found, creating a new one.'
    );
  }

  // Update the cookies key
  existingData['COOKIES'] = cookies;
  existingData['DKDS_CSRF'] = csrfToken;

  // Write updated data back to credential.json
  await fs.writeFile('credential.json', JSON.stringify(existingData, null, 2));
  console.log('Cookies updated in credential.json');
  await browser.close();
};

export const getDKDSSaleOrders = async (page = 1) => {
  try {
    // Read and parse the credentials JSON file
    const credentialsPath = path.resolve('./credential.json');
    const credentialsData = await fs.readFile(credentialsPath, 'utf-8');
    const credentials = JSON.parse(credentialsData);

    const csrf = credentials.DKDS_CSRF;
    const csrfCookie = credentials.COOKIES[0].value;
    const phpsessid = credentials.COOKIES[1].value;
    const cookie = 'PHPSESSID=' + phpsessid + '; _csrf=' + csrfCookie;
    const baseUrl = process.env.DKDS_BASE_URL;

    console.log({
      csrf: csrf,
      cookie: cookie,
      baseUrl: baseUrl,
    });

    // Perform the POST request
    const response = await fetch(
      baseUrl +
        '/dkds/web/index.php?r=transaksi/sales-order/index&TransaksiSorderSearch[id]=&TransaksiSorderSearch[no_rorder]=&TransaksiSorderSearch[date]=&TransaksiSorderSearch[sales_id]=&TransaksiSorderSearch[outlet_code]=&TransaksiSorderSearch[total_inv]=&TransaksiSorderSearch[keterangan]=&TransaksiSorderSearch[user_id]=&TransaksiSorderSearch[post]=1&TransaksiSorderSearch[block_order]=&page=' +
        page,
      {
        method: 'GET',
        headers: {
          Cookie: cookie,
          Accept: 'text/plain, */*; q=0.01',
          'Accept-Encoding': 'gzip, deflate',
          'Accept-Language': 'en-US,en;q=0.9',
          Connection: 'keep-alive',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          Host: '192.168.1.253',
          Origin: baseUrl,
          Referer:
            baseUrl + '/dkds/web/index.php?r=sfa%2Freal-order%2Fmultiple',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
          'X-Requested-With': 'XMLHttpRequest',
        },
      }
    );
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
  }
};

export const getAllDKDSSaleOrders = async () => {
  let allData = [];
  let currentPage = 1; // Start from the first page

  const fetchAndScrapeData = async (page) => {
    const orders = await getDKDSSaleOrders(page);
    const { document } = new JSDOM(orders).window;
    const rows = document.querySelectorAll('.table tbody tr');

    const scrapedData = Array.from(rows).map((row) => {
      const cells = row.querySelectorAll('td');
      const salesman = cells[4].textContent.trim().split(' - ');
      const customer = cells[5].textContent.trim().split(' - ');
      const customerNameAndAddress = customer[1].split('Add: ');
      return {
        rowNumber: cells[0].textContent.trim(),
        noSalesOrder: cells[1].textContent.trim(),
        noRealOrder: cells[2].textContent.trim(),
        oderDate: cells[3].textContent.trim(),
        salesmanCode: salesman[0],
        salesmanName: salesman[1],
        customerCode: customer[0],
        customerName: customerNameAndAddress[0].trim(),
        customerAddress: customerNameAndAddress[1].trim() || '',
        totalInvoice:
          parseFloat(cells[6].textContent.trim().replace(/[,.-]/g, '')) || 0, // Convert totalInvoice to float
        description: cells[7].textContent.trim(),
        createdBy: cells[8].textContent.trim(),
        status: cells[9].textContent.trim(),
        blockOrder: cells[10].textContent.trim(),
      };
    });

    // Initialize pagination object
    const pagination = {
      currentPage: null,
      totalPage: 0,
      total: 0,
      pages: [],
    };

    // Find all page links
    const pageLinks = [...document.querySelectorAll('.pagination li a')].filter(
      (link) => !['First', 'Last', '«', '»'].includes(link.textContent)
    );

    pagination.totalPage = pageLinks.length;

    const activePage = document.querySelector('.pagination li.active a');
    if (activePage) {
      pagination.currentPage = parseInt(activePage.textContent, 10);
    }

    pagination.pages = pageLinks.map((link) => parseInt(link.textContent, 10));
    pagination.total = scrapedData.length;

    return { scrapedData, pagination };
  };

  // Fetch and scrape data in a loop
  let hasMorePages = true;
  while (hasMorePages) {
    const { scrapedData, pagination } = await fetchAndScrapeData(currentPage);
    console.log(pagination);

    allData = allData.concat(scrapedData);

    // Check if there are more pages to process
    if (pagination.currentPage < pagination.totalPage) {
      currentPage++; // Move to the next page
    } else {
      hasMorePages = false; // No more pages
    }
  }
  return allData;
};

export const getDKDSSaleOrderById = async (id) => {
  try {
    // Read and parse the credentials JSON file
    const credentialsPath = path.resolve('./credential.json');
    const credentialsData = await fs.readFile(credentialsPath, 'utf-8');
    const credentials = JSON.parse(credentialsData);

    const csrf = credentials.DKDS_CSRF;
    const csrfCookie = credentials.COOKIES[0].value;
    const phpsessid = credentials.COOKIES[1].value;
    const cookie = 'PHPSESSID=' + phpsessid + '; _csrf=' + csrfCookie;
    const baseUrl = process.env.DKDS_BASE_URL;

    console.log({
      csrf: csrf,
      cookie: cookie,
      baseUrl: baseUrl,
    });

    // Perform the POST request
    const response = await fetch(
      baseUrl +
        '/dkds/web/index.php?r=transaksi/sales-order/view&distributor_code=70006022&id=' +
        id,
      {
        method: 'GET',
        headers: {
          Cookie: cookie,
          Accept: 'text/plain, */*; q=0.01',
          'Accept-Encoding': 'gzip, deflate',
          'Accept-Language': 'en-US,en;q=0.9',
          Connection: 'keep-alive',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          Host: '192.168.1.253',
          Origin: baseUrl,
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
          'X-Requested-With': 'XMLHttpRequest',
        },
      }
    );
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      const order = await response.text();
      const { document } = new JSDOM(order).window;
      const getTextContent = (selector) => {
        const element = document.querySelector(selector);
        return element ? element.textContent.trim() : 'Element not found';
      };

      // More specific selector: matching the exact row and column structure
      const salesman = getTextContent(
        '.rorder-view ' +
          '.row ' +
          '.col-sm-4:nth-of-type(1) ' +
          '.table-view-rorder ' +
          'tr:nth-child(3) ' +
          'th'
      ).split(' - ');
      const salesmanCode = salesman[0].trim();
      const salesmanName = salesman[1].trim();
      const customer = getTextContent(
        '.rorder-view ' +
          '.row ' +
          '.col-sm-4:nth-of-type(2) ' +
          '.table-view-rorder ' +
          'tr:nth-child(3) ' +
          'th'
      ).split(' - ');
      const customerCode = customer[0].trim();
      const customerNameAndAddress = customer[1].split('\t');
      const customerName = customerNameAndAddress[0].trim();
      const customerAddress =
        customerNameAndAddress[customerNameAndAddress.length - 1].trim();
      const warehouse = getTextContent(
        '.rorder-view ' +
          '.row:nth-of-type(1) ' +
          '.col-sm-4:nth-of-type(3) ' +
          '.table-view-rorder ' +
          'tr:nth-child(2) ' +
          'th'
      ).split(' - ');
      const warehouseCode = warehouse[0].trim();
      const warehouseName = warehouse[1].trim();
      const data = {
        noRealOrder: getTextContent(
          '.rorder-view ' +
            '.row:nth-of-type(1) ' +
            '.col-sm-4:nth-of-type(1) ' +
            '.table-view-rorder ' +
            'tr:nth-child(1) ' +
            'th'
        ),
        noSalesOrder: getTextContent(
          '.rorder-view ' +
            '.row:nth-of-type(1) ' +
            '.col-sm-4:nth-of-type(1) ' +
            '.table-view-rorder ' +
            'tr:nth-child(2) ' +
            'th'
        ),
        salesmanCode,
        salesmanName,
        oderType: getTextContent(
          '.rorder-view ' +
            '.row:nth-of-type(1) ' +
            '.col-sm-4:nth-of-type(1) ' +
            '.table-view-rorder ' +
            'tr:nth-child(4) ' +
            'th'
        ),
        oderDate: getTextContent(
          '.rorder-view ' +
            '.row:nth-of-type(1) ' +
            '.col-sm-4:nth-of-type(1) ' +
            '.table-view-rorder ' +
            'tr:nth-child(5) ' +
            'th'
        ),
        createdBy: getTextContent(
          '.rorder-view ' +
            '.row:nth-of-type(1) ' +
            '.col-sm-4:nth-of-type(1) ' +
            '.table-view-rorder ' +
            'tr:nth-child(7) ' +
            'th'
        ),
        noPo: getTextContent(
          '.rorder-view ' +
            '.row:nth-of-type(1) ' +
            '.col-sm-4:nth-of-type(2) ' +
            '.table-view-rorder ' +
            'tr:nth-child(1) ' +
            'th'
        ),
        poDate: getTextContent(
          '.rorder-view ' +
            '.row:nth-of-type(1) ' +
            '.col-sm-4:nth-of-type(2) ' +
            '.table-view-rorder ' +
            'tr:nth-child(2) ' +
            'th'
        ),
        customerCode,
        customerName,
        customerAddress,
        paymentType: getTextContent(
          '.rorder-view ' +
            '.row:nth-of-type(1) ' +
            '.col-sm-4:nth-of-type(2) ' +
            '.table-view-rorder ' +
            'tr:nth-child(4) ' +
            'th ' +
            'strong'
        ),
        dueDate: getTextContent(
          '.rorder-view ' +
            '.row:nth-of-type(1) ' +
            '.col-sm-4:nth-of-type(2) ' +
            '.table-view-rorder ' +
            'tr:nth-child(4) ' +
            'th '
        )
          .split('/')[1]
          .trim(),
        status: getTextContent(
          '.rorder-view ' +
            '.row:nth-of-type(1) ' +
            '.col-sm-4:nth-of-type(3) ' +
            '.table-view-rorder ' +
            'tr:nth-child(1) ' +
            'th '
        ),
        warehouseCode,
        warehouseName,
        description: getTextContent(
          '.rorder-view ' +
            '.row:nth-of-type(1) ' +
            '.col-sm-4:nth-of-type(3) ' +
            '.table-view-rorder ' +
            'tr:nth-child(3) ' +
            'th'
        ),
        printCount:
          parseFloat(
            getTextContent(
              '.rorder-view ' +
                '.row:nth-of-type(1) ' +
                '.col-sm-4:nth-of-type(3) ' +
                '.table-view-rorder ' +
                'tr:nth-child(4) ' +
                'th span'
            ).replace(/[,.-]/g, '')
          ) || 0, // Convert printCount to float
        taxBase:
          parseFloat(
            getTextContent(
              '.rorder-view ' +
                '.row:nth-of-type(2) ' +
                '.col-sm-8:nth-of-type(1) ' +
                '.table-promo-input ' +
                'tr:nth-child(1) ' +
                'td:nth-child(7)'
            ).replace(/[,.-]/g, '')
          ) || 0, // Convert taxBase to float
        discountValue:
          parseFloat(
            getTextContent(
              '.rorder-view ' +
                '.row:nth-of-type(2) ' +
                '.col-sm-8:nth-of-type(1) ' +
                '.table-promo-input ' +
                'tr:nth-child(1) ' +
                'td:nth-child(3)'
            ).replace(/[,.-]/g, '')
          ) || 0, // Convert discountValue to float
        discountPercentage:
          parseFloat(
            getTextContent(
              '.rorder-view ' +
                '.row:nth-of-type(2) ' +
                '.col-sm-8:nth-of-type(1) ' +
                '.table-promo-input ' +
                'tr:nth-child(2) ' +
                'td:nth-child(3)'
            ).replace(/[,.-]/g, '')
          ) || 0, // Convert discountPercentage to float
        amount:
          parseFloat(
            getTextContent(
              '.rorder-view ' +
                '.row:nth-of-type(2) ' +
                '.col-sm-8:nth-of-type(1) ' +
                '.table-promo-input ' +
                'tr:nth-child(1) ' +
                'td:nth-child(11)'
            ).replace(/[,.-]/g, '')
          ) || 0, // Convert amount to float
        taxValue:
          parseFloat(
            getTextContent(
              '.rorder-view ' +
                '.row:nth-of-type(2) ' +
                '.col-sm-8:nth-of-type(1) ' +
                '.table-promo-input ' +
                'tr:nth-child(2) ' +
                'td:nth-child(7)'
            ).replace(/[,.-]/g, '')
          ) || 0, // Convert taxValue to float
        points:
          parseFloat(
            getTextContent(
              '.rorder-view ' +
                '.row:nth-of-type(2) ' +
                '.col-sm-8:nth-of-type(1) ' +
                '.table-promo-input ' +
                'tr:nth-child(3) ' +
                'td:nth-child(3)'
            ).replace(/[,.-]/g, '')
          ) || 0, // Convert points to float
        adjustmentPrice:
          parseFloat(
            getTextContent(
              '.rorder-view ' +
                '.row:nth-of-type(2) ' +
                '.col-sm-8:nth-of-type(1) ' +
                '.table-promo-input ' +
                'tr:nth-child(3) ' +
                'td:nth-child(7)'
            ).replace(/[,.-]/g, '')
          ) || 0, // Convert adjustmentPrice to float
        totalInvoice:
          parseFloat(
            getTextContent(
              '.rorder-view ' +
                '.row:nth-of-type(2) ' +
                '.col-sm-8:nth-of-type(1) ' +
                '.table-promo-input ' +
                'tr:nth-child(3) ' +
                'td:nth-child(11)'
            ).replace(/[,.-]/g, '')
          ) || 0, // Convert totalInvoice to float
      };
      return data;
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
  }
};

export const getDKDSSaleOrderItemsById = async (id, customerCode) => {
  try {
    // Read and parse the credentials JSON file
    const credentialsPath = path.resolve('./credential.json');
    const credentialsData = await fs.readFile(credentialsPath, 'utf-8');
    const credentials = JSON.parse(credentialsData);

    const csrf = credentials.DKDS_CSRF;
    const csrfCookie = credentials.COOKIES[0].value;
    const phpsessid = credentials.COOKIES[1].value;
    const cookie = 'PHPSESSID=' + phpsessid + '; _csrf=' + csrfCookie;
    const baseUrl = process.env.DKDS_BASE_URL;

    console.log({
      csrf: csrf,
      cookie: cookie,
      baseUrl: baseUrl,
    });

    // Create URLSearchParams for the form data
    const formData = new URLSearchParams();
    formData.append('key', id);
    formData.append('outlet', customerCode);
    formData.append('distributor', '70006022');
    formData.append('pcode', '');

    // Perform the POST request
    const response = await fetch(
      baseUrl +
        '/dkds/web/index.php?r=transaksi%2Fsales-order%2Fview-product-list',
      {
        method: 'POST',
        headers: {
          Cookie: cookie,
          Accept: 'text/plain, */*; q=0.01',
          'Accept-Encoding': 'gzip, deflate',
          'Accept-Language': 'en-US,en;q=0.9',
          Connection: 'keep-alive',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          Host: '192.168.1.253',
          Origin: baseUrl,
          Referer:
            baseUrl + '/dkds/web/index.php?r=sfa%2Freal-order%2Fmultiple',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': csrf,
        },
        body: formData,
      }
    );

    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      const items = await response.text();
      const { document } = new JSDOM(items).window;
      const rows = Array.from(document.querySelectorAll('.table-items tr')); // Convert NodeList to array
      const data = [];
      rows.shift();
      rows.splice(-2);
      rows.forEach((row, index) => {
        const getTextContent = (selector) => {
          const subRow = row.querySelector(selector);
          return subRow ? subRow.textContent.trim() : '';
        };

        const no =
          parseFloat(getTextContent('td:nth-child(1)').replace(/[,.-]/g, '')) ||
          0;
        const productCode = getTextContent('td:nth-child(2)');
        const productName = getTextContent('td:nth-child(3)');
        const color = getTextContent('td:nth-child(5)');

        const productQty = [];
        for (let i = 6; i <= 10; i++) {
          const qtyText = getTextContent(`td:nth-child(${i})`)
            .replace(/\t+/g, '')
            .trim()
            .replace(getTextContent(`td:nth-child(${i}) span`), '');
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
          adjustmentPrice:
            parseFloat(adjustmentPrice.replace(/[,.-]/g, '')) || 0,
          discountAmount: parseFloat(discountAmount.replace(/[,.-]/g, '') || 0),
        };

        data.push(item);
      });
      return data;
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
  }
};

export const updateDKDSSalesOrderStatus = async (status) => {
  try {
    if (status === 'approved') {
      // Read and parse the credentials JSON file
      const credentialsPath = path.resolve('./credential.json');
      const credentialsData = await fs.readFile(credentialsPath, 'utf-8');
      const credentials = JSON.parse(credentialsData);

      const csrf = credentials.DKDS_CSRF;
      const csrfCookie = credentials.COOKIES[0].value;
      const phpsessid = credentials.COOKIES[1].value;
      const cookie = 'PHPSESSID=' + phpsessid + '; _csrf=' + csrfCookie;
      const baseUrl = process.env.DKDS_BASE_URL;

      const response = await fetch(
        // TODO:
        baseUrl +
          '/dkds/web/index.php?r=transaksi/sales-order/view&distributor_code=70006022&id=' +
          id,
        {
          method: 'POST',
          headers: {
            Cookie: cookie,
            Accept: 'text/plain, */*; q=0.01',
            'Accept-Encoding': 'gzip, deflate',
            'Accept-Language': 'en-US,en;q=0.9',
            Connection: 'keep-alive',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            Host: '192.168.1.253',
            Origin: baseUrl,
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );
    }
  } catch (error) {
    throw error;
  }
}
