const { poolPromise, sql } = require('./src/config/database');
async function killAll() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT session_id
            FROM sys.dm_exec_requests
            WHERE session_id > 50 AND session_id <> @@SPID
        `);
        for (let row of res.recordset) {
            console.log("Killing", row.session_id);
            try { await pool.request().query('KILL ' + row.session_id); } catch (e) { }
        }
        console.log("Killed all hanging sessions.");
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
killAll();
