BEGIN TRY

BEGIN TRAN;

-- AlterTable
EXEC SP_RENAME N'dbo.PK_ReminderTextTemplates', N'ReminderTextTemplates_pkey';
ALTER TABLE [dbo].[ReminderTextTemplates] ADD CONSTRAINT [PK_ReminderTextTemplates] DEFAULT newid() FOR [id];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
