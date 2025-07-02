import { DataType, DataTypes } from "sequelize";
import { sequelize } from "../config/database.config";

const User = sequelize.define('User', {
    
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    username: {type: DataTypes.STRING, allowNull: false, unique: true},
    password: {type: DataTypes.STRING, allowNull: false},
    role: {type: DataTypes.ENUM('user', 'purchase'), allowNull: false},

});

export default User;