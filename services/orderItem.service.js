import OrderItem from "../database/models/orderItem";

export const createOrderItem = async (payload) => {
  try {
    const orderItem = await OrderItem.create(payload);

    return orderItem;
  } catch (error) {
    throw error;
  }
}