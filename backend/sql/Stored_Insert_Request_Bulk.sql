USE [db_Tooling]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:      Antigravity
-- Create date: 2026-02-11
-- Description: Bulk Insert for Tool Requests
--   Routes to 3 tables based on CASE + ToolType:
--     1) CASE = 'SET'         → tb_IssueCaseSetup_Request_Document (ทั้ง Cutting & Setup)
--     2) CASE != 'SET' + Cutting → tb_IssueCuttingTool_Request_Document  
--     3) CASE != 'SET' + Setup   → tb_IssueSetupTool_Request_Document
-- =============================================
CREATE OR ALTER PROCEDURE [trans].[Stored_Insert_Request_Bulk]
    @ItemsJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Parse JSON → Temp Table (รวมทุก field ที่อาจมี)
        SELECT *
        INTO #AllItems
        FROM OPENJSON(@ItemsJson)
        WITH (
            DocNo       NVARCHAR(50),
            Division    NVARCHAR(50),
            Status      NVARCHAR(50),
            Requester   NVARCHAR(50),
            Fac         INT,
            [CASE]      NVARCHAR(50),
            PartNo      NVARCHAR(50),
            ItemNo      NVARCHAR(50),
            SPEC        NVARCHAR(50),
            Process     NVARCHAR(50),
            MCType      NVARCHAR(50),
            MCNo        NVARCHAR(MAX),
            ON_HAND     INT,
            Req_QTY     INT,
            QTY         INT,
            DueDate     DATE,
            PhoneNo     NVARCHAR(50),
            PathDwg     NVARCHAR(255),
            ItemName    NVARCHAR(200),
            ToolType    NVARCHAR(50),   -- 'CuttingTool' or 'SetupTool'
            MFGOrderNo  NVARCHAR(50),   -- NEW Field
            MR_No       NVARCHAR(50)    -- NEW Field: yyMMdd
        );

        DECLARE @InsertedCaseSetup INT = 0;
        DECLARE @InsertedCutting INT = 0;
        DECLARE @InsertedSetup INT = 0;

        -- =============================================
        -- 2. CASE SET → tb_IssueCaseSetup_Request_Document
        -- =============================================
        INSERT INTO [dbo].[tb_IssueCaseSetup_Request_Document]
            (DocNo, Status, Requester, Division, Fac, [CASE], PartNo, ItemNo, SPEC, Process, MCType, MCNo, ON_HAND, Req_QTY, QTY, DueDate, PhoneNo, ItemName, MFGOrderNo, MR_No)
        SELECT 
            DocNo, Status, Requester, Division, Fac, [CASE], PartNo, ItemNo, SPEC, Process, MCType, MCNo, ON_HAND, Req_QTY, QTY, DueDate, PhoneNo, ItemName, MFGOrderNo, MR_No
        FROM #AllItems
        WHERE [CASE] = 'SET';

        SET @InsertedCaseSetup = @@ROWCOUNT;

        -- =============================================
        -- 3. CASE != SET + CuttingTool → tb_IssueCuttingTool_Request_Document
        -- =============================================
        INSERT INTO [dbo].[tb_IssueCuttingTool_Request_Document]
            (DocNo, Status, Requester, Division, Fac, [CASE], PartNo, ItemNo, SPEC, Process, MCType, MCNo, ON_HAND, Req_QTY, QTY, DueDate, PhoneNo, PathDwg, ItemName, MFGOrderNo, MR_No)
        SELECT 
            DocNo, Status, Requester, Division, Fac, [CASE], PartNo, ItemNo, SPEC, Process, MCType, MCNo, ON_HAND, Req_QTY, QTY, DueDate, PhoneNo, PathDwg, ItemName, MFGOrderNo, MR_No
        FROM #AllItems
        WHERE [CASE] <> 'SET' AND ToolType = 'CuttingTool';

        SET @InsertedCutting = @@ROWCOUNT;

        -- =============================================
        -- 4. CASE != SET + SetupTool → tb_IssueSetupTool_Request_Document
        -- =============================================
        INSERT INTO [dbo].[tb_IssueSetupTool_Request_Document]
            (DocNo, Status, Requester, Division, Fac, [CASE], PartNo, ItemNo, SPEC, Process, MCType, MCNo, ON_HAND, Req_QTY, QTY, DueDate, PhoneNo, ItemName, MFGOrderNo, MR_No)
        SELECT 
            DocNo, Status, Requester, Division, Fac, [CASE], PartNo, ItemNo, SPEC, Process, MCType, MCNo, ON_HAND, Req_QTY, QTY, DueDate, PhoneNo, ItemName, MFGOrderNo, MR_No
        FROM #AllItems
        WHERE [CASE] <> 'SET' AND ToolType = 'SetupTool';

        SET @InsertedSetup = @@ROWCOUNT;

        -- 5. Return Summary
        SELECT 
            (@InsertedCaseSetup + @InsertedCutting + @InsertedSetup) AS InsertedCount,
            @InsertedCaseSetup AS CaseSetupCount,
            @InsertedCutting AS CuttingCount,
            @InsertedSetup AS SetupCount;

        DROP TABLE #AllItems;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO
