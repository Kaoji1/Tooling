const sql = require('mssql');
const { poolPromise } = require('../config/database'); // *แก้ path ให้ตรงกับไฟล์ config db ของคุณ

// 1. ดึงรายชื่อ Division ทั้งหมด (GM, PMC -> แต่ใน DB เป็น Code)
exports.getDivisions = async (req, res) => {
    try {
        const pool = await poolPromise;
        // เรียก SP: trans.Stored_Get_Dropdown_Division_List
        const result = await pool.request()
            .execute('trans.Stored_Get_Dropdown_Division_List');

        // ส่งข้อมูลกลับไปเป็น Array (เช่น [{ Division: '7122' }, { Division: '71DZ' }])
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error getDivisions:', err);
        res.status(500).send({ message: err.message });
    }
};

// 2. ดึง Machine Type ตาม Division
exports.getMachinesByDivision = async (req, res) => {
    try {
        // รับค่า div จาก Frontend (เช่น ?div=7122)
        const division = req.query.div;

        if (!division) {
            return res.status(400).send({ message: "Division is required." });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            // Map ตัวแปร @InputDivision ตาม SP
            .input('InputDivision', sql.NVarChar, division)
            .execute('trans.Stored_Get_Dropdown_Machine_By_Division');

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error getMachines:', err);
        res.status(500).send({ message: err.message });
    }
};

// 3. ดึง Facility ตาม Division

exports.getFacilitiesByDivision = async (req, res) => {

    try {

        const division = req.query.div;

        if (!division) return res.status(400).send({ message: "Division is required." });



        const pool = await poolPromise;

        const result = await pool.request()

            .input('InputDivision', sql.NVarChar, division)

            .execute('trans.Stored_Get_Dropdown_Facility_By_Division');



        res.status(200).json(result.recordset);

    } catch (err) {

        console.error('Error getFacilities:', err);

        res.status(500).send({ message: err.message });

    }

};

// 4. ดึง Process ตาม Division
exports.getProcessesByDivision = async (req, res) => {
    try {
        const division = req.query.div;
        if (!division) return res.status(400).send({ message: "Division is required." });

        const pool = await poolPromise;
        const result = await pool.request()
            .input('InputDivision', sql.NVarChar, division)
            .execute('trans.Stored_Get_Dropdown_Process_By_Division');

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error getProcesses:', err);
        res.status(500).send({ message: err.message });
    }
};

// 5. ดึง PartNo ตาม Division
exports.getPartNosByDivision = async (req, res) => {
    try {
        const division = req.query.div;
        if (!division) return res.status(400).send({ message: "Division is required." });

        const pool = await poolPromise;
        const result = await pool.request()
            .input('InputDivision', sql.NVarChar, division)
            .execute('trans.Stored_Get_Dropdown_PartNo_By_Division');

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error getPartNos:', err);
        res.status(500).send({ message: err.message });
    }
};