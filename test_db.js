const { poolPromise } = require('./backend/src/config/database');

async function test() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT TOP 1 COLUMN_NAME 
            FROM [db_Production_Report_PMA].INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'tb_part_no'
        `);
        console.log("tb_part_no columns check:", result.recordset);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
test();
