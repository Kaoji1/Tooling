CREATE TABLE [trans].[Notification_Log] (
    [Notification_ID] INT IDENTITY(1,1) PRIMARY KEY,
    [Event_Type] NVARCHAR(50), -- 'NEW_PLAN', 'UPDATE_PLAN', 'CANCEL_PLAN'
    [Message] NVARCHAR(MAX),
    [Doc_No] NVARCHAR(50),
    [Action_By] NVARCHAR(100),
    [Created_At] DATETIME DEFAULT GETDATE(),
    [Is_Active] BIT DEFAULT 1
);

GO

CREATE PROCEDURE [trans].[Stored_Insert_Notification_Log]
    @Event_Type NVARCHAR(50),
    @Message NVARCHAR(MAX),
    @Doc_No NVARCHAR(50),
    @Action_By NVARCHAR(100)
AS
BEGIN
    INSERT INTO [trans].[Notification_Log] (Event_Type, Message, Doc_No, Action_By)
    VALUES (@Event_Type, @Message, @Doc_No, @Action_By);
    
    SELECT @@IDENTITY AS Notification_ID;
END;
