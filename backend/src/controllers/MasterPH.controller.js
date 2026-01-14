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
        const items = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Invalid data format. Expected an array of items." });
        }

        const pool = await poolPromise;
        const totalItems = items.length;

        // --- Parallel Processing Config ---
        const BATCH_SIZE = 50; // Process 50 items concurrently
        let successCount = 0;
        let failCount = 0;
        const errors = [];

        console.log(`[Import] Starting import of ${totalItems} items...`);

        // ฟังก์ชันช่วยตรวจสอบค่าว่าง (Sanitize Helper)
        const getInt = (val) => (val === "" || val == null || isNaN(Number(val))) ? null : Number(val);
        const getFloat = (val) => (val === "" || val == null || isNaN(Number(val))) ? null : Number(val);
        const getString = (val) => (val === "" || val == null) ? null : String(val).trim();
        const getDate = (val) => {
            if (!val) return null;
            const d = new Date(val);
            return isNaN(d.getTime()) ? null : d;
        };

        // OPTIMIZATION 1: Pre-fetch all existing ItemNos
        const existingItemsSet = new Set();
        try {
            const checkResult = await pool.request().query("SELECT ItemNo FROM [db_Cost_Data_Centralized].[master].[tb_Purchase_Item_Master_PMC]");
            checkResult.recordset.forEach(row => {
                if (row.ItemNo) existingItemsSet.add(row.ItemNo);
            });
            console.log(`[Import] Loaded ${existingItemsSet.size} existing items for check.`);
        } catch (err) {
            console.error("[Import] Failed to pre-fetch existing items:", err);
            // Continue but fallback or fail? Failing safer for consistency, but we'll try to continue.
        }

        // Helper to process a single item
        const processItem = async (item, index) => {
            try {
                const request = pool.request(); // New request per item for parallelism

                // Inputs
                request.input('DVS_Id', sql.Int, getInt(item.DVS_Id ?? item.DVS_ID));
                request.input('ItemNo', sql.NVarChar(50), getString(item.ItemNo ?? item.ITEM_NO));
                request.input('ItemName', sql.NVarChar(50), getString(item.ItemName ?? item.ITEM_NAME));
                request.input('Spec_ID', sql.Int, getInt(item.Spec_ID ?? item.SPEC_ID));
                request.input('Spec', sql.NVarChar(50), getString(item.Spec ?? item.SPEC));
                request.input('DW', sql.NVarChar(50), getString(item.DW));
                request.input('ClassCode', sql.NVarChar(50), getString(item.ClassCode ?? item.CLASS_CODE));
                request.input('ItemType', sql.NVarChar(50), getString(item.ItemType ?? item.ITEM_TYPE));
                request.input('Dept', sql.NVarChar(50), getString(item.Dept ?? item.DEPT_CODE));
                request.input('ProductCode', sql.NVarChar(50), getString(item.ProductCode ?? item.PRODUCT_CODE));

                request.input('SourceCode', sql.NVarChar(50), getString(item['Source Code'] ?? item.SourceCode ?? item.SOURCE_CODE));
                request.input('Organisation', sql.NVarChar(50), getString(item.Organisation ?? item.ORGANISATION ?? item.ORGANISATION_CODE));
                request.input('ItemClass', sql.NVarChar(50), getString(item.ItemClass ?? item.ITEM_CLASS));
                request.input('Commodity', sql.NVarChar(50), getString(item.Commodity ?? item.COMMODITY));
                request.input('CL', sql.NVarChar(50), getString(item.CL));
                request.input('AccountCode', sql.NVarChar(50), getString(item.AccountCode ?? item.ACCOUNT_CODE));
                request.input('StockType', sql.NVarChar(50), getString(item.StockType ?? item.STOCK_TYPE));
                request.input('MainWH', sql.NVarChar(50), getString(item.MainWH ?? item.MAIN_WH));
                request.input('StockLoc', sql.NVarChar(50), getString(item.StockLoc ?? item.STOCK_LOC));
                request.input('MatL_Type', sql.NVarChar(50), getString(item.MatL_Type ?? item.MATL_TYPE ?? item.MAT_L_TYPE));
                request.input('StockUnit', sql.NVarChar(50), getString(item.StockUnit ?? item.STOCK_UNIT));
                request.input('PurchaseUnit1', sql.NVarChar(50), getString(item.PurchaseUnit1 ?? item.PURCHASE_UNIT_1 ?? item.PURUNIT1));
                request.input('Conversion1', sql.Int, getInt(item.Conversion1 ?? item.CONVERSION_1 ?? item.CONV1));
                request.input('PurchaseUnit2', sql.NVarChar(50), getString(item.PurchaseUnit2 ?? item.PURCHASE_UNIT_2 ?? item.PURUNIT2));
                request.input('Conversion2', sql.Int, getInt(item.Conversion2 ?? item.CONVERSION_2 ?? item.CONV2));
                request.input('WC_Code', sql.NVarChar(50), getString(item.WC_Code ?? item.WC_CODE));
                request.input('ModelGroup', sql.NVarChar(50), getString(item.ModelGroup ?? item.MODEL_GROUP));
                request.input('PayDuty', sql.Int, getInt(item.PayDuty ?? item.PAY_DUTY));
                request.input('Line', sql.NVarChar(50), getString(item.Line ?? item.LINE));
                request.input('HardAllocation', sql.NVarChar(50), getString(item.HardAllocation ?? item.HARD_ALLOCATION));
                request.input('ECN', sql.Date, getDate(item.ECN ?? item.E_C_N_DATE));
                request.input('OrderPolicy', sql.NVarChar(50), getString(item.OrderPolicy ?? item.ORDER_POLICY ?? item.ORD_POLICY));
                request.input('OrderPoint', sql.NVarChar(50), getString(item.OrderPoint ?? item.ORDER_POINT));
                request.input('WOS', sql.NVarChar(50), getString(item.WOS));
                request.input('SaftyCode', sql.NVarChar(50), getString(item.SaftyCode ?? item.SAFTY_CODE ?? item.SAFTY));
                request.input('MakerCode', sql.NVarChar(50), getString(item.MakerCode ?? item.MAKER_CODE));
                request.input('MakerName', sql.NVarChar(50), getString(item.MakerName ?? item.MAKER_NAME));
                request.input('MakerSpec', sql.NVarChar(50), getString(item.MakerSpec ?? item.MAKER_SPEC));
                request.input('WPC_No', sql.NVarChar(50), getString(item.WPC_No ?? item.WPC_NO));
                request.input('Vendor', sql.NVarChar(50), getString(item.Vendor ?? item.VENDOR ?? item.VENDOR_CODE));
                request.input('VendorName', sql.NVarChar(50), getString(item.VendorName ?? item.VENDOR_NAME));
                request.input('UnitPrice', sql.Float, getFloat(item.UnitPrice ?? item.UNIT_PRICE));
                request.input('Currency', sql.NVarChar(50), getString(item.Currency ?? item.CURRENCY));
                request.input('PurLeadtime', sql.Int, getInt(item.PurLeadtime ?? item.PUR_LEADTIME ?? item.PURCHASE_LEADTIME));
                request.input('Standard_Qty', sql.Int, getInt(item.Standard_Qty ?? item.STANDARD_QTY));
                request.input('BasicOrder', sql.Int, getInt(item.BasicOrder ?? item.BASIC_ORDER));
                request.input('MaxximumOrder', sql.Int, getInt(item.MaxximumOrder ?? item.MAXXIMUM_ORDER ?? item.MAXIMUM_ORDER_QTY));
                request.input('MinimumOrder', sql.Int, getInt(item.MinimumOrder ?? item.MINIMUM_ORDER ?? item.MINIMUM_ORDER_QTY));
                request.input('Yield', sql.Decimal(10, 2), getFloat(item.Yield ?? item.YIELD ?? item.YIELD_RATE));
                request.input('BOI_Code', sql.NVarChar(50), getString(item.BOI_Code ?? item.BOI_CODE));
                request.input('Remark', sql.NVarChar(50), getString(item.Remark ?? item.REMARK));
                request.input('SaftyStock', sql.Int, getInt(item.SaftyStock ?? item.SAFTY_STOCK ?? item.SAFETY_STOCK));
                request.input('OrderBal', sql.Int, getInt(item.OrderBal ?? item.ORDER_BAL));
                request.input('Allocated', sql.Int, getInt(item.Allocated ?? item.ALLOCATED ?? item.ALLOCATED_QTY));
                request.input('OnHand', sql.Int, getInt(item.OnHand ?? item.ON_HAND ?? item.ON_HAND_QTY));
                request.input('PendingCode', sql.NVarChar(50), getString(item.PendingCode ?? item.PENDING_CODE));
                request.input('ReasonPending', sql.NVarChar(50), getString(item.ReasonPending ?? item.REASON_PENDING));
                request.input('Last_Issued', sql.Date, getDate(item.Last_Issued ?? item.LAST_ISSUED_DATE));
                request.input('Last_StockIn', sql.Date, getDate(item.Last_StockIn ?? item.LAST_STOCK_IN_DATE));
                request.input('Last_Maint', sql.Date, getDate(item.Last_Maint ?? item.MAINT_DMY));
                request.input('Time', sql.DateTime, getDate(item.Time));
                request.input('Operator', sql.NVarChar(50), getString(item.Operator) || 'System Upload');
                request.input('FileName', sql.NVarChar(100), getString(item.FileName));

                // Logic: Insert or Update
                const itemNoCheck = getString(item.ItemNo ?? item.ITEM_NO);
                let spName = '[db_Cost_Data_Centralized].[trans].[Stored_Import_ItemMaster_PMC]';

                if (itemNoCheck && existingItemsSet.has(itemNoCheck)) {
                    spName = '[db_Cost_Data_Centralized].[trans].[Stored_ItemMaster_PH_PMC_Update]';
                }

                await request.execute(spName);
                successCount++;
            } catch (err) {
                failCount++;
                errors.push({ index, error: err.message, item_no: item.ItemNo ?? item.ITEM_NO });
                console.error(`[Import] Error at row ${index}: ${err.message}`);
            }
        };

        // OPTIMIZATION 2: Parallel Processing in Batches
        for (let i = 0; i < totalItems; i += BATCH_SIZE) {
            const batch = items.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map((item, batchIndex) => processItem(item, i + batchIndex));

            await Promise.all(batchPromises);

            // Progress Log
            if ((i + BATCH_SIZE) % 1000 < BATCH_SIZE) {
                console.log(`[Import] Progress: ${Math.min(i + BATCH_SIZE, totalItems)}/${totalItems} finished.`);
            }
        }

        console.log(`[Import] Finished. Success: ${successCount}, Failed: ${failCount}`);

        if (failCount > 0) {
            res.status(200).json({
                message: `Completed with warnings. Success: ${successCount}, Failed: ${failCount}`,
                count: successCount,
                errors: errors.slice(0, 10) // Return top 10 errors
            });
        } else {
            res.status(200).json({ message: "Import successful", count: successCount });
        }

    } catch (err) {
        console.error("Error importing MasterPH data:", err);
        res.status(500).json({ message: "Error importing data", error: err.message });
    }
};