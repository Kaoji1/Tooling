const sql = require('mssql');
const { poolPromise } = require('../config/database'); // ตรวจสอบ path config database ว่าถูกต้อง

// 1. ฟังก์ชันดึง Division (อันนี้ต้องมี เพราะ Frontend ยังเรียกใช้ตอนเริ่มหน้าเว็บ)
exports.getDivisions = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('trans.Stored_Get_Dropdown_Division_List');

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error getDivisions:', err);
        res.status(500).send({ message: err.message });
    }
};

// 2. ฟังก์ชันดึง Master Data รวม (Machines, Facilities, Processes, PartNos)
exports.getMasterDataByDivision = async (req, res) => {
    try {
        const divCode = req.params.divCode;

        if (!divCode) {
            return res.status(400).send({ message: "Division is required." });
        }

        const pool = await poolPromise;
        console.log(`Fetching Master Data for Division: ${divCode}...`);

        // ยิง 4 Query พร้อมกัน
        const [machines, facilities, processes, partNos] = await Promise.all([
            // 1. Machine
            pool.request()
                .input('InputDivision', sql.NVarChar, divCode)
                .execute('trans.Stored_Get_Dropdown_Machine_By_Division'),

            // 2. Facility
            pool.request()
                .input('InputDivision', sql.NVarChar, divCode)
                .execute('trans.Stored_Get_Dropdown_Facility_By_Division'),

            // 3. Process
            pool.request()
                .input('InputDivision', sql.NVarChar, divCode)
                .execute('trans.Stored_Get_Dropdown_Process_By_Division'),

            // 4. PartNo (ใช้ร่วมกับ PartBef)
            pool.request()
                .input('InputDivision', sql.NVarChar, divCode)
                .execute('trans.Stored_Get_Dropdown_PartNo_By_Division')
        ]);

        res.status(200).json({
            machines: machines.recordset,
            facilities: facilities.recordset,
            processes: processes.recordset,
            partNos: partNos.recordset,
            partBefs: partNos.recordset // ใช้ข้อมูลชุดเดียวกับ PartNo
        });

    } catch (err) {
        console.error('Error getMasterDataByDivision:', err);
        res.status(500).send({ message: err.message });
    }
};

// 3. ฟังก์ชันบันทึกข้อมูล (Insert PC Plan)
exports.insertPCPlan = async (req, res) => {
    try {
        const items = req.body; // รับ array ของ plan items จาก frontend

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).send({ message: "No data provided." });
        }

        const pool = await poolPromise;
        const totalItems = items.length;
        let successCount = 0;
        let failCount = 0;
        const errors = [];

        console.log(`[PCPlan] Starting insert of ${totalItems} items...`);

        // Helper function to process single item
        const processItem = async (item, index) => {
            try {
                const request = pool.request();

                // Map Parameters to Stored Procedure
                request.input('PlanDate', sql.Date, item.date || null); // ต้องส่งเป็น 'YYYY-MM-DD'
                request.input('Employee_ID', sql.NVarChar(50), item.employeeId || '');
                request.input('Division', sql.NVarChar(50), item.division || '');
                request.input('MC_Type', sql.NVarChar(50), item.machineType || '');
                request.input('Facility', sql.NVarChar(50), item.fac || '');
                request.input('Before_Part', sql.NVarChar(50), item.partBef || '');
                request.input('Process', sql.NVarChar(50), item.process || '');
                request.input('MC_No', sql.NVarChar(50), item.mcNo || '');
                request.input('PartNo', sql.NVarChar(50), item.partNo || '');

                // แปลงค่าให้ตรง type
                const qtyValues = parseFloat(item.qty);
                request.input('QTY', sql.Float, isNaN(qtyValues) ? 0 : qtyValues);

                const timeValue = parseInt(item.time, 10);
                request.input('Time', sql.Int, isNaN(timeValue) ? 0 : timeValue);

                request.input('Comment', sql.NVarChar(255), item.comment || '');

                await request.execute('trans.Stored_PCPlan_Insert');
                successCount++;
            } catch (err) {
                failCount++;
                console.error(`[PCPlan] Error at row ${index}:`, err.message);
                errors.push({ index, error: err.message });
            }
        };

        // ใช้ Promise.all เพื่อยิงพร้อมกัน (Parallel Batching)
        // ถ้าข้อมูลเยอะมากอาจต้องแบ่ง Chunk แต่ user บอกหลักสิบ/ร้อย น่าจะไหว
        const promises = items.map((item, index) => processItem(item, index));
        await Promise.all(promises);

        console.log(`[PCPlan] Finished. Success: ${successCount}, Failed: ${failCount}`);

        res.status(200).json({
            message: "Import processing completed",
            count: successCount,
            fail: failCount,
            errors: errors
        });

    } catch (err) {
        console.error('Error insertPCPlan:', err);
        res.status(500).send({ message: err.message });
    }
};

// 4. ฟังก์ชันดึงรายการ (Get List)
exports.getPlanList = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('trans.Stored_PCPlan_Query');

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error getPlanList:', err);
        res.status(500).send({ message: err.message });
    }
};

// 5. ฟังก์ชันลบข้อมูล (Delete PC Plan)
exports.deletePCPlan = async (req, res) => {
    try {
        const id = req.params.id;

        if (!id) {
            return res.status(400).send({ message: "Plan ID is required." });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('Plan_ID', sql.Int, id)
            .execute('trans.Stored_PCPlan_Delete');

        res.status(200).json({ message: "Deleted successfully", id: id });

    } catch (err) {
        console.error('Error deletePCPlan:', err);
        res.status(500).send({ message: err.message });
    }
};