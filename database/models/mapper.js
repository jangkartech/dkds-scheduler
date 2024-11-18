import { DataTypes } from 'sequelize';
import sequelize from '../database.js';
export const EntityTypes = {
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
export const findMapperByEntity = async (mappedEntityId, entityType) => {
  try {
    const result = await Mapper.findOne({
      where: {
        mappedEntityId: mappedEntityId,
        entityType: entityType,
      },
    });

    if (result) {
      console.log('Mapper found:', result);
      return result; // The found object will be returned
    } else {
      console.log('Mapper not found');
      return null;
    }
  } catch (error) {
    console.error('Error finding mapper:', error);
  }
};
