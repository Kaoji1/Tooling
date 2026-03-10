# 📖 Backend Developer Manual — Indirect-Expense

> **Last updated:** 10 Mar 2026  
> เอกสารฉบับนี้จัดทำเพื่อช่วยให้ Developer หน้าใหม่ทำความเข้าใจ Backend ของระบบ **Indirect-Expense** (ระบบจัดการเบิก Tooling) อย่างละเอียด

---

## สารบัญ (Table of Contents)

1. [Tech Stack](#-1-tech-stack)
2. [โครงสร้างโปรเจกต์](#-2-โครงสร้างโปรเจกต์-project-structure)
3. [Environment Variables (.env)](#-3-environment-variables-env)
4. [การติดตั้งและรัน](#-4-การติดตั้งและรัน-setup--run)
5. [Database — การเชื่อมต่อและรูปแบบการใช้งาน](#-5-database--การเชื่อมต่อและรูปแบบการใช้งาน)
6. [Architecture — Route → Controller Pattern](#-6-architecture--route--controller-pattern)
7. [API Reference ทุก Module](#-7-api-reference-ทุก-module)
8. [ระบบ Notification (Socket.IO + Email)](#-8-ระบบ-notification-socketio--email)
9. [File Upload (Multer & express-fileupload)](#-9-file-upload-multer--express-fileupload)
10. [SQL Scripts & Stored Procedures](#-10-sql-scripts--stored-procedures)
11. [แนวทางการพัฒนา — Step-by-Step](#-11-แนวทางการพัฒนา--step-by-step)
12. [Error Handling Pattern](#-12-error-handling-pattern)
13. [ข้อควรระวังและ Tips สำคัญ](#-13-ข้อควรระวังและ-tips-สำคัญ)

---

## 🛠️ 1. Tech Stack

| หมวด | เทคโนโลยี | เวอร์ชัน | หน้าที่ |
|------|-----------|---------|--------|
| Runtime | **Node.js** | – | JavaScript Runtime |
| Framework | **Express.js** | v5.x | Web Framework หลัก |
| Database Driver | **mssql** | v11.x | เชื่อมต่อ SQL Server โดยตรง |
| ORM (สำรอง) | **sequelize** | v6.x | ติดตั้งไว้แต่ใช้ `mssql` เป็นหลัก |
| Real-time | **Socket.IO** | v4.x | Notification แบบเรียลไทม์ |
| Auth | **jsonwebtoken** + **bcryptjs** | – | JWT Token & Password Hash |
| Email | **nodemailer** | v7.x | ส่งอีเมลแจ้งเตือนผ่าน Gmail |
| File Upload | **express-fileupload** + **multer** | – | อัปโหลดไฟล์ทั่วไป / Excel |
| Excel | **xlsx** | v0.18 | อ่าน-เขียนไฟล์ Excel |
| Dev Tools | **nodemon**, **typescript**, **jest** | – | Auto-reload, Type Checking, Testing |

---

## 📂 2. โครงสร้างโปรเจกต์ (Project Structure)

```text
backend/
├── .env                        # ⬅ Environment Variables (ห้าม commit ขึ้น Git)
├── .gitignore
├── server.js                   # ⬅ Entry Point หลัก (Express + Socket.IO + Route Registration)
├── package.json                # ⬅ Dependencies & Scripts
│
├── src/
│   ├── config/
│   │   ├── database.js         # ⬅ MSSQL Connection Pool (ไฟล์สำคัญมาก)
│   │   └── multer.config.js    # ⬅ Config สำหรับ upload Excel/CSV
│   │
│   ├── controllers/            # ⬅ Business Logic ทั้งหมด (19 ไฟล์)
│   │   ├── Login.controller.js
│   │   ├── Cart.controller.js
│   │   ├── SendRequest.controller.js
│   │   ├── DetailPurchaseRequestlist.controller.js
│   │   ├── PCPlan.controller.js
│   │   ├── MasterPH.controller.js
│   │   ├── Notification.controller.js
│   │   ├── Return.controller.js
│   │   ├── Itemlist.controller.js
│   │   ├── ItemDetail.controller.js
│   │   ├── analyze.controller.js
│   │   ├── analyzeSmartRack.controller.js
│   │   ├── Employee.controller.js
│   │   ├── PurchaseRequest.controller.js
│   │   ├── PurchaseHistory.controller.js
│   │   ├── Userhistory.controller.js
│   │   ├── HistoryPrint.controller.js
│   │   ├── FileUpload.controller.js
│   │   └── FileRead.controller.js
│   │
│   └── routes/                 # ⬅ API Route Definitions (17 ไฟล์)
│       ├── Login.route.js
│       ├── Cart.route.js
│       ├── Request.route.js
│       ├── SendRequest.route.js
│       ├── DetailPurchaseRequestlist.route.js
│       ├── PCPlan.route.js
│       ├── MasterPH.route.js
│       ├── Return.route.js
│       ├── PurchaseRequest.route.js
│       ├── PurchaseHistory.route.js
│       ├── UserHistory.route.js
│       ├── Employee.route.js
│       ├── HistoryPrint.route.js
│       ├── FileUpload.route.js
│       ├── FileRead.route.js
│       ├── analyze.route.js
│       └── analyzeSmartRack.route.js
│
└── sql/                        # ⬅ SQL Scripts ทั้งหมด (59 ไฟล์)
    ├── Stored_*.sql            #   Stored Procedures
    ├── Create_*.sql            #   สร้าง Table/Function
    ├── Update_*.sql            #   แก้ไข View/Stored Proc
    └── View_*.sql              #   สร้าง/แก้ไข Views
```

---

## 🔐 3. Environment Variables (.env)

ไฟล์ `.env` อยู่ที่ root ของ backend ใช้เก็บค่า Config ที่เป็นความลับ

| ตัวแปร | คำอธิบาย | ตัวอย่าง |
|--------|---------|---------|
| `PORT` | Port ที่ Server รัน | `3000` |
| `DB_USER` | Username เชื่อมต่อ SQL Server | `Cost_Team` |
| `DB_PASSWORD` | Password เชื่อมต่อ SQL Server | `Cost@User1` |
| `DB_SERVER` | ชื่อ/IP ของ SQL Server | `pbp155` |
| `DB_NAME` | ชื่อ Database | `db_Tooling` |
| `EMAIL_USER` | Gmail สำหรับส่งอีเมลแจ้งเตือน | `testsystem1508@gmail.com` |
| `EMAIL_PASS` | App Password ของ Gmail | *(App Password 16 ตัว)* |
| `FRONTEND_URL` | URL ของ Frontend (ใช้ใส่ลิงก์ในอีเมล) | `http://localhost:4200` |

> ⚠️ **สำคัญ:** `.env` อยู่ใน `.gitignore` แล้ว ห้าม commit ขึ้น Git เด็ดขาด!

---

## 🚀 4. การติดตั้งและรัน (Setup & Run)

### 4.1 ติดตั้ง Dependencies
```bash
cd backend
npm install
```

### 4.2 ตั้งค่า `.env`
สร้างไฟล์ `.env` ที่โฟลเดอร์ `backend/` ตามรูปแบบด้านบน

### 4.3 รันเซิร์ฟเวอร์

| คำสั่ง | ใช้เมื่อ |
|--------|---------|
| `npm run dev` | **Development** — ใช้ `nodemon` มี auto-reload เมื่อแก้โค้ด |
| `npm start` | **Production** — ใช้ `node server.js` ตรงๆ |

### 4.4 ตรวจสอบว่ารันสำเร็จ
เมื่อรันสำเร็จจะเห็นข้อความ:
```
Connected to MSSQL
Server is running on http://localhost:3000
```
ทดสอบโดยเปิดเบราว์เซอร์ไปที่ `http://localhost:3000` จะเห็นข้อความ `"This is backend!"`

---

## 🗄️ 5. Database — การเชื่อมต่อและรูปแบบการใช้งาน

### 5.1 ไฟล์ `src/config/database.js`

ไฟล์นี้สร้าง **Connection Pool** สำหรับเชื่อมต่อ SQL Server (`db_Tooling`)

```javascript
const { poolPromise } = require("../config/database");
const sql = require('mssql');
```

- ใช้ `poolPromise` เพื่อรับ Connection Pool (เป็น Promise)
- ใช้ `sql.TYPES` (เช่น `sql.NVarChar`, `sql.Int`, `sql.Date`) สำหรับกำหนด Type ของ Parameter
- **Request Timeout:** ตั้งไว้ที่ 300,000ms (5 นาที) เพื่อรองรับการ Import ข้อมูลขนาดใหญ่

### 5.2 รูปแบบ A — เรียก Stored Procedure (แนะนำ ✅)

```javascript
exports.myFunction = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Param1', sql.NVarChar(50), req.body.param1)
      .input('Param2', sql.Int, req.body.param2)
      .execute('[dbo].[Stored_Procedure_Name]');   // ← .execute()
    
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
};
```

### 5.3 รูปแบบ B — Inline SQL Query

```javascript
exports.myFunction = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('ID', sql.Int, req.params.id)
      .query('SELECT * FROM myTable WHERE ID = @ID');  // ← .query()
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
};
```

> 💡 **แนวทาง:** โปรเจกต์กำลัง migrate จาก Inline SQL → Stored Procedure เพื่อความเป็นระเบียบ ควรใช้ `.execute()` สำหรับฟังก์ชันใหม่

### 5.4 การใช้ `.input()` กำหนด Parameter

**ต้องระบุ Type ทุกครั้ง** เพื่อป้องกัน SQL Injection:

| SQL Type | ใช้เมื่อ | ตัวอย่าง |
|----------|---------|---------|
| `sql.NVarChar(50)` | String ภาษาไทย/อังกฤษ | ชื่อ, Division, ItemNo |
| `sql.Int` | ตัวเลขจำนวนเต็ม | QTY, ID, Factory |
| `sql.Date` | วันที่ | Due_Date |
| `sql.DateTime` | วันที่+เวลา | Timestamp |
| `sql.Bit` | true/false | Is_Active |
| `sql.NVarChar` | String ไม่จำกัดความยาว | JSON, ข้อความยาว |

---

## 🏗️ 6. Architecture — Route → Controller Pattern

ระบบใช้สถาปัตยกรรม **Route → Controller** (ไม่มี Service Layer แยก):

```
Client (Angular Frontend)
      │  HTTP Request (GET/POST/PUT/DELETE)
      ▼
  server.js              ← (1) Express รับ Request, ผ่าน CORS + bodyParser middleware
      │  app.use('/api', SomeRoute)
      ▼
  src/routes/*.route.js  ← (2) Route กำหนด HTTP Method + Path → Map เข้ากับ Controller Function
      │  router.post('/Send_Request', Controller.Send_Request)
      ▼
  src/controllers/*.js   ← (3) Controller ทำ Business Logic:
      │                       - Validate Input
      │                       - Query/Execute SQL (ผ่าน poolPromise)
      │                       - ส่ง Email (nodemailer)
      │                       - Emit Notification (Socket.IO)
      │                       - ส่ง Response กลับ Client
      ▼
  src/config/database.js ← (4) Connection Pool → SQL Server (db_Tooling)
```

### 6.1 Request Lifecycle (วงจรชีวิตของ Request)

เมื่อ Frontend ส่ง HTTP Request เข้ามา สิ่งที่เกิดขึ้นตามลำดับ:

1. **Middleware Layer** (`server.js`)
   - `express-fileupload()` → ตรวจจับไฟล์ที่ upload
   - `cors()` → ตรวจ Origin, Headers
   - `bodyParser.json({ limit: '50mb' })` → Parse JSON body
   - `bodyParser.urlencoded()` → Parse form data

2. **Route Matching** → Express จะ match path ตาม prefix ที่ลงทะเบียนใน `server.js`

3. **Controller Execution** → Route เรียก function ใน Controller ซึ่งจะ:
   - ดึง param จาก `req.body`, `req.params`, `req.query`
   - เรียก `poolPromise` เพื่อรับ Connection Pool
   - ใช้ `.execute()` (Stored Proc) หรือ `.query()` (Inline SQL)
   - ส่ง `res.json()` หรือ `res.status().json()` กลับ

4. **Side Effects (ถ้ามี)** → บาง Controller จะ:
   - ส่งอีเมลแจ้งเตือน (ส่งแบบ Background ไม่ block response)
   - Emit Socket.IO event เพื่อแจ้ง Client แบบ Real-time
   - Insert Notification log ลง Database

### 6.2 การลงทะเบียน Route ใน `server.js`

มี 3 แบบ:

**แบบ 1 — Mount Route File ด้วย prefix `/api` (ส่วนใหญ่ใช้แบบนี้):**
```javascript
const Cart = require('./src/routes/Cart.route.js');
app.use('/api', Cart);  
// endpoint จาก Cart.route.js เช่น router.post('/AddCartItems', ...)
// จะกลายเป็น POST /api/AddCartItems
```

**แบบ 2 — Mount ด้วย sub-prefix (เฉพาะ PCPlan):**
```javascript
const pcPlanRoutes = require('./src/routes/PCPlan.route');
app.use('/api/pc-plan', pcPlanRoutes);
// endpoint เช่น router.get('/divisions', ...)
// จะกลายเป็น GET /api/pc-plan/divisions
```

**แบบ 3 — Inline Route ตรงๆ (เฉพาะ Notification):**
```javascript
const NotificationController = require('./src/controllers/Notification.controller.js');
app.get('/api/notifications/list', NotificationController.getNotifications);
// ไม่ผ่าน Route file แยก
```

### 6.3 ประเภทเครื่องมือและ Table หลักในระบบ

ระบบแบ่งเครื่องมือเป็น **2 ประเภท** ซึ่งเก็บอยู่คนละ Table:

| ประเภท | Table หลัก | ID Column | Public_Id Prefix |
|--------|-----------|-----------|------------------|
| **Cutting Tool** (เครื่องมือตัด) | `tb_IssueCuttingTool_Request_Document` | `ID_Request` | `C` |
| **Setup Tool** (เครื่องมือติดตั้ง) | `tb_IssueSetupTool_Request_Document` | `ID_RequestSetupTool` | `S` |

> 💡 **Public_Id:** ระบบใช้ `Public_Id` ที่ขึ้นต้นด้วย `C` (Cutting) หรือ `S` (Setup) เพื่อระบุว่า record มาจาก Table ไหน ทำให้สามารถ Update/Delete ข้าม Table ได้โดยไม่ต้องระบุ TableType

### 6.4 Role ในระบบ

ผู้ใช้มีหลาย Role ซึ่งมีผลต่อการรับ Notification และ Email:

| Role | หน้าที่ | รับ Email เมื่อ |
|------|---------|---------------|
| `production` | พนักงานผลิต (เบิกของ) | Case SET ถูกเพิ่มลงตะกร้า, สถานะ Complete |
| `purchase` | จัดซื้อ (ดำเนินการเบิก) | มี Request ใหม่, มีการคืน Tooling |
| `engineer` | วิศวกร | Case BUR/BRO ถูกเพิ่มลงตะกร้า |
| `admin` | ผู้ดูแลระบบ | รับทุก Email |

---

## 📋 7. API Reference ทุก Module

### 7.1 🔑 Login (การเข้าสู่ระบบ)
| Method | Endpoint | Controller | คำอธิบาย |
|--------|----------|-----------|--------|
| POST | `/api/login` | `Login.Login` | เข้าสู่ระบบ → ส่ง User + Base64 Token กลับ |

**Data Flow:**
1. Frontend ส่ง `Username` + `Password` มา
2. Controller เรียก SP `[dbo].[stored_Find_CuttingTool_Employee]` ส่ง Username, Password ไปเช็คในฐานข้อมูล
3. ถ้าพบ → สร้าง Token แบบ Base64 จาก `Username-Role-Timestamp` แล้วส่งกลับ
4. ถ้าไม่พบ → ส่ง 401 Unauthorized

**Table ที่เกี่ยวข้อง:** `tb_CuttingTool_Employee`

**Request Body:**
```json
{ "Username": "john", "Password": "1234" }
```
**Response (สำเร็จ):**
```json
{
  "message": "Sign in sucessfull",
  "user": { "Username": "john", "Role": "production", "Employee_ID": "12345", ... },
  "token": "am9obi1wcm9kdWN0aW9uLTE3MDk..."
}
```
> ⚠️ Token เป็น **Base64 ธรรมดา** ไม่ใช่ JWT ที่มีการ Sign/Verify ดังนั้นไม่มี middleware ตรวจสอบ Token ที่ Backend

---

### 7.2 🛒 Cart (ตะกร้าสินค้า)
| Method | Endpoint | Controller | คำอธิบาย |
|--------|----------|-----------|--------|
| POST | `/api/AddCartItems` | `Cart.AddCartItems` | เพิ่มรายการลงตะกร้า + ส่ง Email แจ้งเตือน |
| GET | `/api/get_cart` | `Cart.GetCartItems` | ดึงรายการทั้งหมดในตะกร้า |
| DELETE | `/api/delete_cart_item/:id` | `Cart.DeleteItem` | ลบรายการตาม ID_Cart |
| DELETE | `/api/clear_cart` | `Cart.ClearAllItems` | ล้างตะกร้าทั้งหมด |
| DELETE | `/api/delete_cart_items/:case_/:process/:fac` | `Cart.DeleteCartItemsByCaseProcessFac` | ลบตาม Case/Process/Factory (ใช้เมื่อกด Send แล้วลบออกจากตะกร้า) |
| POST | `/api/update_cart_items` | `Cart.UpdateMultipleCartItems` | อัปเดต QTY, PathDwg, PathLayout, Due_Date หลายรายการพร้อมกัน |

**Table:** `tb_IssueCuttingTool_SendToCart`

**Business Flow ของ AddCartItems:**
1. รับ Array ของ items จาก Frontend
2. วน Loop INSERT แต่ละ item ลง `tb_IssueCuttingTool_SendToCart`
3. แยกรายการตาม Case แล้วส่ง Email:
   - **Case = SET** → ส่งอีเมลให้ Role `production` + `admin`
   - **Case = BUR/BRO** → ส่งอีเมลให้ Role `engineer`
4. Email จะส่งแบบ **Background** (ไม่รอผลลัพธ์) ตอบ Client ทันที

> 💡 ตะกร้าเป็น **ตะกร้ารวม** ของทุก User (ไม่ได้แยกตาม User) เมื่อกด Send Request แล้ว จะลบรายการที่ตรง Case/Process/Fac ออกจากตะกร้า

---

### 7.3 📤 Send Request (ส่งเบิก)
| Method | Endpoint | Controller | คำอธิบาย |
|--------|----------|-----------|--------|
| POST | `/api/Send_Request` | `SendRequest.Send_Request` | บันทึกรายการเบิก + ส่ง Email + Socket Notification |
| POST | `/api/GenerateNewDocNo` | `SendRequest.GenerateNewDocNo` | สร้างเลขที่เอกสารอัตโนมัติ |

**Business Flow ของ Send_Request:**
1. รับ Array items จาก Frontend (จากตะกร้าที่กรอกเสร็จ)
2. วน Loop เรียก SP `[dbo].[stored_IssueCuttingTool_SendRequest]` ทีละ item
   - SP จะสร้าง DocNo ผ่าน SQL Function `[trans].[fn_Generate_Request_DocNo]`
   - INSERT ลงตาราง `tb_IssueCuttingTool_Request_Document`
3. ดึงอีเมล Role `purchase` + `admin` จาก `tb_CuttingTool_Employee` แล้วส่ง Email แจ้งเตือน
4. เรียก `emitNotification()` เพื่อ Insert Notification log + Emit Socket.IO ไปยัง purchase
5. ตอบ 200 กลับ Client

**การสร้าง DocNo (ผ่าน SQL Function):**
ระบบจริงใช้ **SQL Function** `[trans].[fn_Generate_Request_DocNo]` ถูกเรียกผ่าน SP:

| Division | สูตร | ตัวอย่าง |
|----------|------|--------|
| PMC / 71DZ | `{Case}{Process}{Fac}{yyMMdd}` | `SETTN2260217` |
| GM (และอื่นๆ) | `{Process}{Fac}{Case}{yyMMdd}` | `TN2SET260217` |

> ⚠️ ใน `SendRequest.controller.js` มีฟังก์ชัน `GenerateNewDocNo` ที่สร้าง DocNo ด้วย JavaScript (รูปแบบต่างกัน) แต่ระบบจริงบนเว็บใช้ SQL Function ข้างต้นแทน

**Process Mapping:**
| Process | ย่อ |
|---------|-----|
| Turning | TN |
| Milling / Milling2 | ML |
| F&Boring / F&Boring1/2/3 / RL | RL |

---

### 7.4 📦 Request (ค้นหา Item / Cascading Dropdown / CaseSET)

**Controller หลัก:** `Itemlist.controller.js` (670 บรรทัด — ใหญ่ที่สุด)

**ระบบ Cascading Dropdown (เลือกอันแรก → filter ตัวถัดไป):**

เมื่อ User เลือก Dropdown ตัวแรก ตัวถัดไปจะ Filter ตามลำดับ:
```
Division → Facility → PartNo → Process → MC → ItemNo
```

**Cutting Tool Dropdowns:**
| ลำดับ | Endpoint | ส่งค่าอะไร | SP/Query |
|--------|----------|------------|---------|
| 1 | GET `/api/get_Division` | ไม่ต้องส่ง | `Stored_View_CuttingTool_FindItem` |
| 2 | POST `/api/get_Facility` | `{Division}` | `Stored_View_CuttingTool_FindItem_Test` |
| 3 | POST `/api/get_PartNo` | `{Division}` | `Stored_View_CuttingTool_FindItem` |
| 4 | POST `/api/get_Process` | `{Division, PartNo}` | `Stored_View_CuttingTool_FindItem` |
| 5 | POST `/api/get_MC` | `{Division, PartNo, Process}` | `Stored_View_CuttingTool_FindItem` |
| 6 | POST `/api/post_ItemNo` | `{Division, FacilityName, PartNo, Process, MC}` | `Stored_View_CuttingTool_FindItem_Test` |

**Setup Tool Dropdowns (ใช้ SP คนละตัว):**
| Endpoint | SP |
|----------|----|
| GET `/api/get_Setup_Division` | `trans.Stored_Get_Dropdown_Division` |
| POST `/api/get_Setup_Facility` | `trans.Stored_Get_Dropdown_Facility_By_Division` |
| POST `/api/get_Setup_PartNo` | `trans.Stored_Setup_Dropdown_PartNo_By_Division` |
| POST `/api/get_Setup_Process` | `trans.Stored_Setup_Dropdown_Process_By_Division_PartNo` |
| POST `/api/get_Setup_MC` | `trans.Stored_Setup_Dropdown_MC_By_Division_PartNo_Process` |
| POST `/api/get_Setup_Items` | `trans.Stored_Search_Setup_Item_Result` |

**Case SET (เบิกแบบ SET = รวม Cutting + Setup พร้อมกัน):**
| Endpoint | คำอธิบาย | SP |
|----------|---------|----|
| POST `/api/get_CaseSET_CuttingTool` | ดึง CuttingTool Aggregated | `trans.Stored_Get_CaseSET_CuttingTool` |
| POST `/api/get_CaseSET_SetupTool` | ดึง SetupTool | `trans.Stored_Get_CaseSET_SetupTool` |
| POST `/api/get_CaseSET_CuttingTool_Detail` | ดึงรายละเอียด Box/Shelf/Rack | `trans.Stored_Get_CaseSET_CuttingTool_Detail` |
| POST `/api/get_CaseSET_All` | รวม Cutting + Setup ในก้อนเดียว | `trans.Stored_Get_CaseSET_All` |
| POST `/api/get_CaseSET_Dropdown_PartNo` | Dropdown PartNo (CaseSET) | `trans.Stored_Get_CaseSET_Dropdown_PartNo` |
| POST `/api/get_CaseSET_Dropdown_Process` | Dropdown Process (CaseSET) | `trans.Stored_Get_CaseSET_Dropdown_Process` |
| POST `/api/get_CaseSET_Dropdown_MC` | Dropdown MC (CaseSET) | `trans.Stored_Get_CaseSET_Dropdown_MC` |
| POST `/api/get_CaseSET_Dropdown_ItemNo` | Dropdown ItemNo (CaseSET) | `trans.Stored_Get_CaseSET_Dropdown_ItemNo` |
| POST `/api/get_MC_ByDivision` | MC ทั้งหมดตาม Division (แสดงเฉยๆ) | `trans.Stored_Get_MC_ByDivision` |

---

### 7.5 📝 Detail Purchase Request (รายละเอียดใบเบิก — หน้าหลักของฝั่ง Purchase)

**Controller หลัก:** `DetailPurchaseRequestlist.controller.js` (525 บรรทัด — ไฟล์ใหญ่อันดับ 2)

| Method | Endpoint | คำอธิบาย | SP |
|--------|----------|---------|----|
| GET | `/api/Detail_Purchase` | ดึงรายการ CuttingTool ที่ค้างเบิก | `trans.Stored_Detail_Purchase` |
| GET | `/api/Detail_Purchase_Setup` | ดึงรายการ SetupTool ที่ค้างเบิก | `trans.Stored_Detail_Purchase_Setup` |
| GET | `/api/Detail_CaseSetup` | ดึงรายการ CaseSetup | `trans.Stored_Detail_CaseSetup` |
| POST | `/api/Update_Status_Purchase` | เปลี่ยนสถานะ (รองรับหลายแถวพร้อมกัน) | Inline SQL |
| PUT | `/api/Update_Request` | แก้ไขรายละเอียด (QTY, Remark, MatLot ฯลฯ) | Inline SQL |
| POST | `/api/Insert_Request` | เพิ่มรายการเดี่ยว | `trans.Stored_Add_New_Request` |
| POST | `/api/Insert_Request_Bulk` | เพิ่มรายการแบบ Bulk (ส่ง JSON Array) | `trans.Stored_Insert_Request_Bulk` |
| DELETE | `/api/Delete_Request/:id` | ลบรายการ | `trans.Stored_Delete_Request` |
| GET | `/api/get_ItemNo` | Autocomplete ค้นหา ItemNo | `trans.Stored_Get_ItemNo` |

**⭐ Status Workflow (สำคัญมาก!):**
```
Waiting → Complete → [AS400STATUS: Pending] → [AS400STATUS: Success]
```
- **Waiting** = รอ PH ดำเนินการ
- **Complete** = PH เตรียมของเสร็จ → ตั้ง `DateComplete = SYSDATETIME()` และ `AS400STATUS = 'Pending'`
- **AS400STATUS: Pending** = รอตัด Stock ใน AS400
- **AS400STATUS: Success** = ตัด Stock เรียบร้อยแล้ว

**Table ที่ใช้:**
- `tb_IssueCuttingTool_Request_Document` (Cutting Tool)
- `tb_IssueSetupTool_Request_Document` (Setup Tool)

**การทำงานของ Update_Status_Purchase:**
1. รับ `ID_Request` (หรือ Array), `Status`, `TableType`
2. เช็ค `Public_Id`:
   - ขึ้นต้นด้วย `C` → UPDATE ใน `tb_IssueCuttingTool_Request_Document`
   - ขึ้นต้นด้วย `S` → UPDATE ใน `tb_IssueSetupTool_Request_Document`
3. ถ้า Status = `Complete` → ส่ง Email แจ้ง Role `production` + `admin`

**การทำงานของ Insert_Request_Bulk:**
1. รับ Array items จาก Frontend
2. แปลงเป็น JSON แล้วส่งเข้า SP `trans.Stored_Insert_Request_Bulk`
3. SP จัดการ Parse JSON + Insert + สร้าง DocNo/MFGOrderNo ให้อัตโนมัติ
4. ส่ง Notification ไปยัง Role `purchase`

---

### 7.6 📊 PC Plan (แผนจัดซื้อ)
| Method | Endpoint | คำอธิบาย |
|--------|----------|---------|
| GET | `/api/pc-plan/divisions` | ดึง Division ทั้งหมด |
| GET | `/api/pc-plan/master-data/:divCode` | ดึง Master Data ตาม Division |
| POST | `/api/pc-plan/insert` | สร้าง Plan ใหม่ |
| GET | `/api/pc-plan/list` | ดึงรายการ Plan ทั้งหมด |
| DELETE | `/api/pc-plan/delete/:id` | ลบ Plan เดี่ยว |
| DELETE | `/api/pc-plan/delete-group/:groupId` | ลบทั้งกลุ่ม |
| GET | `/api/pc-plan/history/:groupId` | ดูประวัติ (Revision) |
| POST | `/api/pc-plan/update-paths` | อัปเดต Path (ไม่เปลี่ยน Rev) |
| PUT | `/api/pc-plan/update` | แก้ไข Plan แบบ In-Place |
| PUT | `/api/pc-plan/cancel/:id` | Cancel Plan |

---

### 7.7 📥 Master PH (Import ข้อมูล Master)
| Method | Endpoint | คำอธิบาย |
|--------|----------|---------|
| GET | `/api/master-ph` | ดึง Master PH ทั้งหมด |
| POST | `/api/master-ph/import` | Import Excel (Master Data)  ← multer |
| POST | `/api/master-ph/import-type-tooling` | Import Type Tooling ← multer |
| POST | `/api/master-ph/import-master-all-pmc` | Import Master All PMC ← multer |
| POST | `/api/master-ph/import-master-tooling-pmc` | Import Master Tooling PMC |
| POST | `/api/master-ph/sync-gm` | Sync GM Master Data |
| POST | `/api/master-ph/import-ireport` | Import iReport ← multer |

---

### 7.8 🔄 Return (คืน Tooling)

**Table:** `[master].[tb_Return_List]`

| Method | Endpoint | คำอธิบาย | SP |
|--------|----------|---------|----|
| GET | `/api/return/divisions` | ดึง Division | `trans.Stored_Get_Dropdown_Division` |
| GET | `/api/return/facilities/:divisionId` | ดึง Facility ตาม Division | `trans.Stored_Get_Dropdown_Facility_By_Division` |
| GET | `/api/return/processes/:divisionId` | ดึง Process | `trans.Stored_Get_tb_Process` |
| GET | `/api/return/item/:itemNo` | AutoFill/Autocomplete ItemNo | `trans.Stored_Get_ItemDetail_AutoFill` |
| GET | `/api/return/partno/:partNo` | Autocomplete PartNo | `trans.Stored_Get_tb_PartNo` |
| POST | `/api/return/save` | บันทึกใบคืน (ใช้ **SQL Transaction**) | `trans.Stored_Save_Return_Request` |
| GET | `/api/return/list` | รายการคืนทั้งหมด | Inline SQL |
| GET | `/api/return/next-doc-no` | สร้างเลขที่เอกสารใหม่ | Inline SQL |
| POST | `/api/return/update-status` | อัปเดตสถานะ | `trans.Stored_Update_Return_Status` |

**Business Flow ของ `saveReturnRequest`:**
1. รับ `header` (ข้อมูลหัว) + `items` (Array รายการคืน)
2. **เปิด SQL Transaction** → วน Loop INSERT ทีละ item
3. ถ้าสำเร็จ → `transaction.commit()` / ถ้าผิดพลาด → `transaction.rollback()` (ไม่เสียข้อมูล)
4. ส่ง Notification (`RETURN_SENT`) แจ้ง Role `purchase`

> 💡 **Return เป็น Module เดียวที่ใช้ SQL Transaction** (มี begin/commit/rollback) ซึ่ง Module อื่นๆ ไม่ได้ใช้

**รูปแบบ DocNo ของ Return:**
`RET{Process}{Fac}{Month}{Running4หลัก}` เช่น `RETTN6120001`

**เมื่อ `updateReturnStatus` เปลี่ยนเป็น `completed`:**
จะส่ง Notification (`RETURN_COMPLETED`) แจ้ง Role `production` ว่า "Purchase ยืนยันการรับคืนแล้ว"

---

### 7.9 🔔 Notification (ระบบแจ้งเตือน)
| Method | Endpoint | คำอธิบาย | SP |
|--------|----------|---------|----|
| GET | `/api/notifications/list?role=xxx` | ดึง Notification (กรอง Role) | `trans.Stored_Get_Notification_Log` |
| GET | `/api/notifications/trash` | ดึงจาก Trash | `trans.Stored_Get_Notification_Log` |
| PUT | `/api/notifications/read/:id` | Mark as Read | `trans.Stored_Update_Notification_Status` |
| PUT | `/api/notifications/mark-all-read` | Mark All Read | `trans.Stored_Update_Notification_Status` |
| PUT | `/api/notifications/delete-read` | ย้าย Read → Trash (Soft Delete) | `trans.Stored_Update_Notification_Status` |
| PUT | `/api/notifications/restore/:id` | Restore จาก Trash | `trans.Stored_Update_Notification_Status` |

**Header ที่ต้องส่ง:** `x-username` (ระบุ Username ของผู้ใช้ เพื่อแยก Read/Trash state ตาม User)

**ระบบ Per-User State:**
- สถานะ Read/Unread แยก**ตามผู้ใช้** (User A อ่านแล้ว User B ยังไม่อ่าน)
- สถานะ Trash ก็แยกตามผู้ใช้เช่นกัน

**ฟังก์ชัน `emitNotification()` (ใช้จาก Controller อื่น):**
- Insert ลง DB ผ่าน `trans.Stored_Insert_Notification_Log`
- Emit Socket.IO event `'notification'` ไปยังทุก Client
- รับ parameter: `eventType`, `subject`, `messageEN`, `messageTH`, `docNo`, `actionBy`, `targetRoles`, `ctaRoute`, `detailsJson`

**Event Types ที่ใช้:**
| Event | เกิดเมื่อ | Target Role |
|-------|------------|-------------|
| `REQUEST_SENT` | มีการส่งเบิกใหม่ | `purchase` |
| `RETURN_SENT` | มีการคืน Tooling ใหม่ | `purchase` |
| `RETURN_COMPLETED` | Purchase ยืนยันรับคืนแล้ว | `production` |

**Auto-Purge Scheduler:**
- รันทุก **1 ชั่วโมง** (ครั้งแรกหลัง startup 5 วินาที)
- ลบ Trash ที่เก่ากว่า **3 วัน** ถาวร

---

### 7.10 โมดูลอื่นๆ

**👤 Employee (จัดการผู้ใช้)**

**Table:** `tb_CuttingTool_Employee` / **View:** `View_CuttingTool_Employee`

| Method | Endpoint | คำอธิบาย | SP/Query |
|--------|----------|---------|----------|
| GET | `/api/get_Employee` | ดึงพนักงานทั้งหมด | View `View_CuttingTool_Employee` |
| POST | `/api/AddEmployee` | เพิ่มพนักงานใหม่ | `Stored_Insert_tb_CuttingTool_Employee` |
| DELETE | `/api/delete_employee/:id` | ลบพนักงาน | Inline SQL |
| POST | `/api/update/:id` | แก้ไข (ถ้าไม่ส่ง Password จะใช้รหัสเดิม) | Inline SQL |

**📊 Analyze (วิเคราะห์ค่าใช้จ่าย)**
| Endpoint | คำอธิบาย | แหล่งข้อมูล |
|----------|---------|--------|
| GET `/api/getdataall` | ข้อมูลวิเคราะห์ทั้งหมด | `[viewer].[View_Cost_Analyze_Complete]` |
| GET `/api/getcostanalyze` | ข้อมูล Cost Analyze | `[viewer].[View_Cost_Analyze_Complete]` |
| GET `/api/getdatasmartrack` | ข้อมูล SmartRack | View SmartRack |

**💬 Purchase/User History**
| Endpoint | คำอธิบาย | SP |
|----------|---------|----|
| GET `/api/Purchase_Request` | ดึงรายการ Purchase Request | View |
| GET `/api/Purchase_History` | ดูประวัติ Purchase | `trans.Stored_Purchase_History` |
| GET `/api/User_History` | ดูประวัติ User | View |

**🖨️ History Print (ประวัติการพิมพ์)**

**Table:** `tb_Cuttingtool_HistoryPrint`, `tb_Emp_PermissionPrint`

| Endpoint | คำอธิบาย | SP/Query |
|----------|---------|----------|
| POST `/api/SaveHistoryPrint` | บันทึกประวัติการพิมพ์ | `stored_Master_HistoryPrint_Insert` |
| GET `/api/EmpPrint` | ดึงพนักงานที่มีสิทธิ์พิมพ์ | `tb_Emp_PermissionPrint` |
| GET `/api/check-print-permission` | เช็คสิทธิ์พิมพ์รายบุคคล (ส่ง Employee_ID ไป) | `tb_Emp_PermissionPrint` |
| GET `/api/HistoryPrint` | ดึงประวัติการพิมพ์ทั้งหมด | `tb_Cuttingtool_HistoryPrint` |

**📂 File Upload**
| Endpoint | คำอธิบาย |
|----------|--------|
| POST `/api/loadPdfFromPath` | โหลด PDF จาก Path ในเซิร์ฟเวอร์ |

---

## 🔔 8. ระบบ Notification (Socket.IO + Email)

### 8.1 Socket.IO — Real-time Notification

ตั้งค่าใน `server.js`:
```javascript
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.set('socketio', io);  // เก็บ io instance ใน app เพื่อเรียกใช้ใน Controller
```

**การใช้งานจาก Controller:**
```javascript
const io = req.app.get('socketio');
io.emit('notification', { type: 'REQUEST_SENT', message: '...' });
```

### 8.2 ฟังก์ชัน `emitNotification()` (ใน `Notification.controller.js`)

เป็น Helper function ที่ทำ 2 อย่างพร้อมกัน:
1. **Insert** ข้อมูลลงตาราง Notification ผ่าน Stored Procedure `trans.Stored_Insert_Notification_Log`
2. **Emit** ไปยัง Client ทุกตัวผ่าน Socket.IO

```javascript
const { emitNotification } = require('./Notification.controller');
await emitNotification(req, pool, {
  eventType: 'REQUEST_SENT',
  subject: '🔴 New Tooling Request',
  messageEN: 'English message',
  messageTH: 'ข้อความภาษาไทย',
  docNo: 'SETTN9080001',
  actionBy: 'John',
  targetRoles: 'purchase',
  ctaRoute: '/purchase/request-list',
  detailsJson: { ... }
});
```

### 8.3 Auto-Purge Scheduler

ระบบลบ Notification เก่าอัตโนมัติ:
- รัน **ทุก 1 ชั่วโมง** (หลังจาก startup 5 วินาที)
- ลบ Trash ที่เก่ากว่า **3 วัน**

### 8.4 Email (nodemailer)

ใช้ Gmail SMTP โดยตั้งค่าผ่าน `.env`:

```javascript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS   // ← App Password (16 ตัว)
  }
});

transporter.sendMail({
  from: '"Indirect expense" <email>',
  to: emailList,       // ← ดึงจาก DB ตาม Role
  subject: 'Subject',
  html: '<h1>...</h1>'
});
```

> อีเมลถูกส่ง **แบบ Background** (ไม่ block response)

---

## 📎 9. File Upload (Multer & express-fileupload)

### 9.1 `express-fileupload` (ใช้ทั่วทั้งระบบ)

ตั้งค่าที่ `server.js`:
```javascript
app.use(fileupload());
```
- ไฟล์ที่อัปโหลดจะอยู่ใน `req.files`

### 9.2 `multer` (เฉพาะ Import Excel ใน MasterPH)

ตั้งค่าที่ `src/config/multer.config.js`:

| Setting | ค่า |
|---------|-----|
| Storage | **Memory Storage** (เก็บใน RAM) |
| ไฟล์ที่รับ | `.xlsx`, `.xls`, `.csv` เท่านั้น |
| ขนาดสูงสุด | **50 MB** |

**การใช้งานใน Route:**
```javascript
const upload = require('../config/multer.config');
router.post('/master-ph/import', upload.single('file'), controller.importMasterData);
// ข้อมูลไฟล์จะอยู่ใน req.file.buffer
```

---

## 📜 10. SQL Scripts & Stored Procedures

โฟลเดอร์ `sql/` เก็บ Script ทั้งหมด (59 ไฟล์) แบ่งเป็น:

| หมวด | ตัวอย่าง | คำอธิบาย |
|------|---------|---------|
| **Stored Procedures** | `Stored_DetailPurchaseRequest.sql` | SP หลักสำหรับ Query ข้อมูล |
| | `Stored_Insert_Request_Bulk.sql` | SP สำหรับ Insert หลายแถว |
| | `Stored_PurchaseHistory.sql` | SP สำหรับดึงประวัติ |
| **Functions** | `Create_Function_Generate_DocNo.sql` | สร้างเลขที่เอกสาร |
| | `Create_Function_Generate_MFGOrderNo.sql` | สร้างเลขที่ MFG Order |
| **Views** | `View_RequestList_History.sql` | View สำหรับประวัติ Request |
| | `Update_View_Division_Facility_Add_GM.sql` | แก้ไข View เพิ่ม GM |
| **Tables** | `Create_Notification_Table.sql` | สร้างตาราง Notification |
| | `Create_Staging_ToolingData_PMC.sql` | สร้าง Staging Table |
| **Data Fix** | `cleanup_null_itemno.sql` | แก้ข้อมูลผิดพลาด |
| | `fix_division_id_null.sql` | แก้ Division ID เป็น null |
| **Import** | `Stored_Import_Master_Tooling_PMC_JSON.sql` | Import Master ผ่าน JSON |

> 💡 เมื่อสร้าง Stored Procedure ใหม่ ให้เก็บ Script ไว้ที่ `sql/` เสมอ เพื่อเป็นบันทึกและสามารถ Re-deploy ได้

---

## 🧑‍💻 11. แนวทางการพัฒนา — Step-by-Step

### ขั้นตอนการเพิ่ม API ใหม่ (ครบ Loop)

#### Step 1: สร้าง Controller (`src/controllers/`)

```javascript
// src/controllers/MyFeature.controller.js
const { poolPromise } = require("../config/database");
const sql = require('mssql');

exports.getMyData = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Param1', sql.NVarChar(50), req.query.param1)
      .execute('[dbo].[Stored_My_Feature]');
    
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error getMyData:', err);
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.createMyData = async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('Name', sql.NVarChar(100), req.body.name)
      .input('Value', sql.Int, req.body.value)
      .execute('[dbo].[Stored_Insert_My_Feature]');
    
    res.status(200).json({ message: 'Created successfully' });
  } catch (err) {
    console.error('Error createMyData:', err);
    res.status(500).json({ message: 'Error', error: err.message });
  }
};
```

#### Step 2: สร้าง Route (`src/routes/`)

```javascript
// src/routes/MyFeature.route.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/MyFeature.controller');

router.get('/my-feature', controller.getMyData);
router.post('/my-feature', controller.createMyData);

module.exports = router;
```

#### Step 3: ลงทะเบียน Route ใน `server.js`

```javascript
// server.js — เพิ่มตรง Import Section
const MyFeature = require('./src/routes/MyFeature.route.js');

// เพิ่มตรง Route Registration Section
app.use('/api', MyFeature);
```

#### Step 4: สร้าง Stored Procedure (ถ้าต้องการ)

สร้างไฟล์ `sql/Stored_My_Feature.sql` แล้วรันบน SQL Server

#### Step 5: ทดสอบ

ใช้ Postman หรือ curl ทดสอบ:
```bash
curl http://localhost:3000/api/my-feature?param1=test
```

---

## ⚠️ 12. Error Handling Pattern

ทุก Controller ใช้รูปแบบ `try-catch` เหมือนกันหมด:

```javascript
exports.myFunction = async (req, res) => {
  try {
    // ... business logic ...
    res.status(200).json({ message: 'Success', data: result.recordset });
  } catch (err) {
    console.error('Error in myFunction:', err);
    res.status(500).json({ 
      message: 'เกิดข้อผิดพลาด', 
      error: err.message 
    });
  }
};
```

**HTTP Status Codes ที่ใช้:**
| Code | ใช้เมื่อ |
|------|---------|
| `200` | สำเร็จ |
| `400` | Request ไม่ถูกต้อง (ขาด parameter) |
| `401` | Unauthorized (Login ไม่สำเร็จ) |
| `404` | ไม่พบข้อมูล |
| `500` | Server Error |

---

## 💡 13. ข้อควรระวังและ Tips สำคัญ

### 🔴 ข้อควรระวัง

1. **`.env` ห้าม commit ขึ้น Git** — มี credentials จริงอยู่
2. **SQL Injection** — ใช้ `.input()` พร้อมกำหนด type ทุกครั้ง ห้าม concat string เข้า query
3. **CORS เปิด `origin: '*'`** — ระวังในขั้นตอน Production ควรจำกัด Origin
4. **Body Parser Limit 50MB** — ตั้งไว้เพื่อ Import ไฟล์ใหญ่ แต่อาจเป็นช่องโหว่ DoS ได้
5. **Token เป็น Base64 ไม่ได้เป็น JWT จริง** — ปัจจุบัน Token สร้างจาก `Buffer.from(rawData).toString('base64')` ไม่มีการ Sign/Verify
6. **Email Credentials อยู่ใน `.env`** — ใช้ Gmail App Password ถ้าเปลี่ยนรหัสต้องอัปเดต `.env`

### 🟢 Tips

1. **ดู Flow ทั้งหมด:** เริ่มจาก `server.js` → Route → Controller → SQL ไล่ตามลำดับ
2. **ใช้ `npm run dev`** เวลาพัฒนา เพราะ `nodemon` จะ auto-reload เมื่อแก้ไฟล์
3. **เก็บ SQL Script ทุกครั้ง** ที่สร้าง/แก้ Stored Procedure ใน `sql/`
4. **ทดสอบด้วย Postman** ก่อนเชื่อม Frontend
5. **ดู Table ชื่อ `tb_*`** ในฐานข้อมูล `db_Tooling` เพื่อทำความเข้าใจโครงสร้างข้อมูล
6. **มี Stored Procedure หลัก** ที่สำคัญเช่น:
   - `stored_Find_CuttingTool_Employee` — ใช้ Login
   - `stored_IssueCuttingTool_SendRequest` — ใช้ส่งเบิก
   - `trans.Stored_Insert_Notification_Log` — ใช้สร้าง Notification
   - `trans.Stored_Update_Notification_Status` — ใช้จัดการ Read/Trash/Purge
   - `trans.Stored_Get_Notification_Log` — ดึง Notification ตาม Role

### 🟡 สิ่งที่ควรปรับปรุงในอนาคต
- Migrate Inline SQL Query ที่เหลือ → Stored Procedure
- เพิ่ม JWT Verification ที่ถูกต้อง (Sign + Verify)
- เพิ่ม Middleware สำหรับ Authentication
- เพิ่ม Input Validation ด้วย `express-validator`
- เขียน Unit Test ด้วย Jest

---

> 📝 **หมายเหตุ:** เอกสารนี้จัดทำจากโค้ดจริงในโปรเจกต์ หากมีการเปลี่ยนแปลงโครงสร้าง ควรอัปเดตเอกสารให้เป็นปัจจุบัน