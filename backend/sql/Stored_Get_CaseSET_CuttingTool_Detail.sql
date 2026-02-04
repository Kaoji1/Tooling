-- =============================================
-- Author:      System Generated
-- Create Date: 2026-02-03
-- Description: Stored Procedure สำหรับดูรายละเอียด Box/Shelf/Rack
--              ใช้กับปุ่ม View Detail บนหน้าเว็บ
--              ลบ @Input_MC ออก และใช้ FacilityName แทน Facility
-- =============================================

USE [db_Tooling]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [trans].[Stored_Get_CaseSET_CuttingTool_Detail]
    @Input_Division NVARCHAR(50) = NULL,
    @Input_ItemNo NVARCHAR(100) = NULL,
    @Input_FacilityName NVARCHAR(100) = NULL,  -- ใช้ FacilityName แทน Facility
    @Input_PartNo NVARCHAR(100) = NULL,
    @Input_Process NVARCHAR(100) = NULL
    -- ลบ @Input_MC ออก
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        [ItemNo],
        [ItemName],
        [SPEC],
        [PartNo],
        [Process],
        [MC],
        [Position],
        [FacilityName],
        [BoxName],
        [ShelfName],
        [RackName],
        ISNULL([FreshQty], 0) AS [FreshQty],
        ISNULL([ReuseQty], 0) AS [ReuseQty],
        ISNULL([TotalQty], 0) AS [TotalQty]
    FROM [viewer].[View_tb_Master_Pur_CuttingTool_PMC_QTY]
    WHERE 
        (@Input_Division IS NULL OR [Division_Id] = @Input_Division)
        AND (@Input_ItemNo IS NULL OR [ItemNo] = @Input_ItemNo)
        AND (@Input_PartNo IS NULL OR [PartNo] = @Input_PartNo)
        AND (@Input_Process IS NULL OR [Process] = @Input_Process)
        -- FacilityName: optional, ถ้าส่งมาจะ filter แต่รวม NULL ด้วย
        AND (
            @Input_FacilityName IS NULL 
            OR @Input_FacilityName = '' 
            OR [FacilityName] LIKE '%' + @Input_FacilityName
            OR [FacilityName] IS NULL
        )
    ORDER BY [BoxName], [ShelfName], [RackName];
END
GO
