require('dotenv').config();
const { poolPromise } = require('./src/config/database');

async function test() {
    try {
        const pool = await poolPromise;
        const res3 = await pool.request().query(`
            SELECT TOP 5 COLUMN_NAME 
            FROM [db_Cost_Data_Centralized].INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'tb_Master_Machine_Process'
        `);
        console.log("Process columns:", res3.recordset);

        const res4 = await pool.request().query(`
            SELECT TOP 5 COLUMN_NAME 
            FROM [db_Cost_Data_Centralized].INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'tb_Master_Machine_Group'
        `);
        console.log("MC Group columns:", res4.recordset);

        // Let's also check if Cut_ID matches ANY row from the user's Excel?
        // Let's do a sample test on the view.
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
test();
