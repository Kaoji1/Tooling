import { Sequelize } from "sequelize";
import * as dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize({
    // dialect 'mssql',
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '1234'),
})