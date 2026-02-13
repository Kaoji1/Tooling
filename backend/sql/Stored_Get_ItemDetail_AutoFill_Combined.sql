USE [db_Tooling]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:       Suttichai/Trainee
-- Date:         13/02/2569
-- Description:  Combined AutoFill (Exact) and Autocomplete (Fuzzy) Item Search
-- =============================================
CREATE OR ALTER PROCEDURE [trans].[Stored_Get_ItemDetail_AutoFill]
    @Input_Division INT = NULL,
    @Input_ItemNo NVARCHAR(100) = NULL,
    @Is_Autocomplete BIT = 0  -- 0 = Exact Match (AutoFill), 1 = Fuzzy Search (Autocomplete)
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Validate Input
    IF (@Input_Division IS NULL OR @Input_ItemNo IS NULL OR @Input_ItemNo = '')
    BEGIN
        RETURN;
    END

    IF @Is_Autocomplete = 1
    BEGIN
        -- === Mode 1: Autocomplete (Fuzzy Search) ===
        -- Returns LIST of Items (Top 20)
        SELECT DISTINCT TOP 20
            [ItemNo],
            [ItemName],
            [SPEC],
            [UNIT],
            [ON_HAND]
        FROM [viewer].[View_tb_Master_Purchase_SUM_ALL] WITH (NOLOCK)
        WHERE [Division_Id] = @Input_Division
          AND (
              [ItemNo] LIKE '%' + @Input_ItemNo + '%'
              OR [ItemName] LIKE '%' + @Input_ItemNo + '%'
          )
        ORDER BY [ItemNo];
    END
    ELSE
    BEGIN
        -- === Mode 0: AutoFill (Exact Match) ===
        -- Returns SINGLE Item (Top 1)
        SELECT TOP 1
            [ItemNo],
            [ItemName],
            [SPEC],
            [UNIT],
            [ON_HAND]
        FROM [viewer].[View_tb_Master_Purchase_SUM_ALL] WITH (NOLOCK)
        WHERE [Division_Id] = @Input_Division
          AND [ItemNo] = @Input_ItemNo
        ORDER BY [LAST_UPDATE] DESC
        OPTION (RECOMPILE);
    END
END
GO
