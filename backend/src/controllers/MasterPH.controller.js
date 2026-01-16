const { poolPromise } = require("../config/database");
const sql = require("mssql");

exports.getAllMasterPHValues = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
      SELECT 
                 a.[PHGM_ID]
                ,a.[Division_Id]
                ,a.[ItemNo]
                ,a.[ItemName]
                ,a.[Spec_ID]
                ,b.[Spec] AS Spec  -- ดึงชื่อ Spec จากตาราง b (tb_Spec_PMC)
                ,a.[DW]
                ,a.[ClassCode]
                ,a.[ItemType]
                ,a.[Dept]
                ,a.[ProductCode]
                ,a.[Source Code] AS SourceCode
                ,a.[Organisation]
                ,a.[ItemClass]
                ,a.[Commodity]
                ,a.[CL]
                ,a.[AccountCode]
                ,a.[StockType]
                ,a.[MainWH]
                ,a.[StockLoc]
                ,a.[MatL_Type]
                ,a.[StockUnit]
                ,a.[PurchaseUnit1]
                ,a.[Conversion1]
                ,a.[PurchaseUnit2]
                ,a.[Conversion2]
                ,a.[WC_Code]
                ,a.[ModelGroup]
                ,a.[PayDuty]
                ,a.[Line]
                ,a.[HardAllocation]
                ,a.[ECN]
                ,a.[OrderPolicy]
                ,a.[OrderPoint]
                ,a.[WOS]
                ,a.[SaftyCode]
                ,a.[MakerCode]
                ,a.[MakerName]
                ,a.[MakerSpec]
                ,a.[WPC_No]
                ,a.[Vendor]
                ,a.[VendorName]
                ,a.[UnitPrice]
                ,a.[Currency]
                ,a.[PurLeadtime]
                ,a.[Standard_Qty]
                ,a.[BasicOrder]
                ,a.[MaxximumOrder]
                ,a.[MinimumOrder]
                ,a.[Yield]
                ,a.[BOI_Code]
                ,a.[Remark]
                ,a.[SaftyStock]
                ,a.[OrderBal]
                ,a.[Allocated]
                ,a.[OnHand]
                ,a.[PendingCode]
                ,a.[ReasonPending]
                ,a.[Last_Issued]
                ,a.[Last_StockIn]
                ,a.[Last_Maint]
                ,a.[Time]
                ,a.[Operator]
                ,a.[FileName]
                ,a.[ModifyDate]
            FROM [db_Tooling].[master].[tb_Purchase_Item_Master_PMC] a
            LEFT JOIN [master].[tb_Spec_PMC] b ON a.Spec_ID = b.Spec_ID
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

        // --- DEBUG LOGGING ---
        if (items.length > 0) {
            console.log('[Import DEBUG] First item keys:', Object.keys(items[0]));
            console.log('[Import DEBUG] First item data:', items[0]);
        }
        // ---------------------

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
            const checkResult = await pool.request().query("SELECT ItemNo FROM [db_Tooling].[master].[tb_Purchase_Item_Master_PMC]");
            checkResult.recordset.forEach(row => {
                if (row.ItemNo) existingItemsSet.add(row.ItemNo);
            });
            console.log(`[Import] Loaded ${existingItemsSet.size} existing items for check.`);
        } catch (err) {
            console.error("[Import] Failed to pre-fetch existing items:", err);
            // Continue but fallback or fail? Failing safer for consistency, but we'll try to continue.
        }

        // Helper to find value with fuzzy key matching
        const findValue = (item, candidates) => {
            // 1. Exact match
            for (const key of candidates) {
                if (item[key] !== undefined && item[key] !== null) return item[key];
            }
            // 2. Case-insensitive match
            const itemKeys = Object.keys(item);
            for (const key of candidates) {
                const lowerKey = key.toLowerCase();
                const foundKey = itemKeys.find(k => k.toLowerCase() === lowerKey);
                if (foundKey && item[foundKey] !== undefined && item[foundKey] !== null) return item[foundKey];
            }
            // 3. Fuzzy match (remove spaces/symbols)
            for (const key of candidates) {
                const normalizedCandidate = key.toLowerCase().replace(/[^a-z0-9]/g, '');
                const foundKey = itemKeys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedCandidate);
                if (foundKey && item[foundKey] !== undefined && item[foundKey] !== null) return item[foundKey];
            }
            return null;
        };

        const processItem = async (item, index) => {
            try {
                const request = pool.request();

                // --- 1. Map ข้อมูล (Use Fuzzy Search) ---
                request.input('Division_Id', sql.Int, getInt(findValue(item, ['DVS_Id', 'DVS_ID', 'Division_Id'])));

                const itemNoVal = getString(findValue(item, ['Item No.', 'ItemNo', 'ITEM_NO', 'Item Number']));
                request.input('ItemNo', sql.NVarChar(50), itemNoVal);

                request.input('ItemName', sql.NVarChar(50), getString(findValue(item, ['Item Name', 'ItemName', 'ITEM_NAME'])));
                request.input('Spec_ID', sql.Int, getInt(findValue(item, ['Spec_ID', 'SPEC_ID'])));
                request.input('Spec', sql.NVarChar(50), getString(findValue(item, ['Spec', 'SPEC'])));
                request.input('DW', sql.NVarChar(50), getString(findValue(item, ['DW', 'D.W.', 'Drawing'])));
                request.input('ClassCode', sql.NVarChar(50), getString(findValue(item, ['Class Code', 'ClassCode'])));
                request.input('ItemType', sql.NVarChar(50), getString(findValue(item, ['Item Type', 'ItemType'])));
                request.input('Dept', sql.NVarChar(50), getString(findValue(item, ['Dept', 'DEPT_CODE'])));
                request.input('ProductCode', sql.NVarChar(50), getString(findValue(item, ['Product Code', 'ProductCode'])));
                request.input('SourceCode', sql.NVarChar(50), getString(findValue(item, ['Source Code', 'SourceCode'])));
                request.input('Organisation', sql.NVarChar(50), getString(findValue(item, ['Organisation', 'ORGANISATION'])));
                request.input('ItemClass', sql.NVarChar(50), getString(findValue(item, ['Item Class', 'ItemClass'])));
                request.input('Commodity', sql.NVarChar(50), getString(findValue(item, ['Commodity'])));
                request.input('CL', sql.NVarChar(50), getString(findValue(item, ['CL'])));
                request.input('AccountCode', sql.NVarChar(50), getString(findValue(item, ['Account Code', 'AccountCode'])));
                request.input('StockType', sql.NVarChar(50), getString(findValue(item, ['Stock Type', 'StockType'])));
                request.input('MainWH', sql.NVarChar(50), getString(findValue(item, ['Main W/H', 'MainWH', 'Main WH'])));
                request.input('StockLoc', sql.NVarChar(50), getString(findValue(item, ['Stock Loc', 'StockLoc', 'Stock Location'])));
                request.input('MatL_Type', sql.NVarChar(50), getString(findValue(item, ["Mat'L Type", "MatL_Type", "Material Type"])));
                request.input('StockUnit', sql.NVarChar(50), getString(findValue(item, ['Stock Unit', 'StockUnit'])));
                request.input('PurchaseUnit1', sql.NVarChar(50), getString(findValue(item, ['Purchase Unit 1', 'PurchaseUnit1'])));
                request.input('Conversion1', sql.Int, getInt(findValue(item, ['Conversion-1', 'Conversion1'])));
                request.input('PurchaseUnit2', sql.NVarChar(50), getString(findValue(item, ['Purchase Unit 2', 'PurchaseUnit2'])));
                request.input('Conversion2', sql.Int, getInt(findValue(item, ['Conversion-2', 'Conversion2'])));
                request.input('WC_Code', sql.NVarChar(50), getString(findValue(item, ['W/C Code', 'WC_Code'])));
                request.input('ModelGroup', sql.NVarChar(50), getString(findValue(item, ['Model Group', 'ModelGroup'])));
                request.input('PayDuty', sql.Int, getInt(findValue(item, ['Pay Duty', 'PayDuty'])));
                request.input('Line', sql.NVarChar(50), getString(findValue(item, ['Line'])));
                request.input('HardAllocation', sql.NVarChar(50), getString(findValue(item, ['Hard Allocation', 'HardAllocation'])));


                request.input('ECN', sql.Date, getDate(findValue(item, ['E.C.N(DMY)', 'ECN', 'E.C.N'])));
                request.input('OrderPolicy', sql.NVarChar(50), getString(findValue(item, ['Order Policy', 'OrderPolicy'])));
                request.input('OrderPoint', sql.NVarChar(50), getString(findValue(item, ['Order Point', 'OrderPoint'])));
                request.input('WOS', sql.NVarChar(50), getString(findValue(item, ['WOS'])));
                request.input('SaftyCode', sql.NVarChar(50), getString(findValue(item, ['Safty Code', 'SaftyCode'])));
                request.input('MakerCode', sql.NVarChar(50), getString(findValue(item, ['Maker Code', 'MakerCode'])));
                request.input('MakerName', sql.NVarChar(50), getString(findValue(item, ['Maker Name', 'MakerName'])));
                request.input('MakerSpec', sql.NVarChar(50), getString(findValue(item, ['Maker Spec', 'MakerSpec'])));
                request.input('WPC_No', sql.NVarChar(50), getString(findValue(item, ['WPC No.', 'WPC_No', 'WPC No'])));
                request.input('Vendor', sql.NVarChar(50), getString(findValue(item, ['Vendor'])));
                request.input('VendorName', sql.NVarChar(50), getString(findValue(item, ['Vendor Name', 'VendorName'])));

                // Price & Qty
                request.input('UnitPrice', sql.Float, getFloat(findValue(item, ['Unit Price', 'UnitPrice'])));
                request.input('Currency', sql.NVarChar(50), getString(findValue(item, ['Currency'])));
                request.input('PurLeadtime', sql.Int, getInt(findValue(item, ['Pur Leadtime', 'PurLeadtime'])));
                request.input('Standard_Qty', sql.Int, getInt(findValue(item, ['Standard Qty.', 'Standard_Qty', 'Standard Qty'])));
                request.input('BasicOrder', sql.Int, getInt(findValue(item, ['Basic Order', 'BasicOrder'])));
                request.input('MaxximumOrder', sql.Int, getInt(findValue(item, ['Maxximum Order', 'MaxximumOrder'])));
                request.input('MinimumOrder', sql.Int, getInt(findValue(item, ['Minimum Order', 'MinimumOrder'])));
                request.input('Yield', sql.Decimal(10, 2), getFloat(findValue(item, ['Yield(%)', 'Yield'])));
                request.input('BOI_Code', sql.NVarChar(50), getString(findValue(item, ['BOI Code', 'BOI_Code'])));
                request.input('Remark', sql.NVarChar(50), getString(findValue(item, ['Remark'])));
                request.input('SaftyStock', sql.Int, getInt(findValue(item, ['Safty Stock', 'SaftyStock'])));
                request.input('OrderBal', sql.Int, getInt(findValue(item, ['Order Bal', 'OrderBal'])));
                request.input('Allocated', sql.Int, getInt(findValue(item, ['Allocated'])));
                request.input('OnHand', sql.Int, getInt(findValue(item, ['On Hand', 'OnHand'])));
                request.input('PendingCode', sql.NVarChar(50), getString(findValue(item, ['Pending Code', 'PendingCode'])));
                request.input('ReasonPending', sql.NVarChar(50), getString(findValue(item, ['Reason Pending', 'ReasonPending'])));
                request.input('Last_Issued', sql.Date, getDate(findValue(item, ['Last Issued (DMY)', 'Last_Issued'])));
                request.input('Last_StockIn', sql.Date, getDate(findValue(item, ['Last Stock-in (DMY)', 'Last_StockIn'])));
                request.input('Last_Maint', sql.Date, getDate(findValue(item, ['Last Maint (DMY)', 'Last_Maint'])));
                request.input('Operator', sql.NVarChar(50), getString(findValue(item, ['Operator'])) || 'System Upload');
                request.input('FileName', sql.NVarChar(100), getString(findValue(item, ['FileName'])));

                // Logic: Insert or Update
                const itemNoCheck = itemNoVal;

                // VALIDATION: ถ้าไม่มี ItemNo ให้ข้ามไปเลย ไม่ไม่ต้องทำต่อ
                if (!itemNoCheck) {
                    console.warn(`[Import] Insert Ignored at row ${index}: ItemNo is missing.`);
                    return;
                }

                let spName = '[db_Tooling].[trans].[Stored_Import_ItemMaster_Test]';

                // เช็คว่ามีใน DB ไหม ถ้ามีให้ไปใช้ SP Update ที่แก้แล้ว
                if (existingItemsSet.has(itemNoCheck)) {
                    spName = '[db_Tooling].[trans].[Stored_ItemMaster_PH_PMC_Fixed_Update]'; // ใช้ชื่อ SP ที่เรามั่นใจ
                    // หรือถ้าท่านแก้ชื่อ SP เดิมแล้ว ก็ใช้ชื่อเดิมได้ '[trans].[Stored_ItemMaster_PH_PMC_Update]'
                    // เพื่อความชัวร์ ผมแนะนำให้ใช้ชื่อเดิมที่ท่านน่าจะแก้ไปแล้ว
                    spName = '[db_Tooling].[trans].[Stored_ItemMaster_PH_PMC_Update]';
                }

                await request.execute(spName);
                successCount++;
            } catch (err) {
                failCount++;
                errors.push({ index, error: err.message, item_no: item['Item No.'] ?? item.ItemNo });
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

exports.importIReport = async (req, res) => {
    try {
        const items = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).send({ message: "No data provided." });
        }

        const pool = await poolPromise;
        const totalItems = items.length;
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        console.log(`[Import IReport] Starting import of ${totalItems} items...`);

        // Helper to find value with fuzzy key matching
        const findValue = (item, candidates) => {
            const itemKeys = Object.keys(item);
            // 1. Exact match
            for (const key of candidates) {
                if (item[key] !== undefined && item[key] !== null) return item[key];
            }
            // 2. Case-insensitive
            for (const key of candidates) {
                const lowerKey = key.toLowerCase();
                const foundKey = itemKeys.find(k => k.toLowerCase() === lowerKey);
                if (foundKey && item[foundKey] !== undefined && item[foundKey] !== null) return item[foundKey];
            }
            // 3. Fuzzy match
            for (const key of candidates) {
                const normalizedCandidate = key.toLowerCase().replace(/[^a-z0-9]/g, '');
                const foundKey = itemKeys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedCandidate);
                if (foundKey && item[foundKey] !== undefined && item[foundKey] !== null) return item[foundKey];
            }
            return null;
        };

        const getInt = (val) => (val === "" || val == null || isNaN(Number(val))) ? 0 : Number(val);
        const getFloat = (val) => (val === "" || val == null || isNaN(Number(val))) ? 0 : Number(val);
        const getString = (val) => (val === "" || val == null) ? null : String(val).trim();
        const getStringSafe = (val, def = '') => (val === "" || val == null) ? def : String(val).trim();
        const getDate = (val) => {
            if (!val) return new Date();
            const d = new Date(val);
            return isNaN(d.getTime()) ? new Date() : d;
        }

        // Batch Processing Configuration
        const BATCH_SIZE = 1000; // Process 1000 items at a time

        const processItem = async (item, index) => {
            try {
                const request = pool.request();

                // Map based on SP Params
                request.input('_DIVISION', sql.NVarChar(50), getStringSafe(findValue(item, ['DIVISION', 'Division']), 'Unknown'));
                request.input('_DEPARTMENT', sql.NVarChar(50), getStringSafe(findValue(item, ['DEPARTMENT', 'Department']), 'Unknown'));
                request.input('_ITEM_NO', sql.NVarChar(50), getStringSafe(findValue(item, ['ITEM_NO', 'Item No', 'Item No.']), 'Unknown'));
                request.input('_ITEM_NAME', sql.NVarChar(50), getStringSafe(findValue(item, ['ITEM_NAME', 'Item Name']), 'Unknown'));
                request.input('_SPEC', sql.NVarChar(50), getStringSafe(findValue(item, ['SPEC', 'Spec']), '-'));

                request.input('_PO_NO', sql.NVarChar(50), getString(findValue(item, ['PO_NO', 'PO No'])));
                request.input('_MO_NO', sql.NVarChar(50), getString(findValue(item, ['MO_NO', 'MO No'])));
                request.input('_ACCOUNT_CODE', sql.NVarChar(50), getString(findValue(item, ['ACCOUNT_CODE', 'Account Code'])));

                request.input('_QUANTITY', sql.Int, getInt(findValue(item, ['QUANTITY', 'Quantity', 'Qty'])));
                request.input('_AMOUNT', sql.Float, getFloat(findValue(item, ['AMOUNT', 'Amount'])));

                request.input('_VENDOR', sql.NVarChar(50), getString(findValue(item, ['VENDOR', 'VendorCode', 'Vendor'])));
                request.input('_VENDOR_NAME', sql.NVarChar(50), getString(findValue(item, ['VENDOR_NAME', 'Vendor Name'])));
                request.input('_DOCUMENT_NO', sql.NVarChar(50), getString(findValue(item, ['DOCUMENT_NO', 'Document No'])));

                request.input('_TRANSACTION_DATE', sql.DateTime, getDate(findValue(item, ['TRANSACTION_DATE', 'Transaction Date'])));

                request.input('_ORGANIZE_CODE', sql.NVarChar(50), getString(findValue(item, ['ORGANIZE_CODE', 'Organize Code'])));
                request.input('_ORGANIZE_NAME', sql.NVarChar(50), getString(findValue(item, ['ORGANIZE_NAME', 'Organize Name'])));

                request.input('_DATA_TYPE', sql.NVarChar(50), getStringSafe(findValue(item, ['DATA_TYPE', 'Data Type']), 'Upload'));
                request.input('_DATA_GROUP', sql.NVarChar(50), getStringSafe(findValue(item, ['DATA_GROUP', 'Data Group']), 'General'));

                request.input('_REPLY_DATE', sql.NVarChar(50), getStringSafe(findValue(item, ['REPLY_DATE', 'Reply Date']), '-'));
                request.input('_LAST_UPDATE_OPERATOR', sql.NVarChar(50), getStringSafe(findValue(item, ['LAST_UPDATE_OPERATOR', 'Operator', 'Update By']), 'System'));
                request.input('_DESC', sql.NVarChar(50), getString(findValue(item, ['DESC', 'Description', 'Remark'])));

                // Execute in db_Cost_Data_Centralized
                await request.execute('[db_Cost_Data_Centralized].[trans].[Stored_tb_FactorySupplyExpense_History_Insert]');
                successCount++;
            } catch (err) {
                console.error(`[Import IReport] Error at row ${index}:`, err);
                errorCount++;
                errors.push(`Row ${index + 1}: ${err.message}`);
            }
        };

        // Execute in batches
        for (let i = 0; i < totalItems; i += BATCH_SIZE) {
            const batch = items.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map((item, batchIndex) => processItem(item, i + batchIndex));
            await Promise.all(batchPromises);

            // Optional: Log progress
            if ((i + BATCH_SIZE) % 1000 < BATCH_SIZE) {
                console.log(`[Import IReport] Progress: ${Math.min(i + BATCH_SIZE, totalItems)}/${totalItems} finished.`);
            }
        }

        console.log(`[Import IReport] Finished. Success: ${successCount}, Errors: ${errorCount}`);

        if (errorCount > 0) {
            res.status(207).send({
                message: `Imported ${successCount} items. Failed ${errorCount} items.`,
                count: successCount,
                errors: errors
            });
        } else {
            res.status(200).send({ message: "Import successful", count: successCount });
        }

    } catch (err) {
        console.error("Import IReport Error:", err);
        res.status(500).send({ message: "Internal Server Error", error: err.message });
    }
};