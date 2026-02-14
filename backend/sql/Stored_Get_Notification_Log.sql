USE [db_Tooling];
GO

IF OBJECT_ID('[trans].[Stored_Get_Notification_Log]', 'P') IS NOT NULL DROP PROCEDURE [trans].[Stored_Get_Notification_Log];
GO

CREATE PROCEDURE [trans].[Stored_Get_Notification_Log]
AS
BEGIN
    SELECT TOP 50
        [Notification_ID],
        [Event_Type],
        [Message],
        [Doc_No],
        [Action_By],
        [Created_At],
        [IsRead] -- Include the new column
    FROM [master].[tb_Notification_Log]
    WHERE [Is_Active] = 1
    ORDER BY [Created_At] DESC;
END;
