const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Full_Dev_Manual.md');
let content = fs.readFileSync(filePath, 'utf8');

const newSection = `
### 7.11 🔗 สรุปการเชื่อมต่อ API กับหน้าจอ Frontend (API ↔ Frontend Map)

เพื่อความง่ายในการไล่โค้ดเมื่อพบปัญหา (Debug) ต่อไปนี้คือสรุปว่า **API แต่ละตัวถูกเรียกใช้จากหน้าจอ (Page) และ Component ไหนในฝั่ง Frontend:**

| โมดูล (Module) | API Endpoint | ใช้ทำอะไร | หน้าจอ Frontend ที่เรียกใช้ (Route Path) | Component / Service ฝั่ง Frontend |
|---------------|--------------|-----------|-------------------------------------|-----------------------------------|
| **Login** | \`/api/login\` | เข้าสู่ระบบ | \`/login\` | \`LoginComponent\` (\`auth.service.ts\`) |
| **Cart** | \`/api/get_cart\` | ดึงรายการในตะกร้าของส่วนรวม | \`/production/cart\` | \`CartComponent\` (\`cart.service.ts\`) |
| **Cart** | \`/api/AddCartItems\` | เพิ่ม Tooling ลงตะกร้า | \`/production/request\` | \`requestComponent\` |
| **Cart** | \`/api/delete_cart_items/...\` | ลบสินค้าออกจากตะกร้า | \`/production/cart\` | \`CartComponent\` |
| **Request** | \`/api/Send_Request\` | กดปุ่มส่งเบิก (ยืนยัน) | \`/production/cart\` | \`CartComponent\` (\`SendRequest.service.ts\`) |
| **Request (Dropdown)** | \`/api/get_Division\`, \`get_Facility\`, ฯลฯ | ค้นหา Item / เลือกแผนก | \`/production/request\` | \`requestComponent\` (\`request.service.ts\`) |
| **Purchase Detail** | \`/api/Detail_Purchase\` | ดึงรายการค้างเบิก (CuttingTool) | \`/purchase/detail\` | \`DetailComponent\` (\`DetailPurchaseRequestlist.service.ts\`) |
| **Purchase Detail** | \`/api/Detail_CaseSetup\` | ดึงรายการค้างเบิก (SetupTool) | \`/purchase/detailcasesetup\` | \`DetailCaseSetupComponent\` |
| **Purchase Detail** | \`/api/Update_Status_Purchase\` | อัปเดตสถานะ (Waiting ➔ Complete) | \`/purchase/detail\` และ \`/purchase/detailcasesetup\` | \`DetailComponent\`, \`DetailCaseSetupComponent\` |
| **Purchase Detail** | \`/api/Insert_Request\`, \`Insert_Request_Bulk\` | ฝั่งจัดซื้อคีย์สั่งเบิกเอง (เดี่ยว/Bulk) | \`/purchase/detail\` | \`DetailComponent\` |
| **PC Plan** | \`/api/pc-plan/list\`, \`/api/pc-plan/insert\`, ฯลฯ | จัดการแผน PC Plan | \`/production/PCPlan\`, \`/purchase/PlanList\` | \`PCPlanComponent\`, \`PlanListComponent\` (\`PCPlan.service.ts\`) |
| **Master PH** | \`/api/master-ph/...\` | อัปโหลด Import Excel ข้อมูล Master | \`/purchase/master-ph\` | \`MasterPHComponent\` (\`MasterPH.service.ts\`) |
| **Return** | \`/api/return/save\` | บันทึกข้อมูลการคืน Tooling | \`/production/return\` | \`ReturnComponent\` (\`return.service.ts\`) |
| **Return** | \`/api/return/list\`, \`update-status\` | ดูรายการคืน / อนุมัติการคืน | \`/purchase/returnlist\` | \`ReturnlistComponent\` |
| **Notification** | \`/api/notifications/...\` | เรียกดึงแจ้งเตือน, ลบแบบ Trash, อ่าน | *(ตัวแจ้งเตือนรูปกระดิ่งบน Navbar ของทุกหน้า)* | \`HeaderComponent\` (\`notification.service.ts\`) |
| **Employee** | \`/api/get_Employee\`, \`AddEmployee\` | จัการผู้ใช้งานและสิทธิ์รหัส | \`/purchase/add-user\` | \`AddUserComponent\` (\`Employee.service.ts\`) |
| **Analyze** | \`/api/getcostanalyze\`, \`getdataall\`, \`getdatasmartrack\` | ดึงข้อมูลวิเคราะห์กราฟยอดใช้จ่าย | \`/purchase/analyze\`, \`/purchase/analyzeSmartRack\` | \`AnalyzeComponent\`, \`AnalyzeSmartRackComponent\` (\`analyze.service.ts\`) |
| **History** | \`/api/Purchase_History\`, \`/api/User_History\` | เรียกดูประวัติการเบิกที่เสร็จสิ้นแล้ว | \`/purchase/history-request\`, \`/production/request-history\` | \`HistoryRequestComponent\`, \`RequestHistoryComponent\` |
| **History Print** | \`/api/HistoryPrint\`, \`/api/SaveHistoryPrint\` | เก็บ Log และสิทธิ์อนุญาตประวัติสั่งปริ้นต์ | \`/production/historyprint\`, \`/purchase/historyprint\` | \`HistoryPrintComponent\` (\`HistoryPrint.service.ts\`) |

`;

// Find the position of "## 🔔 8. ระบบ Notification (Socket.IO + Email)"
const targetText = "## 🔔 8. ระบบ Notification (Socket.IO + Email)";
if (content.indexOf(targetText) !== -1) {
    // Insert right before it
    content = content.replace(targetText, newSection + targetText);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Section 7.11 inserted successfully.");
} else {
    console.log("Could not find the target text marker.");
}
