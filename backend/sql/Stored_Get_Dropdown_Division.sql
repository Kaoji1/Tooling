USE [db_Tooling]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:       Suttichai/Trainee
-- Date:         10/02/2569 
-- Description:  Stored_Get_Dropdown_Division
-- =============================================
CREATE OR ALTER PROCEDURE [trans].[Stored_Get_Dropdown_Division]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DISTINCT 
        [Division_Id],
        [Profit_Center],
        [Profit_Center] AS [DivisionName], 
        [Profit_Center] AS [CenterName]
    FROM [db_Cost_Data_Centralized].[master].[tb_Master_Division_MMD]
    ORDER BY [Profit_Center];
END
GO
