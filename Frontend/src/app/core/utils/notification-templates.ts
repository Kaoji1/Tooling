/**
 * Notification Templates - Central map for all 8 notification event types.
 * Used by both the backend (to build payloads) and
 * the frontend detail-view (to render subject/body/CTA).
 */

export interface NotificationTemplate {
    eventType: string;
    subject: string;
    messageEN: (vars: Record<string, string>) => string;
    messageTH: (vars: Record<string, string>) => string;
    ctaLabel: string;
    ctaRoute: string;
    targetRoles: string;       // comma-separated roles or 'ALL'
    iconClass: string;         // Bootstrap Icon class
    badgeColor: string;        // CSS color token for the badge
}

/** Helper: interpolate `[Key]` placeholders with values from `vars` */
function interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\[(\w+)\]/g, (_, key) => vars[key] ?? `[${key}]`);
}

export const NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {

    // ─── Case 1: New Request (Sent) ────────────────────────────────
    REQUEST_SENT: {
        eventType: 'REQUEST_SENT',
        subject: '🔴 [Action Required] New Tooling Request: [Plan_No]',
        messageEN: (v) => interpolate(
            'A new tooling request has been submitted by [User_Name] (Production). Total items: [Item_Count]. Please review and proceed with the confirmation.',
            v
        ),
        messageTH: (v) => interpolate(
            'มีคำขอเบิก Tooling ใหม่ส่งมาจาก [User_Name] (แผนก Production) จำนวน [Item_Count] รายการ รบกวนตรวจสอบและดำเนินการยืนยันคำขอ',
            v
        ),
        ctaLabel: 'View Request',
        ctaRoute: '/purchase/request-list',
        targetRoles: 'purchase,ph',
        iconClass: 'bi-send-fill',
        badgeColor: '#ef4444'
    },

    // ─── Case 2: New Request (Completed) ──────────────────────────
    REQUEST_COMPLETED: {
        eventType: 'REQUEST_COMPLETED',
        subject: '🟢 [Completed] Tooling Request Confirmed: [Plan_No]',
        messageEN: (v) => interpolate(
            'Your tooling request [Plan_No] has been successfully confirmed and completed by the Purchase department.',
            v
        ),
        messageTH: (v) => interpolate(
            'คำขอเบิก Tooling เลขที่ [Plan_No] ของคุณ ได้รับการยืนยันและดำเนินการเสร็จสิ้นโดยแผนก Purchase แล้ว',
            v
        ),
        ctaLabel: 'View History',
        ctaRoute: '/production/request-history',
        targetRoles: 'production',
        iconClass: 'bi-check-circle-fill',
        badgeColor: '#22c55e'
    },

    // ─── Case 3: New PC Plan ──────────────────────────────────────
    NEW_PLAN: {
        eventType: 'NEW_PLAN',
        subject: '🔵 [FYI] New Initial Plan Imported: [Plan_No]',
        messageEN: (v) => interpolate(
            'A new PC Plan [Plan_No] has been imported into the system by the PC department. Total items: [Item_Count].',
            v
        ),
        messageTH: (v) => interpolate(
            'แผนงานใหม่ เลขที่ [Plan_No] จำนวน [Item_Count] รายการ ได้ถูกนำเข้าสู่ระบบโดยแผนก PC',
            v
        ),
        ctaLabel: 'Go to Plan List',
        ctaRoute: '/pc/plan-list',
        targetRoles: 'ALL',
        iconClass: 'bi-file-earmark-plus-fill',
        badgeColor: '#3b82f6'
    },

    PLAN_REVISION: {
        eventType: 'PLAN_REVISION',
        subject: '🔵 [FYI] [Edited_Fields] - Part No. [Part_No]',
        messageEN: (v) => interpolate(
            'The plan for date [Plan_Date], Part No. [Part_No] has been revised',
            v
        ),
        messageTH: (v) => interpolate(
            'แผนงานของวันที่ [Plan_Date] Part No. [Part_No] ได้รับการแก้ไข',
            v
        ),
        ctaLabel: 'View Plan List',
        ctaRoute: '/pc/plan-list',
        targetRoles: 'ALL',
        iconClass: 'bi-pencil-square',
        badgeColor: '#3b82f6'
    },

    // ─── Case 5: Cancel Plan ──────────────────────────────────────
    CANCEL_PLAN: {
        eventType: 'CANCEL_PLAN',
        subject: '⚫ [Cancelled] Plan Deleted/Cancelled: [Plan_No]',
        messageEN: (v) => interpolate(
            'The plan [Plan_No] has been cancelled or deleted from the system by [User_Name].',
            v
        ),
        messageTH: (v) => interpolate(
            'แผนงานเลขที่ [Plan_No] ได้ถูกยกเลิกหรือลบออกจากระบบโดย [User_Name]',
            v
        ),
        ctaLabel: 'Go to Plan List',
        ctaRoute: '/pc/plan-list',
        targetRoles: 'ALL',
        iconClass: 'bi-x-circle-fill',
        badgeColor: '#1e293b'
    },

    // ─── Case 5: Document Attachment ──────────────────────────────
    UPDATE_PLAN: {
        eventType: 'UPDATE_PLAN',
        subject: '🔵 [FYI] Document Attached for Plan: [Plan_No]',
        messageEN: (v) => interpolate(
            'New documents (Drawing/Layout/IIQC) have been attached to plan [Plan_No] by [User_Name].',
            v
        ),
        messageTH: (v) => interpolate(
            'มีการแนบไฟล์เอกสารใหม่ (Drawing/Layout/IIQC) สำหรับแผนงาน [Plan_No] โดย [User_Name]',
            v
        ),
        ctaLabel: 'Go to Plan List',
        ctaRoute: '/pc/plan-list',
        targetRoles: 'ALL',
        iconClass: 'bi-paperclip',
        badgeColor: '#3b82f6'
    },

    // ─── Case 6: Return Tooling (Sent) ────────────────────────────
    RETURN_SENT: {
        eventType: 'RETURN_SENT',
        subject: '🔴 [Action Required] Tooling Return Pending: [Plan_No]',
        messageEN: (v) => interpolate(
            'A tooling return request has been submitted by [User_Name] Production. Please verify the returned items and complete the process.',
            v
        ),
        messageTH: (v) => interpolate(
            'มีการกรอกรายการส่งคืน Tooling เข้ามาในระบบโดย [User_Name] จาก Production รบกวนตรวจสอบรายการและดำเนินการต่อด้วยครับ',
            v
        ),
        ctaLabel: 'View Return List',
        ctaRoute: '/purchase/return-history',
        targetRoles: 'purchase',
        iconClass: 'bi-arrow-return-left',
        badgeColor: '#ef4444'
    },

    // ─── Case 7: Return Tooling (Completed) ───────────────────────
    RETURN_COMPLETED: {
        eventType: 'RETURN_COMPLETED',
        subject: '🟢 [Completed] Tooling Return Confirmed: [Plan_No]',
        messageEN: (v) => interpolate(
            'The tooling return for [Plan_No] has been successfully verified and completed by the Purchase department.',
            v
        ),
        messageTH: (v) => interpolate(
            'การส่งคืน Tooling เลขที่ [Plan_No] ของคุณ ได้รับการตรวจสอบและยืนยันการรับคืนโดยแผนก Purchase เรียบร้อยแล้ว',
            v
        ),
        ctaLabel: 'View Return History',
        ctaRoute: '/production/return-history',
        targetRoles: 'production',
        iconClass: 'bi-check-circle-fill',
        badgeColor: '#22c55e'
    },

    // ─── Case 8: General File Upload ──────────────────────────────
    FILE_UPLOAD: {
        eventType: 'FILE_UPLOAD',
        subject: '🔵 [Announcement] New System File Uploaded',
        messageEN: (v) => interpolate(
            'A new system file has been uploaded by [User_Name]. Please check the attachment if it relates to your tasks.',
            v
        ),
        messageTH: (v) => interpolate(
            'มีการอัปโหลดไฟล์ใหม่เข้าสู่ระบบโดย [User_Name] กรุณาตรวจสอบเอกสารแนบหากเกี่ยวข้องกับการปฏิบัติงานของคุณ',
            v
        ),
        ctaLabel: 'View Files',
        ctaRoute: '/',
        targetRoles: 'ALL',
        iconClass: 'bi-cloud-arrow-up-fill',
        badgeColor: '#3b82f6'
    }
};

/**
 * Resolve a template subject with variables.
 * Example: getSubject('REQUEST_SENT', { Plan_No: 'DOC001' })
 */
export function getSubject(eventType: string, vars: Record<string, string>): string {
    const tmpl = NOTIFICATION_TEMPLATES[eventType];
    if (!tmpl) return eventType;
    return interpolate(tmpl.subject, vars);
}

/**
 * Get a template by event type.
 */
export function getTemplate(eventType: string): NotificationTemplate | undefined {
    return NOTIFICATION_TEMPLATES[eventType];
}

// ═══════════════════════════════════════════════════
// Field Labels for Dynamic Detail Rendering (EN/TH)
// ═══════════════════════════════════════════════════

export const FIELD_LABELS: Record<string, { EN: string; TH: string }> = {
    PlanDate: { EN: 'Plan Date', TH: 'Plan Date' },
    MC_Type: { EN: 'MC Type', TH: 'MC Type' },
    Bar_Type: { EN: 'Bar Type', TH: 'Bar Type' },
    Facility: { EN: 'Fac', TH: 'Fac' },
    Before_Part: { EN: 'Part Before', TH: 'Part Before' },
    Process: { EN: 'Process', TH: 'Process' },
    MC: { EN: 'MC', TH: 'MC' },
    MCNo: { EN: 'MC No.', TH: 'MC No.' },
    MC_No: { EN: 'Machine No.', TH: 'Machine No.' },
    DueDate: { EN: 'Due Date', TH: 'Due Date' },
    PartNo: { EN: 'Part No.', TH: 'Part No.' },
    QTY: { EN: 'QTY', TH: 'QTY' },
    Time: { EN: 'Time', TH: 'Time' },
    Comment: { EN: 'Comment', TH: 'Comment' },
    Division: { EN: 'Division', TH: 'Division' },
    Employee_ID: { EN: 'Employee ID', TH: 'Employee ID' },
    PlanStatus: { EN: 'Status', TH: 'Status' },
    GroupId: { EN: 'Group ID', TH: 'Group ID' },
    Revision: { EN: 'Revision', TH: 'Revision' },
    Path_Dwg: { EN: 'Drawing', TH: 'Drawing' },
    Path_Layout: { EN: 'Layout', TH: 'Layout' },
    Path_IIQC: { EN: 'IIQC', TH: 'IIQC' },
    Doc_No: { EN: 'Document No.', TH: 'Document No.' },
    ItemNo: { EN: 'Item No.', TH: 'Item No.' },
    ItemName: { EN: 'Item Name', TH: 'Item Name' },
    Spec: { EN: 'Specification', TH: 'Specification' },
    Remark: { EN: 'Remark', TH: 'Remark' }
};

/**
 * Get a human-readable field label in the given language.
 * Falls back to the raw field name if no mapping exists.
 */
export function getFieldLabel(field: string, lang: 'EN' | 'TH' = 'EN'): string {
    return FIELD_LABELS[field]?.[lang] || field;
}
