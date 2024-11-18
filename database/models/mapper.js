import { DataTypes } from 'sequelize';
import sequelize from '../database.js';
const EntityTypes = {
  WAREHOUSE: 'warehouse',
  CUSTOMER: 'customer',
  SALESMAN: 'salesman',
  PRODUCT: 'product',
};
const Mapper = sequelize.define('mapper', {
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  mappedEntityId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entityType: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [Object.values(EntityTypes)],
    },
  },
});
export default Mapper;
