BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[SchedulingMessage] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [SchedulingMessage_id_df] DEFAULT newid(),
    [content] TEXT NOT NULL,
    [type] VARCHAR(50) NOT NULL,
    [is_active] BIT NOT NULL CONSTRAINT [SchedulingMessage_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [SchedulingMessage_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [SchedulingMessage_pkey] PRIMARY KEY CLUSTERED ([id])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
