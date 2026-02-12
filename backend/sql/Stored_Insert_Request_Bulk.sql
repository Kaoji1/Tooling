USE [db_Tooling]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:      Antigravity
-- Create date: 2026-02-12
-- Description: Bulk Insert for Tool Requests (Refactored)
--   Routes to 2 tables based on ToolType (regardless of CASE):
--     1) ToolType = 'CuttingTool' → tb_IssueCuttingTool_Request_Document (ToolingType = 'CuttingTool')
--     2) ToolType = 'SetupTool'   → tb_IssueSetupTool_Request_Document   (ToolingType = 'SetupTool')
--     * CASE 'SET' logic is merged into these two tables.
-- =============================================
CREATE OR ALTER PROCEDURE [trans].[Stored_Insert_Request_Bulk]
    @ItemsJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Parse JSON → Temp Table
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
            MFGOrderNo  NVARCHAR(50),   
            MR_No       NVARCHAR(50)
        );

        DECLARE @InsertedCutting INT = 0;
        DECLARE @InsertedSetup INT = 0;

        -- =============================================
        -- 2. ToolType = 'CuttingTool' → tb_IssueCuttingTool_Request_Document
        --    (Include CASE = 'SET' if ToolType is Cutting)
        -- =============================================
        INSERT INTO [dbo].[tb_IssueCuttingTool_Request_Document]
            (DocNo, Status, Requester, Division, Fac, [CASE], PartNo, ItemNo, SPEC, Process, MCType, MCNo, ON_HAND, Req_QTY, QTY, DueDate, PhoneNo, PathDwg, ItemName, MFGOrderNo, MR_No, ToolingType)
        SELECT 
            DocNo, Status, Requester, Division, Fac, [CASE], PartNo, ItemNo, SPEC, Process, MCType, MCNo, ON_HAND, Req_QTY, QTY, DueDate, PhoneNo, PathDwg, ItemName, MFGOrderNo, MR_No, 'CuttingTool'
        FROM #AllItems
        WHERE ToolType = 'CuttingTool';

        SET @InsertedCutting = @@ROWCOUNT;

        -- =============================================
        -- 3. ToolType = 'SetupTool' → tb_IssueSetupTool_Request_Document
        --    (Include CASE = 'SET' if ToolType is Setup)
        -- =============================================
        INSERT INTO [dbo].[tb_IssueSetupTool_Request_Document]
            (DocNo, Status, Requester, Division, Fac, [CASE], PartNo, ItemNo, SPEC, Process, MCType, MCNo, ON_HAND, Req_QTY, QTY, DueDate, PhoneNo, ItemName, MFGOrderNo, MR_No, ToolingType)
        SELECT 
            DocNo, Status, Requester, Division, Fac, [CASE], PartNo, ItemNo, SPEC, Process, MCType, MCNo, ON_HAND, Req_QTY, QTY, DueDate, PhoneNo, ItemName, MFGOrderNo, MR_No, 'SetupTool'
        FROM #AllItems
        WHERE ToolType = 'SetupTool';

        SET @InsertedSetup = @@ROWCOUNT;

        -- 4. Return Summary
        SELECT 
            (@InsertedCutting + @InsertedSetup) AS InsertedCount,
            0 AS CaseSetupCount, -- Deprecated
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
