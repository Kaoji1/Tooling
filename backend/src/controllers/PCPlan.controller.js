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