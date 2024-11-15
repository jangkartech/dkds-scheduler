// models/order.js
import { DataTypes } from 'sequelize';
import sequelize from '../database.js';
import OrderItem from './orderItem.js'; // Import OrderItem to define the relationship

const Order = sequelize.define(
  'order',
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    warehouseId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    paymentType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    priceType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    salesmanId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

// Define the relationship (One Order can have many OrderItems)
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

export default Order;
