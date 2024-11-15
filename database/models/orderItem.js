// models/orderItem.js
import { DataTypes } from 'sequelize';
import sequelize from '../database.js';

const OrderItem = sequelize.define(
  'order_item',
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Orders', // This should match the name of the Order model (table)
        key: 'id',
      },
      onDelete: 'CASCADE', // If the Order is deleted, the related OrderItems will also be deleted
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantityPcs: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    discountPercent: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    discountAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    promoId: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: process.env.DKDS_PROMO_ID,
    },
    promoCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: false,
  }
);

export default OrderItem;
