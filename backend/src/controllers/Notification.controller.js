const sql = require('mssql');
const { poolPromise } = require('../config/database');

// Helper: extract Username from request header (set by frontend via x-username)
const getUsername = (req) => {
    const raw = req.headers['x-username'];
    if (!raw || raw.trim() === '') {
        console.warn('[Notification] x-username header missing or empty.');
        return null;
    }
    return raw.trim();
};

// 1. Get Notifications (Inbox) - role + per-user state
exports.getNotifications = async (req, res) => {
    try {
        const role = req.query.role || null;
        const username = getUsername(req);
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Role', sql.NVarChar(50), role)
            .input('Is_Trash', sql.Bit, 0)
            .input('Username', sql.NVarChar(100), username)
            .execute('trans.Stored_Get_Notification_Log');
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error getNotifications:', err);
        res.status(500).send({ message: err.message });
    }
};

// 2. Mark as Read (per user)
exports.markAsRead = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) return res.status(400).send({ message: 'Notification ID is required' });
        const username = getUsername(req);
        const pool = await poolPromise;
        await pool.request()
            .input('Action', sql.NVarChar(50), 'READ')
            .input('Username', sql.NVarChar(100), username)
            .input('Notification_ID', sql.Int, id)
            .execute('trans.Stored_Update_Notification_Status');
        res.status(200).send({ message: 'Notification marked as read', id });
    } catch (err) {
        console.error('Error markAsRead:', err);
        res.status(500).send({ message: err.message });
    }
};

// 3. Mark All as Read (per user)
exports.markAllRead = async (req, res) => {
    try {
        const username = getUsername(req);
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Action', sql.NVarChar(50), 'MARK_ALL_READ')
            .input('Username', sql.NVarChar(100), username)
            .input('Notification_ID', sql.Int, null)
            .execute('trans.Stored_Update_Notification_Status');
        const updatedCount = result.recordset[0]?.UpdatedCount || 0;
        res.status(200).send({ message: 'All notifications marked as read', updatedCount });
    } catch (err) {
        console.error('Error markAllRead:', err);
        res.status(500).send({ message: err.message });
    }
};

// 4. Get Trash Notifications (per user)
exports.getTrashNotifications = async (req, res) => {
    try {
        const role = req.query.role || null;
        const username = getUsername(req);
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Role', sql.NVarChar(50), role)
            .input('Is_Trash', sql.Bit, 1)
            .input('Username', sql.NVarChar(100), username)
            .execute('trans.Stored_Get_Notification_Log');
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error getTrashNotifications:', err);
        res.status(500).send({ message: err.message });
    }
};

// 5. Soft-Delete All Read Notifications (per user)
exports.deleteReadNotifications = async (req, res) => {
    try {
        const username = getUsername(req);
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Action', sql.NVarChar(50), 'DELETE_READ')
            .input('Username', sql.NVarChar(100), username)
            .input('Notification_ID', sql.Int, null)
            .execute('trans.Stored_Update_Notification_Status');
        const affectedRows = result.recordset[0]?.AffectedRows || 0;
        res.status(200).send({ message: 'Read notifications moved to trash', deletedCount: affectedRows });
    } catch (err) {
        console.error('Error deleteReadNotifications:', err);
        res.status(500).send({ message: err.message });
    }
};

// 6. Restore a Notification from Trash (per user)
exports.restoreNotification = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) return res.status(400).send({ message: 'Notification ID is required' });
        const username = getUsername(req);
        const pool = await poolPromise;
        await pool.request()
            .input('Action', sql.NVarChar(50), 'RESTORE')
            .input('Username', sql.NVarChar(100), username)
            .input('Notification_ID', sql.Int, id)
            .execute('trans.Stored_Update_Notification_Status');
        res.status(200).send({ message: 'Notification restored', id });
    } catch (err) {
        console.error('Error restoreNotification:', err);
        res.status(500).send({ message: err.message });
    }
};

// โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•
// Auto-Purge Scheduler: runs every hour,
// permanently deletes trash older than 3 days
// โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•
(async () => {
    const runPurge = async () => {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('Action', sql.NVarChar(50), 'PURGE_OLD')
                .input('Notification_ID', sql.Int, null)
                .execute('trans.Stored_Update_Notification_Status');
            const purgedCount = result.recordset[0]?.PurgedCount || 0;
            if (purgedCount > 0) {
                console.log(`[Notification Auto-Purge] Permanently deleted ${purgedCount} old trash items.`);
            }
        } catch (err) {
            console.error('[Notification Auto-Purge] Error:', err);
        }
    };
    // Run once on startup (after 5s), then every hour
    setTimeout(runPurge, 5000);
    setInterval(runPurge, 60 * 60 * 1000);
})();

// โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•
// Shared Helper: Insert notification and emit socket
// โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•
exports.emitNotification = async (req, pool, {
    eventType,
    subject,
    messageEN,
    messageTH,
    docNo,
    actionBy,
    targetRoles,
    ctaRoute,
    detailsJson,
    division
}) => {
    try {
        const io = req.app.get('socketio');

        // Automatically merge division into detailsJson if provided
        let finalDetailsJson = detailsJson || {};
        if (division) {
            finalDetailsJson = {
                ...finalDetailsJson,
                Division: division
            };
        }

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
            .input('Details_JSON', sql.NVarChar, Object.keys(finalDetailsJson).length > 0 ? JSON.stringify(finalDetailsJson) : null)
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
                detailsJson: Object.keys(finalDetailsJson).length > 0 ? finalDetailsJson : null,
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
