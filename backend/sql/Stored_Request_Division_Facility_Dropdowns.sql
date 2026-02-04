-- =============================================
-- Author:      System Generated
-- Create Date: 2026-02-02
-- Description: Stored Procedures สำหรับ Request Page
--              1. Division Dropdown
--              2. Facility Dropdown ตาม Division (แสดงแค่ F.x ไม่ซ้ำ)
-- =============================================

USE [db_Tooling]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- 1. Division Dropdown - ดึงรายการ Division ทั้งหมด
-- =============================================
CREATE OR ALTER PROCEDURE [trans].[Stored_Get_Dropdown_PC_Plan_Division]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT DISTINCT 
        [Division_Id],
        [Profit_Center],
        CASE 
            WHEN [Profit_Center] = '71DZ' THEN 'PMC'
            WHEN [Profit_Center] = '7122' THEN 'GM'
            ELSE CAST([Division_Id] AS NVARCHAR(50))
        END AS [Division_Name]
    FROM [db_Tooling].[viewer].[View_tb_Division_Facility_ALL]
    WHERE [Division_Id] IS NOT NULL
    ORDER BY [Division_Id];
END
GO

-- =============================================
-- 2. Facility Dropdown - ดึง FacilityShort ไม่ซ้ำ (F.1, F.4, F.6)
--    ใช้ subquery เพื่อ DISTINCT บน FacilityShort
-- =============================================
CREATE OR ALTER PROCEDURE [trans].[Stored_Get_Dropdown_Facility_By_Division]
    @Division_Id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT DISTINCT 
        FacilityShort,
        -- เก็บ FacilityName ตัวแรกที่เจอไว้สำหรับส่ง API
        MIN(FacilityName) AS FacilityName
    FROM (
        SELECT 
            [FacilityName],
            CASE 
                WHEN CHARINDEX('F.', [FacilityName]) > 0 
                THEN SUBSTRING([FacilityName], CHARINDEX('F.', [FacilityName]), LEN([FacilityName]))
                ELSE [FacilityName]
            END AS FacilityShort
        FROM [db_Tooling].[viewer].[View_tb_Division_Facility_ALL]
        WHERE 
            [Division_Id] = @Division_Id 
            AND [FacilityName] IS NOT NULL
    ) AS sub
    GROUP BY FacilityShort
    ORDER BY FacilityShort;
END
GO
