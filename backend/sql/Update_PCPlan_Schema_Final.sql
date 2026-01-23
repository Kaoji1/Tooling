-- update_pcplan_schema_final.sql
use [db_Tooling]
GO

-- 1. Add PlanStatus Column (if missing)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[master].[tb_PC_Plan]') AND name = 'PlanStatus')
BEGIN
    ALTER TABLE [master].[tb_PC_Plan] ADD [PlanStatus] NVARCHAR(20) DEFAULT 'Active';
END
GO
UPDATE [master].[tb_PC_Plan] SET PlanStatus = 'Active' WHERE PlanStatus IS NULL;
GO

-- 2. Backfill GroupId for existing records (Critical for history tracking)
UPDATE [master].[tb_PC_Plan] 
SET GroupId = NEWID() 
WHERE GroupId IS NULL;
GO

-- =============================================
-- SP 1: GM Mode - Simple Overwrite / Merge
-- Logic: If exists (same Date, MC, Part, Process) -> Update. Else -> Insert.
-- No History kept.
-- =============================================
CREATE OR ALTER PROCEDURE [trans].[Stored_PCPlan_Insert_GM]
    @PlanDate DATE,
    @Employee_ID NVARCHAR(50),
    @Division NVARCHAR(50),
    @MC_Type NVARCHAR(50),
    @Facility NVARCHAR(50),
    @Before_Part NVARCHAR(50),
    @Process NVARCHAR(50),
    @MC_No NVARCHAR(50),
    @PartNo NVARCHAR(50),
    @QTY FLOAT,
    @Time INT,
    @Comment NVARCHAR(255),
    @Path_Dwg NVARCHAR(255) = NULL,    -- New Param
    @Path_Layout NVARCHAR(255) = NULL, -- New Param
    @Path_IIQC NVARCHAR(255) = NULL    -- New Param
AS
BEGIN
    -- Check if exists
    DECLARE @ExistingID INT = NULL;
    
    SELECT TOP 1 @ExistingID = Plan_ID 
    FROM [master].[tb_PC_Plan]
    WHERE PlanDate = @PlanDate 
      AND MC_Type = @MC_Type 
      AND PartNo = @PartNo
      AND Process = @Process
      AND Division = @Division;

    IF @ExistingID IS NOT NULL
    BEGIN
        -- Update
        UPDATE [master].[tb_PC_Plan]
        SET QTY = @QTY,
            [Time] = @Time,
            Comment = @Comment,
            Employee_ID = @Employee_ID,
            Facility = @Facility,
            Before_Part = @Before_Part,
            MC_No = @MC_No,
            Path_Dwg = @Path_Dwg,         -- Update Path
            Path_Layout = @Path_Layout,   -- Update Path
            Path_IIQC = @Path_IIQC,       -- Update Path
            DateTime_Record = GETDATE()
        WHERE Plan_ID = @ExistingID;
    END
    ELSE
    BEGIN
        -- Insert
        INSERT INTO [master].[tb_PC_Plan] (
            PlanDate, Employee_ID, Division, MC_Type, Facility, 
            Before_Part, Process, MC_No, PartNo, QTY, [Time], 
            Comment, Revision, GroupId, IsActive, PlanStatus,
            Path_Dwg, Path_Layout, Path_IIQC -- Add Columns
        )
        VALUES (
            @PlanDate, @Employee_ID, @Division, @MC_Type, @Facility, 
            @Before_Part, @Process, @MC_No, @PartNo, @QTY, @Time, 
            @Comment, 0, NEWID(), 1, 'Active',
            @Path_Dwg, @Path_Layout, @Path_IIQC -- Add Values
        );
    END
END
GO

-- =============================================
-- SP 2: PMC Mode - Snapshot Revision
-- Logic: 
-- 1. Calculate New Rev for the Month.
-- 2. "Lock" the snapshot by copying ALL active items from Main Rev to New Rev.
-- 3. If incoming item matches existing -> Update data in New Rev.
-- 4. If incoming item is new -> Insert into New Rev.
-- INPUT: JSON String of items to process for this batch.
-- =============================================
CREATE OR ALTER PROCEDURE [trans].[Stored_PCPlan_Insert_PMC_Snapshot]
    @JsonData NVARCHAR(MAX),  -- Input List as JSON
    @Division NVARCHAR(50),
    @TargetDate DATE          -- We use Month/Year from this
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Determine Target Month scope
    DECLARE @Month INT = MONTH(@TargetDate);
    DECLARE @Year INT = YEAR(@TargetDate);

    -- 2. Find Current Max Revision for this Month/Division
    DECLARE @CurrentRev INT = 0;
    SELECT @CurrentRev = ISNULL(MAX(Revision), 0)
    FROM [master].[tb_PC_Plan]
    WHERE Division = @Division
      AND MONTH(PlanDate) = @Month
      AND YEAR(PlanDate) = @Year;

    DECLARE @NewRev INT = @CurrentRev + 1;

    -- 3. Parse JSON into Temp Table
    SELECT * INTO #IncomingData
    FROM OPENJSON(@JsonData)
    WITH (
        PlanDate DATE,
        Employee_ID NVARCHAR(50),
        MC_Type NVARCHAR(50),
        Facility NVARCHAR(50),
        Before_Part NVARCHAR(50),
        Process NVARCHAR(50),
        MC_No NVARCHAR(50),
        PartNo NVARCHAR(50),
        QTY FLOAT,
        [Time] INT,
        Comment NVARCHAR(255),
        PlanStatus NVARCHAR(20),
        GroupId NVARCHAR(50),
        Path_Dwg NVARCHAR(255),    -- Capture Path
        Path_Layout NVARCHAR(255), -- Capture Path
        Path_IIQC NVARCHAR(255)    -- Capture Path
    );

    -- 4. CREATE SNAPSHOT (Rev N -> Rev N+1)
    
    -- 4a. Copy PREVIOUS items that are NOT in Incoming (Preserve Unchanged Items)
    -- Logic: Exclude if GroupId matches (explicit update) OR Key matches (new upload update)
    INSERT INTO [master].[tb_PC_Plan] (
        PlanDate, Employee_ID, Division, MC_Type, Facility, 
        Before_Part, Process, MC_No, PartNo, QTY, [Time], 
        Comment, Revision, GroupId, IsActive, PlanStatus,
        Path_Dwg, Path_Layout, Path_IIQC -- Copy Path
    )
    SELECT 
        PlanDate, Employee_ID, Division, MC_Type, Facility, 
        Before_Part, Process, MC_No, PartNo, QTY, [Time], 
        Comment, @NewRev, GroupId, 1, PlanStatus,
        Path_Dwg, Path_Layout, Path_IIQC -- Copy Path
    FROM [master].[tb_PC_Plan] Old
    WHERE Division = @Division
      AND MONTH(PlanDate) = @Month 
      AND YEAR(PlanDate) = @Year
      AND Revision = @CurrentRev
      AND IsActive = 1
      AND NOT EXISTS (
          SELECT 1 FROM #IncomingData New
          WHERE 
            -- Match by Explicit GroupId (Manual Edit)
            (New.GroupId IS NOT NULL AND New.GroupId = Old.GroupId)
            OR
            -- Match by Key (File Upload where GroupId might be null)
            (New.PlanDate = Old.PlanDate
             AND New.MC_Type = Old.MC_Type
             AND New.PartNo = Old.PartNo
             AND New.Process = Old.Process)
      );

    -- 4b. Insert INCOMING items
    INSERT INTO [master].[tb_PC_Plan] (
        PlanDate, Employee_ID, Division, MC_Type, Facility, 
        Before_Part, Process, MC_No, PartNo, QTY, [Time], 
        Comment, Revision, GroupId, IsActive, PlanStatus,
        Path_Dwg, Path_Layout, Path_IIQC -- Insert Path
    )
    SELECT 
        New.PlanDate, New.Employee_ID, @Division, New.MC_Type, New.Facility, 
        New.Before_Part, New.Process, New.MC_No, New.PartNo, New.QTY, New.[Time], 
        New.Comment, 
        @NewRev, 
        -- Priority: 1. Use Provided GroupId. 2. Find Existing by Key. 3. New GroupId.
        ISNULL(
            New.GroupId, 
            ISNULL((
                SELECT TOP 1 GroupId 
                FROM [master].[tb_PC_Plan] Old
                WHERE Old.Division = @Division
                  AND Old.PlanDate = New.PlanDate
                  AND Old.MC_Type = New.MC_Type
                  AND Old.PartNo = New.PartNo
                  AND Old.Process = New.Process
            ), NEWID())
        ), 
        1,
        New.PlanStatus,
        New.Path_Dwg, New.Path_Layout, New.Path_IIQC -- Insert Path
    FROM #IncomingData New;

    -- Cleanup
    DROP TABLE #IncomingData;
END
GO

-- 3. Update Query SP to filter by Latest Revision per GroupId OR Show All
CREATE OR ALTER PROCEDURE [trans].[Stored_PCPlan_Query]
    @ShowHistory BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    IF @ShowHistory = 1
    BEGIN
        -- Show ALL records (Active + History)
        SELECT *
        FROM [master].[tb_PC_Plan]
        WHERE IsActive = 1
        -- Order by Date, then Group items together, then Latest Rev first
        ORDER BY PlanDate DESC, GroupId, Revision DESC;
    END
    ELSE
    BEGIN
        -- Show LATEST only
        WITH LatestRev AS (
            SELECT GroupId, MAX(Revision) as MaxRev
            FROM [master].[tb_PC_Plan]
            WHERE IsActive = 1
            GROUP BY GroupId
        )
        SELECT Main.*
        FROM [master].[tb_PC_Plan] Main
        INNER JOIN LatestRev 
            ON Main.GroupId = LatestRev.GroupId 
            AND Main.Revision = LatestRev.MaxRev
        WHERE Main.IsActive = 1
        ORDER BY Main.PlanDate DESC, Main.Plan_ID DESC;
    END
END
GO

-- 4. Get History by GroupId
CREATE OR ALTER PROCEDURE [trans].[Stored_PCPlan_GetHistory]
    @GroupId NVARCHAR(50)
AS
BEGIN
    SELECT *
    FROM [master].[tb_PC_Plan]
    WHERE GroupId = @GroupId
    ORDER BY Revision DESC;
END
GO

-- 5. Update Paths ONLY (No Revision Increase)
CREATE OR ALTER PROCEDURE [trans].[Stored_PCPlan_Update_Paths]
    @GroupId NVARCHAR(50),
    @Path_Dwg NVARCHAR(255) = NULL,
    @Path_Layout NVARCHAR(255) = NULL,
    @Path_IIQC NVARCHAR(255) = NULL
AS
BEGIN
    -- Update the LATEST revision for this GroupId
    UPDATE [master].[tb_PC_Plan]
    SET Path_Dwg = @Path_Dwg,
        Path_Layout = @Path_Layout,
        Path_IIQC = @Path_IIQC
    WHERE GroupId = @GroupId 
      AND IsActive = 1
      AND Revision = (
          SELECT MAX(Revision) 
          FROM [master].[tb_PC_Plan] 
          WHERE GroupId = @GroupId AND IsActive = 1
      );
END
GO
