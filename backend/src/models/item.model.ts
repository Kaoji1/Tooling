import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.config';

const Item = sequelize.define('Item', {
    
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    itemNo: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }

});

export default Item;