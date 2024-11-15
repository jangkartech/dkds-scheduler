import sequelize from './database/database.js';
import Order from './database/models/order.js';
import OrderItem from './database/models/orderItem.js'; // Import the OrderItem model

async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Connection established successfully.');
    await sequelize.sync({ alter: true });
    console.log('All models were synchronized.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

initializeDatabase();
