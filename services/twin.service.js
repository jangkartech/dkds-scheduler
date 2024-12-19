import Order from '../database/models/order.js';
import OrderItem from '../database/models/orderItem.js';
import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { orderItemTwinToDB, orderTwinToDB } from './mapper.service.js';
import { getAllOrderByStatuses, updateOrderById } from './order.service.js';

config();

export const refetchTwinToken = async () => {
  const baseUrl = process.env.TWIN_BASE_URL;
  const endpoint = `${baseUrl}/login`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.TWIN_USERNAME,
        password: process.env.TWIN_PASSWORD,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw `Failed to fetch TWIN token from API \n${endpoint} : \nHTTP status ${response.status}:\n${errorText}`;
    }

    const responseData = await response.json();
    const credentials = {
      TWIN_TOKEN: responseData.token,
      TWIN_USER: responseData.user,
    };

    await fs.writeFile('credential.json', JSON.stringify(credentials, null, 2));
    return responseData;
  } catch (error) {
    throw `Error in twin service refetchTwinToken :\n${error.message || error}`;
  }
};

export const getTwinOrders = async (orderIds = ['13426134']) => {
  const baseUrl = process.env.TWIN_BASE_URL;
  const endpoint = `${baseUrl}/external_app/dk/penjualan`;
  const credentialsPath = path.resolve('./credential.json');

  try {
    const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf-8'));
    const token = credentials.TWIN_TOKEN;
    const queryString = orderIds
      .map((id) => `ids[]=${encodeURIComponent(id)}`)
      .join('&');

    const response = await fetch(`${endpoint}?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw `Failed to fetch orders from API \n${endpoint} : \nHTTP status ${response.status}:\n${errorText}`;
    }
    return await response.json();
  } catch (error) {
    throw `Error in twin service getTwinOrders : \n${error.message || error}`;
  }
};

export const createTwinOrder = async (orderPayload) => {
  const baseUrl = process.env.TWIN_BASE_URL;
  const endpoint = `${baseUrl}/external_app/dk/penjualan_with_detail`;
  const credentialsPath = path.resolve('./credential.json');

  try {
    const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf-8'));
    const token = credentials.TWIN_TOKEN;
    // Submit order to the API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderPayload),
    });

    // Handle HTTP errors
    if (response.status === 422) {
      const validationErrors = await response.json();
      const errorMessages = [];
      // Iterate over validation errors and build detailed messages
      Object.keys(validationErrors.errors || validationErrors).forEach(
        (field) => {
          const isItems = field.startsWith('items');
          if (isItems) {
            const index = field.split('.')[1];
            const specificField = field.split('.')[2];
            console.log(index, specificField);
            errorMessages.push(
              specificField +
                ' items ' +
                orderPayload.items[index][specificField] +
                ' : ' +
                validationErrors[field].join(', ')
            );
          } else {
            errorMessages.push(
              field +
                ' ' +
                orderPayload[field] +
                ' : ' +
                validationErrors[field].join(', ')
            );
          }
        }
      );

      console.log(errorMessages);
      // Throw a detailed error message
      throw `Validation error when creating order via API \n${endpoint} \n${errorMessages.join('\n')}`;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw `Failed to create order via API \n${endpoint} : \nHTTP status ${response.status}:\n${errorText}`;
    }

    // Parse API response
    const order = await response.json();

    try {
      // Save order and items to the database
      const createdOrder = await Order.create(await orderTwinToDB(order.data));
      await Promise.all(
        order.data.detail.map(async (item) =>
          OrderItem.create(await orderItemTwinToDB(item))
        )
      );

      return createdOrder;
    } catch (dbError) {
      throw `Database error while saving order and items after hitting API \n${endpoint} \n${dbError.message}`;
    }
  } catch (error) {
    throw `Error in twin service createTwinOrder : \n${error}`;
  }
};