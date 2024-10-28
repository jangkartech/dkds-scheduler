import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import path from "path";

// Refetch and update TWIN API token
export const refetchTwinToken = async () => {
    const baseUrl = process.env.TWIN_BASE_URL;

    const response = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
}

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
    return { orderDetails, orderItems };
};

// Create new order with items
export const createTwinOrder = async (orderPayload = {
    id_toko: "449",
    id_gudang: "1",
    po_manual: "",
    tanggal: "2024-10-28",
    tipe_pembayaran: "cash",
    tipe_harga: "rbp",
    id_salesman: "40",
    keterangan: "",
    items: [{ id_stock: "8", qty: "1", qty_pcs: 0 }]
}) => {
    const baseUrl = process.env.TWIN_BASE_URL;
    const credentialsPath = path.resolve('./credential.json');
    const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf-8'));
    const token = credentials.TWIN_TOKEN;

    const { items: orderItems, ...orderData } = orderPayload;

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
    if (orderResponse.headers.get('content-type')?.includes('application/json')) {
        order = await orderResponse.json();
    } else {
        order = JSON.parse(await orderResponse.text());
    }

    const createdItems = [];

    // Submit each item in orderItems
    for (const item of orderItems) {
        const itemResponse = await fetch(`${baseUrl}/detail_penjualan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ id_penjualan: order.id, ...item }),
        });

        if (itemResponse.headers.get('content-type')?.includes('application/json')) {
            const itemData = await itemResponse.json();
            createdItems.push(itemData.data);
        } else {
            createdItems.push(JSON.parse(await itemResponse.text()).data);
        }
    }

    return { order, createdItems };
};
