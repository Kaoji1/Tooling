require('dotenv').config();
const { poolPromise } = require('./src/config/database');

async function test() {
    try {
        const pool = await poolPromise;
        // See what a real mapping record looks like
        const res5 = await pool.request().query("SELECT TOP 5 Part_Id, Cutting_ID, Process_Id, MC_Group_Id, Process, MC_Group_Id, DwgRev FROM [db_Tooling].[master].[tb_Mapping_All] WHERE Division_Id = 2");
        console.log("tb_Mapping_All existing records:", res5.recordset);

        // Try to match one of the string Part_No_ID and ITEM_NO from DB
        const res6 = await pool.request().query("SELECT TOP 5 Part_No_ID FROM [db_Production_Report_PMA].[master].[tb_part_no]");
        console.log("tb_part_no sample Part_No_ID:", res6.recordset);

        const res7 = await pool.request().query("SELECT TOP 5 ITEM_NO FROM [db_SmartCuttingTool_PMA].[viewer].[tb_Item_MasterAll_PH] WHERE ITEM_NO IS NOT NULL");
        console.log("tb_Item_MasterAll_PH sample ITEM_NO:", res7.recordset);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
test();
