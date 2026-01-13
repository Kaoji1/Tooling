const { poolPromise } = require("../config/database");
const sql = require("mssql");

exports.getAllMasterPHValues = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
      SELECT [PHGM_ID]
            ,[DVS_Id]
            ,[ItemNo]
            ,[ItemName]
            ,[Spec_ID]
            ,[Spec]
            ,[DW]
            ,[ClassCode]
            ,[ItemType]
            ,[Dept]
            ,[ProductCode]
            ,[Source Code]
            ,[Organisation]
            ,[ItemClass]
            ,[Commodity]
            ,[CL]
            ,[AccountCode]
            ,[StockType]
            ,[MainWH]
            ,[StockLoc]
            ,[MatL_Type]
            ,[StockUnit]
            ,[PurchaseUnit1]
            ,[Conversion1]
            ,[PurchaseUnit2]
            ,[Conversion2]
            ,[WC_Code]
            ,[ModelGroup]
            ,[PayDuty]
            ,[Line]
            ,[HardAllocation]
            ,[ECN]
            ,[OrderPolicy]
            ,[OrderPoint]
            ,[WOS]
            ,[SaftyCode]
            ,[MakerCode]
            ,[MakerName]
            ,[MakerSpec]
            ,[WPC_No]
            ,[Vendor]
            ,[VendorName]
            ,[UnitPrice]
            ,[Currency]
            ,[PurLeadtime]
            ,[Standard_Qty]
            ,[BasicOrder]
            ,[MaxximumOrder]
            ,[MinimumOrder]
            ,[Yield]
            ,[BOI_Code]
            ,[Remark]
            ,[SaftyStock]
            ,[OrderBal]
            ,[Allocated]
            ,[OnHand]
            ,[PendingCode]
            ,[ReasonPending]
            ,[Last_Issued]
            ,[Last_StockIn]
            ,[Last_Maint]
            ,[Time]
            ,[Operator]
            ,[FileName]
            ,[ModifyDate]
      FROM [db_Cost_Data_Centralized].[master].[tb_Purchase_Item_Master_PMC]
    `);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error getting MasterPH data:", err);
        res
            .status(500)
            .json({ message: "Error fetching MasterPH data", error: err.message });
    }
}


exports.importMasterData = async (req, res) => {
    try {
        const items = req.body; // Expecting an array of objects
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Invalid data format. Expected an array of items." });
        }

        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        try {
            for (const item of items) {
                const request = new sql.Request(transaction);

                // Map Item Inputs to Stored Procedure Parameters
                // Note: Using safe defaults for numbers (0) and strings ('') if data is missing, or null if nullable.
                request.input('DVS_Id', sql.Int, item.DVS_Id ?? null);
                request.input('ItemNo', sql.NVarChar(50), item.ItemNo ?? null);
                request.input('ItemName', sql.NVarChar(50), item.ItemName ?? null);
                request.input('Spec_ID', sql.Int, item.Spec_ID ?? null);
                request.input('Spec', sql.NVarChar(50), item.Spec ?? null);
                request.input('DW', sql.NVarChar(50), item.DW ?? null);
                request.input('ClassCode', sql.NVarChar(50), item.ClassCode ?? null);
                request.input('ItemType', sql.NVarChar(50), item.ItemType ?? null);
                request.input('Dept', sql.NVarChar(50), item.Dept ?? null);
                request.input('ProductCode', sql.NVarChar(50), item.ProductCode ?? null);
                request.input('SourceCode', sql.NVarChar(50), item['Source Code'] ?? item.SourceCode ?? null);
                request.input('Organisation', sql.NVarChar(50), item.Organisation ?? null);
                request.input('ItemClass', sql.NVarChar(50), item.ItemClass ?? null);
                request.input('Commodity', sql.NVarChar(50), item.Commodity ?? null);
                request.input('CL', sql.NVarChar(50), item.CL ?? null);
                request.input('AccountCode', sql.NVarChar(50), item.AccountCode ?? null);
                request.input('StockType', sql.NVarChar(50), item.StockType ?? null);
                request.input('MainWH', sql.NVarChar(50), item.MainWH ?? null);
                request.input('StockLoc', sql.NVarChar(50), item.StockLoc ?? null);
                request.input('MatL_Type', sql.NVarChar(50), item.MatL_Type ?? null);
                request.input('StockUnit', sql.NVarChar(50), item.StockUnit ?? null);
                request.input('PurchaseUnit1', sql.NVarChar(50), item.PurchaseUnit1 ?? null);
                request.input('Conversion1', sql.Int, item.Conversion1 ?? null);
                request.input('PurchaseUnit2', sql.NVarChar(50), item.PurchaseUnit2 ?? null);
                request.input('Conversion2', sql.Int, item.Conversion2 ?? null);
                request.input('WC_Code', sql.NVarChar(50), item.WC_Code ?? null);
                request.input('ModelGroup', sql.NVarChar(50), item.ModelGroup ?? null);
                request.input('PayDuty', sql.Int, item.PayDuty ?? null);
                request.input('Line', sql.NVarChar(50), item.Line ?? null);
                request.input('HardAllocation', sql.NVarChar(50), item.HardAllocation ?? null);
                request.input('ECN', sql.Date, item.ECN ? new Date(item.ECN) : null);
                request.input('OrderPolicy', sql.NVarChar(50), item.OrderPolicy ?? null);
                request.input('OrderPoint', sql.NVarChar(50), item.OrderPoint ?? null);
                request.input('WOS', sql.NVarChar(50), item.WOS ?? null);
                request.input('SaftyCode', sql.NVarChar(50), item.SaftyCode ?? null);
                request.input('MakerCode', sql.NVarChar(50), item.MakerCode ?? null);
                request.input('MakerName', sql.NVarChar(50), item.MakerName ?? null);
                request.input('MakerSpec', sql.NVarChar(50), item.MakerSpec ?? null);
                request.input('WPC_No', sql.NVarChar(50), item.WPC_No ?? null);
                request.input('Vendor', sql.NVarChar(50), item.Vendor ?? null);
                request.input('VendorName', sql.NVarChar(50), item.VendorName ?? null);
                request.input('UnitPrice', sql.Float, item.UnitPrice ?? null);
                request.input('Currency', sql.NVarChar(50), item.Currency ?? null);
                request.input('PurLeadtime', sql.Int, item.PurLeadtime ?? null);
                request.input('Standard_Qty', sql.Int, item.Standard_Qty ?? null);
                request.input('BasicOrder', sql.Int, item.BasicOrder ?? null);
                request.input('MaxximumOrder', sql.Int, item.MaxximumOrder ?? null);
                request.input('MinimumOrder', sql.Int, item.MinimumOrder ?? null);
                request.input('Yield', sql.Decimal(10, 2), item.Yield ?? null);
                request.input('BOI_Code', sql.NVarChar(50), item.BOI_Code ?? null);
                request.input('Remark', sql.NVarChar(50), item.Remark ?? null);
                request.input('SaftyStock', sql.Int, item.SaftyStock ?? null);
                request.input('OrderBal', sql.Int, item.OrderBal ?? null);
                request.input('Allocated', sql.Int, item.Allocated ?? null);
                request.input('OnHand', sql.Int, item.OnHand ?? null);
                request.input('PendingCode', sql.NVarChar(50), item.PendingCode ?? null);
                request.input('ReasonPending', sql.NVarChar(50), item.ReasonPending ?? null);
                request.input('Last_Issued', sql.Date, item.Last_Issued ? new Date(item.Last_Issued) : null);
                request.input('Last_StockIn', sql.Date, item.Last_StockIn ? new Date(item.Last_StockIn) : null);
                request.input('Last_Maint', sql.Date, item.Last_Maint ? new Date(item.Last_Maint) : null);
                request.input('Time', sql.DateTime, item.Time ? new Date(item.Time) : null);
                request.input('Operator', sql.NVarChar(50), item.Operator || 'System Upload');
                request.input('FileName', sql.NVarChar(100), item.FileName ?? null);

                await request.execute('trans.Stored_Import_ItemMaster_PMC');
            }

            await transaction.commit();
            res.status(200).json({ message: "Import successful", count: items.length });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (err) {
        console.error("Error importing MasterPH data:", err);
        res.status(500).json({ message: "Error importing data", error: err.message });
    }
};
