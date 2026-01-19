const sql = require('mssql');
const { poolPromise } = require('../config/database'); // ตรวจสอบ path config database ว่าถูกต้อง

// 1. ฟังก์ชันดึง Division (สำหรับ Dropdown เลือกแผนก)
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

// 2. ฟังก์ชันดึง Master Data รวม (Machines, Facilities, Processes, PartNos) ตาม Division ที่เลือก
exports.getMasterDataByDivision = async (req, res) => {
    try {
        const divCode = req.params.divCode;

        if (!divCode) {
            return res.status(400).send({ message: "Division is required." });
        }

        const pool = await poolPromise;
        console.log(`Fetching Master Data for Division: ${divCode}...`);

        const [machines, facilities, processes, partNos] = await Promise.all([
            // 1. Machine Type
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

            // 4. PartNo
            pool.request()
                .input('InputDivision', sql.NVarChar, divCode)
                .execute('trans.Stored_Get_Dropdown_PartNo_By_Division')
        ]);

        res.status(200).json({
            machines: machines.recordset,
            facilities: facilities.recordset,
            processes: processes.recordset,
            partNos: partNos.recordset,
            partBefs: partNos.recordset
        });

    } catch (err) {
        console.error('Error getMasterDataByDivision:', err);
        res.status(500).send({ message: err.message });
    }
};

// 5. ฟังก์ชันเพิ่มรายการ PC Plan ใหม่ (Import Excel / Add New) -> Revert to Basic Insert
exports.insertPCPlan = async (req, res) => {
    try {
        const items = req.body;
        if (!Array.isArray(items)) {
            return res.status(400).send({ message: "Data must be an array." });
        }

        const pool = await poolPromise;
        let successCount = 0;
        let errorCount = 0;

        for (const item of items) {
            try {
                // Basic Insert Logic (No Smart Match, No Revision)
                const request = pool.request();

                request.input('PlanDate', sql.Date, new Date(item.date)); // item.date from frontend
                request.input('Employee_ID', sql.NVarChar(50), item.employeeId || '');
                request.input('Division', sql.NVarChar(50), item.division || '');
                request.input('MC_Type', sql.NVarChar(50), item.mcType || '');
                request.input('Facility', sql.NVarChar(50), item.fac || '');
                request.input('Before_Part', sql.NVarChar(50), item.partBefore || item.partBef || ''); // Support both keys
                request.input('Process', sql.NVarChar(50), item.process || '');
                request.input('MC_No', sql.NVarChar(50), item.mcNo || '');
                request.input('PartNo', sql.NVarChar(50), item.partNo || '');
                request.input('QTY', sql.Float, parseFloat(item.qty) || 0);
                request.input('Time', sql.Int, parseInt(item.time) || 0);
                request.input('Comment', sql.NVarChar(255), item.comment || '');

                // Call Original Insert SP
                await request.execute('trans.Stored_PCPlan_Insert');

                successCount++;
            } catch (err) {
                console.error('Error inserting item:', item, err);
                errorCount++;
            }
        }

        res.status(200).send({
            message: `Process complete. Success: ${successCount}, Failed: ${errorCount}`,
            successCount,
            errorCount
        });

    } catch (err) {
        console.error('Error insertPCPlan:', err);
        res.status(500).send({ message: err.message });
    }
};

// 4. ฟังก์ชันดึงรายการ PC Plan ทั้งหมด (Get List)
exports.getPlanList = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('trans.Stored_PCPlan_Query');

        console.log('[getPlanList] Rows fetched:', result.recordset.length); // DEBUG LOG
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error getPlanList:', err);
        res.status(500).send({ message: err.message });
    }
};

// 5. ฟังก์ชันลบข้อมูล PC Plan (Delete) -> Soft Delete
exports.deletePCPlan = async (req, res) => {
    try {
        const id = req.params.id;

        if (!id) {
            return res.status(400).send({ message: "Plan ID is required." });
        }

        const pool = await poolPromise;
        await pool.request()
            .input('Plan_ID', sql.Int, id) // Correct Parameter Name
            .execute('trans.Stored_PCPlan_Delete'); // Correct SP for Hard Delete

        res.status(200).json({ message: "Deleted successfully", id: id });

    } catch (err) {
        console.error('Error deletePCPlan:', err);
        res.status(500).send({ message: err.message });
    }
};

// revisePCPlan removed as per full revert request