import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.config';
import User from './user.model';
import Item from './item.model';

const Request = sequelize.define('Request', {
    
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    itemId: { type: DataTypes.INTEGER, allowNull: false },
    itemNo: { type: DataTypes.STRING, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    reason: { type: DataTypes.ENUM('setup', 'broken', 'out-of-lifecycle'), allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'completed', 'uploaded'), defaultValue: 'pending' },
    dueDate: { type: DataTypes.DATE }

});

Request.belongsTo(User, { foreignKey: 'userId' });
Request.belongsTo(Item, { foreignKey: 'itemId' });

export default Request;