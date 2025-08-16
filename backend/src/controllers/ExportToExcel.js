var XLSX = require("xlsx");

// const ExcelJS = require("exceljs");

// exports.exportToExcel = async (req, res) => {
//   try {
//     // ดึงข้อมูลจาก Database หรือ API
//     const data = [
//       { id: 1, name: "Product A", price: 100 },
//       { id: 2, name: "Product B", price: 200 },
//       { id: 3, name: "Product C", price: 300 },
//     ];

//     // สร้าง workbook และ worksheet
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet("Report");

//     // กำหนด header
//     worksheet.columns = [
//       { header: "ID", key: "id", width: 10 },
//       { header: "Name", key: "name", width: 30 },
//       { header: "Price", key: "price", width: 15 },
//     ];

//     // ใส่ข้อมูล
//     data.forEach((item) => {
//       worksheet.addRow(item);
//     });

//     // ตั้งค่า response header
//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//     );
//     res.setHeader(
//       "Content-Disposition",
//       "attachment; filename=Report.xlsx"
//     );

//     // ส่งออกเป็น stream
//     await workbook.xlsx.write(res);
//     res.end();
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Error generating Excel file");
//   }
// };
