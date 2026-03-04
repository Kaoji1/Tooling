require('dotenv').config();
const { poolPromise, sql } = require('./src/config/database');

async function test() {
    try {
        const pool = await poolPromise;

        // 1. ดู format Part_No_ID ใน tb_part_no (10 แถวแรก)
        console.log('\n=== Sample Part_No_ID in tb_part_no ===');
        const sampleRes = await pool.request().query(`
            SELECT TOP 10 PN_ID, Part_No_ID 
            FROM [db_Production_Report_PMA].[master].[tb_part_no]
            ORDER BY PN_ID
        `);
        console.table(sampleRes.recordset);

        // 2. ทดสอบ PartNo ที่เอามาจาก Excel (แก้ค่าด้านล่างให้ตรงกับ Excel จริง)
        const testPartNos = [
            'A5D19-1-M1A',
            'A5D19-1-M1B',
            'C8X00-1-M1A',
        ];

        console.log('\n=== Match Result: Excel PartNo vs tb_part_no ===');
        for (const pn of testPartNos) {
            const matchRes = await pool.request()
                .input('pn', sql.NVarChar(100), pn)
                .query(`
                    SELECT PN_ID, Part_No_ID 
                    FROM [db_Production_Report_PMA].[master].[tb_part_no]
                    WHERE Part_No_ID COLLATE DATABASE_DEFAULT = @pn COLLATE DATABASE_DEFAULT
                `);
            const found = matchRes.recordset[0];
            console.log(`PartNo: "${pn}" => ${found ? `MATCH (PN_ID=${found.PN_ID})` : 'NOT FOUND ❌'}`);
        }

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
test();
