import {JSDOM} from "jsdom";
import {
    getAllDKDSSaleOrders,
    getDKDSSaleOrders,
    getDKDSSaleOrdersById,
    refetchCookies
} from "./services/dkds.service.js";
import {promises as fs} from 'fs';

const main = async () => {
    // const twinUser = await refetchTwinToken();
    // const order = await getTwinOrder();
    // console.log(order);

    // await refetchCookies();
    // const orders = await getAllDKDSSaleOrders();
    // const order = await getDKDSSaleOrdersById(orders[0].salesOrder);
    // console.log(order);

    const order = await fs.readFile('index.html', 'utf-8');
    const {document} = (new JSDOM(order)).window;
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
    const customerNameAndAddress = customer[1].split('\t')
    const customerName = customerNameAndAddress[0].trim();
    const customerAddress = customerNameAndAddress[customerNameAndAddress.length - 1 ].trim();
    const data = {
        noRealOrder : getTextContent(
            '.rorder-view ' +
            '.row:nth-of-type(1) ' +
            '.col-sm-4:nth-of-type(1) ' +
            '.table-view-rorder ' +
            'tr:nth-child(1) ' +
            'th'
        ),
        noSalesOrder : getTextContent(
            '.rorder-view ' +
            '.row:nth-of-type(1) ' +
            '.col-sm-4:nth-of-type(1) ' +
            '.table-view-rorder ' +
            'tr:nth-child(2) ' +
            'th'
        ),
        salesmanCode,
        salesmanName,
        oderType : getTextContent(
            '.rorder-view ' +
            '.row:nth-of-type(1) ' +
            '.col-sm-4:nth-of-type(1) ' +
            '.table-view-rorder ' +
            'tr:nth-child(4) ' +
            'th'
        ),
        oderDate : getTextContent(
            '.rorder-view ' +
            '.row:nth-of-type(1) ' +
            '.col-sm-4:nth-of-type(1) ' +
            '.table-view-rorder ' +
            'tr:nth-child(5) ' +
            'th'
        ),
        createdBy : getTextContent(
            '.rorder-view ' +
            '.row:nth-of-type(1) ' +
            '.col-sm-4:nth-of-type(1) ' +
            '.table-view-rorder ' +
            'tr:nth-child(7) ' +
            'th'
        ),
        noPo : getTextContent(
            '.rorder-view ' +
            '.row:nth-of-type(1) ' +
            '.col-sm-4:nth-of-type(2) ' +
            '.table-view-rorder ' +
            'tr:nth-child(1) ' +
            'th'
        ),
        poDate : getTextContent(
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
        paymentType : getTextContent(
            '.rorder-view ' +
            '.row:nth-of-type(1) ' +
            '.col-sm-4:nth-of-type(2) ' +
            '.table-view-rorder ' +
            'tr:nth-child(4) ' +
            'th ' +
            'strong'
        ),
        dueDate : getTextContent(
            '.rorder-view ' +
            '.row:nth-of-type(1) ' +
            '.col-sm-4:nth-of-type(2) ' +
            '.table-view-rorder ' +
            'tr:nth-child(4) ' +
            'th '
        ).split('/')[1].trim(),
        status : getTextContent(
            '.rorder-view ' +
            '.row:nth-of-type(1) ' +
            '.col-sm-4:nth-of-type(3) ' +
            '.table-view-rorder ' +
            'tr:nth-child(1) ' +
            'th '
        ),
        warehouse : getTextContent(
            '.rorder-view ' +
            '.row:nth-of-type(1) ' +
            '.col-sm-4:nth-of-type(3) ' +
            '.table-view-rorder ' +
            'tr:nth-child(2) ' +
            'th'
        ),
        description : getTextContent(
            '.rorder-view ' +
            '.row:nth-of-type(1) ' +
            '.col-sm-4:nth-of-type(3) ' +
            '.table-view-rorder ' +
            'tr:nth-child(3) ' +
            'th'
        ),
        printCount : getTextContent(
            '.rorder-view ' +
            '.row:nth-of-type(1) ' +
            '.col-sm-4:nth-of-type(3) ' +
            '.table-view-rorder ' +
            'tr:nth-child(4) ' +
            'th span'
        ),
        taxBase : getTextContent(
            '.rorder-view ' +
            '.row:nth-of-type(2) ' +
            '.col-sm-8:nth-of-type(1) ' +
            '.table-promo-input ' +
            'tr:nth-child(1) ' +
            'td:nth-child(7)'
        ),
        discountValue : getTextContent(
            '.rorder-view ' +
            '.row:nth-of-type(2) ' +
            '.col-sm-8:nth-of-type(1) ' +
            '.table-promo-input ' +
            'tr:nth-child(1) ' +
            'td:nth-child(3)'
        ),
        discountPercentage : getTextContent(
            '.rorder-view ' +
            '.row:nth-of-type(2) ' +
            '.col-sm-8:nth-of-type(1) ' +
            '.table-promo-input ' +
            'tr:nth-child(2) ' +
            'td:nth-child(3)'
        ),
        amount : getTextContent(
            '.rorder-view ' +
            '.row:nth-of-type(2) ' +
            '.col-sm-8:nth-of-type(1) ' +
            '.table-promo-input ' +
            'tr:nth-child(1) ' +
            'td:nth-child(11)'
        ),
        taxValue : getTextContent(
            '.rorder-view ' +
            '.row:nth-of-type(2) ' +
            '.col-sm-8:nth-of-type(1) ' +
            '.table-promo-input ' +
            'tr:nth-child(2) ' +
            'td:nth-child(7)'
        ),
        points : getTextContent(
            '.rorder-view ' +
            '.row:nth-of-type(2) ' +
            '.col-sm-8:nth-of-type(1) ' +
            '.table-promo-input ' +
            'tr:nth-child(3) ' +
            'td:nth-child(3)'
        ),
        adjustmentPrice : getTextContent(
            '.rorder-view ' +
            '.row:nth-of-type(2) ' +
            '.col-sm-8:nth-of-type(1) ' +
            '.table-promo-input ' +
            'tr:nth-child(3) ' +
            'td:nth-child(7)'
        ),
        totalInvoice : getTextContent(
            '.rorder-view ' +
            '.row:nth-of-type(2) ' +
            '.col-sm-8:nth-of-type(1) ' +
            '.table-promo-input ' +
            'tr:nth-child(3) ' +
            'td:nth-child(11)'
        ),
    }
    console.log(data);

};

main().then();
