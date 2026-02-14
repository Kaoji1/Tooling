const sql = require('mssql');
const { poolPromise } = require('../config/database');

// 1. Get Notifications (History)
exports.getNotifications = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('trans.Stored_Get_Notification_Log');

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error getNotifications:', err);
        res.status(500).send({ message: err.message });
    }
};

// 2. Mark as Read
exports.markAsRead = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).send({ message: 'Notification ID is required' });
        }

        const pool = await poolPromise;
        await pool.request()
            .input('Notification_ID', sql.Int, id)
            .execute('trans.Stored_Update_Notification_Read');

        res.status(200).send({ message: 'Notification marked as read', id: id });
    } catch (err) {
        console.error('Error markAsRead:', err);
        res.status(500).send({ message: err.message });
    }
};
