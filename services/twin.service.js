import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import path from 'path';
import { config } from 'dotenv';
import Order from '../database/models/order.js';
import OrderItem from '../database/models/orderItem.js';
import { orderItemTwinToDB, orderTwinToDB } from './mapper.service.js';

config();
// Refetch and update TWIN API token
export const refetchTwinToken = async () => {
  const baseUrl = process.env.TWIN_BASE_URL;
  console.log(`${baseUrl}/login`);

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

  console.log(responseData.token);

  await fs.writeFile('credential.json', JSON.stringify(credentials, null, 2));

  console.log('Token updated in credential.json');
  return responseData;
};

// Get order and its items
export const getTwinOrders = async (orderIds = ['13426134']) => {
  try {
    const baseUrl = process.env.TWIN_BASE_URL;
    const credentialsPath = path.resolve('./credential.json');
    const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf-8'));
    const token = credentials.TWIN_TOKEN;

    const queryString = orderIds
      .map((id) => `ids[]=${encodeURIComponent(id)}`)
      .join('&');
    console.log(`${baseUrl}/external_app/dk/penjualan?${queryString}`);
    const response = await fetch(
      `${baseUrl}/external_app/dk/penjualan?${queryString}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const contentType = response.headers.get('content-type');
    return contentType && contentType.includes('application/json')
      ? (await response.json()).data
      : await response.text();
  } catch (error) {
    console.error(`Error fetching data penjualan:`, error);
    return null;
  }
};

// Create new order with items
export const createTwinOrder = async (orderPayload) => {
  const baseUrl = process.env.TWIN_BASE_URL;
  const credentialsPath = path.resolve('./credential.json');
  const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf-8'));
  const token = credentials.TWIN_TOKEN;

  try {
    // Submit order data
    const response = await fetch(
      `${baseUrl}/external_app/dk/penjualan_with_detail`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderPayload),
      }
    );

    // Handle non-201 status codes
    if (response.status === 422) {
      const errorDetail = await response.json();
      const validationErrors = errorDetail.errors || errorDetail; // Adjust to match Laravel's error format
      console.error('Validation error:', validationErrors);
      return null;
    }

    if (!response.ok) {
      console.error(`Unexpected response status: ${response.status}`);
      return null;
    }

    // Proceed only if status is 201
    if (response.status === 201) {
      const contentType = response.headers.get('content-type');
      const order =
        contentType && contentType.includes('application/json')
          ? (await response.json()).data
          : await response.text();

      console.log(order);

      // Save order and order items to DB
      const createdOrder = await Order.create(orderTwinToDB(order));
      await Promise.all(
        order.detail.map(async (item) => {
          return await OrderItem.create(orderItemTwinToDB(item));
        })
      );

      return order;
    }
  } catch (error) {
    console.error('Error fetching data penjualan:', error);
    return null;
  }
};
