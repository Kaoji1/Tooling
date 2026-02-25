const sql = require('mssql');
const { poolPromise } = require('../config/database');

// 1. Get Notifications (History) - with optional role-based filtering
exports.getNotifications = async (req, res) => {
    try {
        const role = req.query.role || null;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Role', sql.NVarChar(50), role)
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

// 3. Mark All as Read
exports.markAllRead = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('trans.Stored_Mark_All_Notifications_Read');

        const updatedCount = result.recordset[0]?.UpdatedCount || 0;
        res.status(200).send({
            message: 'All notifications marked as read',
            updatedCount
        });
    } catch (err) {
        console.error('Error markAllRead:', err);
        res.status(500).send({ message: err.message });
    }
};

// ═══════════════════════════════════════════════════
// Shared Helper: Insert notification and emit socket
// ═══════════════════════════════════════════════════
exports.emitNotification = async (req, pool, {
    eventType,
    subject,
    messageEN,
    messageTH,
    docNo,
    actionBy,
    targetRoles,
    ctaRoute
}) => {
    try {
        const io = req.app.get('socketio');

        // 1. Save to DB (new SP with extended params)
        const notifyResult = await pool.request()
            .input('Event_Type', sql.NVarChar, eventType)
            .input('Message', sql.NVarChar, messageEN)
            .input('Doc_No', sql.NVarChar, docNo || '')
            .input('Action_By', sql.NVarChar, actionBy || 'System')
            .input('Subject', sql.NVarChar, subject || '')
            .input('Message_TH', sql.NVarChar, messageTH || '')
            .input('Target_Roles', sql.NVarChar, targetRoles || 'ALL')
            .input('CTA_Route', sql.NVarChar, ctaRoute || '')
            .execute('trans.Stored_Insert_Notification_Log');

        const notificationId = notifyResult.recordset[0]?.Notification_ID;

        // 2. Emit Real-time Socket Event
        if (io) {
            io.emit('notification', {
                id: notificationId,
                type: eventType,
                subject: subject || '',
                message: messageEN,
                messageTH: messageTH || '',
                docNo: docNo || '',
                actionBy: actionBy || 'System',
                targetRoles: targetRoles || 'ALL',
                ctaRoute: ctaRoute || '',
                timestamp: new Date()
            });
            console.log(`[Notification] Emitted: ${eventType} (ID: ${notificationId}) -> ${targetRoles}`);
        }

        return notificationId;
    } catch (err) {
        console.error('[Notification] emitNotification error:', err);
        return null;
    }
};
