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
    SET NOCOUNT ON;

    -- BE Year Fix: If @PlanDate is in Buddhist Era format (> 2400), convert to AD (-543)
    IF YEAR(@PlanDate) > 2400 SET @PlanDate = DATEADD(YEAR, -543, @PlanDate);

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

    -- 2. (REMOVED) Global Revision Calculation - Moving to Independent Revisions
    
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
        Revision INT,             -- Use Provided Revision if available
        Path_Dwg NVARCHAR(255),    -- Capture Path
        Path_Layout NVARCHAR(255), -- Capture Path
        Path_IIQC NVARCHAR(255)    -- Capture Path
    );

    -- BE Year Fix: Detect if year is Buddhist Era (> 2400) and convert to AD (-543)
    -- This handles the @TargetDate safety
    IF YEAR(@TargetDate) > 2400 SET @TargetDate = DATEADD(YEAR, -543, @TargetDate);

    -- This handles all incoming items in the batch
    UPDATE #IncomingData 
    SET PlanDate = DATEADD(YEAR, -543, PlanDate) 
    WHERE YEAR(PlanDate) > 2400;

    -- 4. INSERT / UPDATE INDEPENDENTLY (No Snapshot Copying)
    -- Group Items to process them one by one if they share same logic? 
    -- Actually, we can just insert them. The Query SP handles finding the Latest.

    INSERT INTO [master].[tb_PC_Plan] (
        PlanDate, Employee_ID, Division, MC_Type, Facility, 
        Before_Part, Process, MC_No, PartNo, QTY, [Time], 
        Comment, Revision, GroupId, IsActive, PlanStatus,
        Path_Dwg, Path_Layout, Path_IIQC
    )
    SELECT 
        New.PlanDate, New.Employee_ID, @Division, New.MC_Type, New.Facility, 
        New.Before_Part, New.Process, New.MC_No, New.PartNo, New.QTY, New.[Time], 
        New.Comment, 
        -- Revision Logic:
        -- 1. If JSON provides Revision, use it (Manual Edit case).
        -- 2. Otherwise, find Max Revision for this GroupId + 1 (Upload case).
        ISNULL(New.Revision, (
            SELECT ISNULL(MAX(Revision), -1) + 1 
            FROM [master].[tb_PC_Plan] Old
            WHERE Old.GroupId = 
                CASE 
                    WHEN (New.GroupId IS NOT NULL AND New.GroupId <> '' AND New.GroupId <> '-') THEN New.GroupId
                    ELSE (
                        SELECT TOP 1 GroupId 
                        FROM [master].[tb_PC_Plan] Finder
                        WHERE Finder.Division = @Division
                          AND Finder.PlanDate = New.PlanDate
                          AND Finder.MC_Type = New.MC_Type
                          AND Finder.PartNo = New.PartNo
                          AND Finder.Process = New.Process
                          AND Finder.GroupId IS NOT NULL AND Finder.GroupId <> '-'
                    )
                END
        )),
        -- GroupId Logic: Use provided, find existing, or NEWID()
        ISNULL(
            CASE WHEN (New.GroupId IS NOT NULL AND New.GroupId <> '' AND New.GroupId <> '-') THEN New.GroupId ELSE NULL END,
            ISNULL((
                SELECT TOP 1 GroupId 
                FROM [master].[tb_PC_Plan] Old
                WHERE Old.Division = @Division
                  AND Old.PlanDate = New.PlanDate
                  AND Old.MC_Type = New.MC_Type
                  AND Old.PartNo = New.PartNo
                  AND Old.Process = New.Process
                  AND Old.GroupId IS NOT NULL AND Old.GroupId <> '-'
            ), NEWID())
        ),
        1,
        New.PlanStatus,
        New.Path_Dwg, New.Path_Layout, New.Path_IIQC
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

    -- Define Date Range: Beginning of Last Month to End of Next Year
    DECLARE @StartDate DATE = DATEADD(month, DATEDIFF(month, 0, GETDATE()) - 1, 0); 
    DECLARE @EndDate DATE = DATEADD(year, DATEDIFF(year, 0, GETDATE()) + 2, 0); 

    IF @ShowHistory = 1
    BEGIN
        -- Show ALL records (Active + History) within range
        SELECT *
        FROM [master].[tb_PC_Plan]
        WHERE IsActive = 1
          AND PlanDate >= @StartDate AND PlanDate < @EndDate
        -- Order by Date ASC (Soonest first), then Group items together, then Latest Rev first
        ORDER BY PlanDate ASC, GroupId, Revision DESC;
    END
    ELSE
    BEGIN
        -- Show LATEST only within range
        WITH LatestRev AS (
            SELECT GroupId, MAX(Revision) as MaxRev
            FROM [master].[tb_PC_Plan]
            WHERE IsActive = 1
              AND PlanDate >= @StartDate AND PlanDate < @EndDate
            GROUP BY GroupId
        )
        SELECT Main.*
        FROM [master].[tb_PC_Plan] Main
        INNER JOIN LatestRev 
            ON Main.GroupId = LatestRev.GroupId 
            AND Main.Revision = LatestRev.MaxRev
        WHERE Main.IsActive = 1
        ORDER BY Main.PlanDate ASC, Main.Plan_ID DESC;
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
