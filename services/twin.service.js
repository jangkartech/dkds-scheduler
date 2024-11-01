import fetch from 'node-fetch';
import {promises as fs} from 'fs';
import path from 'path';

// Refetch and update TWIN API token
export const refetchTwinToken = async () => {
    const baseUrl = process.env.TWIN_BASE_URL;

    const response = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            email: process.env.TWIN_USERNAME,
            password: process.env.TWIN_PASSWORD,
        }),
    });

    let responseData = {};
    const contentType = response.headers.get('content-type');

    // Ensure response is parsed correctly
    if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
    } else {
        responseData = JSON.parse(await response.text());
    }

    // Load or initialize credential data
    let credentials = {};
    try {
        const fileContent = await fs.readFile('credential.json', 'utf-8');
        credentials = JSON.parse(fileContent);
    } catch {
        console.log('Creating new credential.json file.');
    }

    credentials.TWIN_TOKEN = responseData.token;
    credentials.TWIN_USER = responseData.user;

    await fs.writeFile('credential.json', JSON.stringify(credentials, null, 2));

    console.log('Token updated in credential.json');
    return responseData;
};

// Fetch data with token-based authentication
const fetchData = async (endpoint) => {
    try {
        const baseUrl = process.env.TWIN_BASE_URL;
        const credentialsPath = path.resolve('./credential.json');
        const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf-8'));
        const token = credentials.TWIN_TOKEN;

        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        const contentType = response.headers.get('content-type');
        return contentType && contentType.includes('application/json')
            ? (await response.json()).data
            : JSON.parse(await response.text()).data;
    } catch (error) {
        console.error(`Error fetching data from ${endpoint}:`, error);
        return null;
    }
};

// Get order and its items
export const getTwinOrder = async (orderId = '13426134') => {
    const orderDetails = await fetchData(`/penjualan/${orderId}`);
    const orderItems = await fetchData(`/detail_penjualan/${orderId}/detail`);
    return {orderDetails, orderItems};
};

// Create new order with items
export const createTwinOrder = async (orderPayload = {
    id : "",
    status : "",
    id_toko: "449",
    id_gudang: "1",
    po_manual: "",
    tanggal: "2024-10-28",
    tipe_pembayaran: "cash",
    tipe_harga: "rbp",
    id_salesman: "40",
    keterangan: "",
    items: [{
        id_barang: "8",
        qty: "1",
        qty_pcs: 0,
        disc_persen: 0,
        disc_rupiah: 0,
        id_promo: 0,
        kode_promo: "promo dkds"
    }],
}) => {
    const baseUrl = process.env.TWIN_BASE_URL;
    const credentialsPath = path.resolve('./credential.json');
    const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf-8'));
    const token = credentials.TWIN_TOKEN;

    const {items: orderItems, ...orderData} = orderPayload;

    // Submit order data
    const orderResponse = await fetch(`${baseUrl}/penjualan/web`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
    });

    let order = {};
    let items = [];
    const orderContentType = orderResponse.headers.get('content-type');
    if (orderContentType && orderContentType.includes('application/json')) {
        order = await orderResponse.json();
    } else {
        order = JSON.parse(await orderResponse.text());
    }
    // Submit each item in orderItems
    for (const item of orderItems) {
        const itemResponse = await fetch(`${baseUrl}/detail_penjualan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({id_penjualan: order.id, ...item}),
        });

        const itemContentType = itemResponse.headers.get('content-type');
        if (itemContentType && itemContentType.includes('application/json')) {
            const itemData = await itemResponse.json();
            items = itemData.data;
        } else {
            const itemData = JSON.parse(await itemResponse.text())
            items = itemData.data;
        }
    }

    return {order, items};
};
