require('dotenv').config();
const { poolPromise } = require('./src/config/database');

async function test() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT TOP 5 COLUMN_NAME 
            FROM [db_Production_Report_PMA].INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'tb_part_no'
        `);
        console.log("tb_part_no columns:", res.recordset);

        const res2 = await pool.request().query(`
            SELECT TOP 5 COLUMN_NAME 
            FROM [db_SmartCuttingTool_PMA].INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'tb_Item_MasterAll_PH'
        `);
        console.log("tb_Item_MasterAll_PH columns:", res2.recordset);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
test();
