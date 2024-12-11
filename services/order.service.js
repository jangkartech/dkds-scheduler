import Order from '../database/models/order.js';
import { Op } from 'sequelize';
import { config } from "dotenv";
import { v4 as uuid } from "uuid"

config();

export const getAllOrderByStatuses = async (statuses = []) => {
  try {
    const orders = await Order.findAll({
      where: {
        status: {
          [Op.in]: statuses
        }
      }
    });

    return orders;
  } catch (error) {
    throw error;
  }
}

export const updateOrderById = async (id, payload) => {
  try {
    const order = await Order.update(
      payload,
      {
        where: {
          id: id
        }
      }
    );

    return order;
  } catch (error) {
    throw error;
  }
}

export const createOrder = async (payload) => {
  try {
    const order = await Order.create(payload);

    return order;
  } catch (error) {
    throw error;
  }
}

export const getOrderById = async (id) => {
  try {
    const order = await Order.findOne({
      id: id
    });

    return order;
  } catch (error) {
    throw error;
  }
}