const { poolPromise } = require('./config/database');
async function run() {
    const pool = await poolPromise;
    const res = await pool.request().query("SELECT TOP 5 Notification_ID, Event_Type, CTA_Route, Details_JSON, Doc_No FROM [master].[tb_Notification_Log] WHERE Event_Type = 'REQUEST_SENT' ORDER BY Notification_ID DESC");
    console.log(JSON.stringify(res.recordset, null, 2));
    process.exit(0);
}
run();
