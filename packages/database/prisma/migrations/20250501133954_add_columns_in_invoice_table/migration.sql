BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Invoice] DROP CONSTRAINT [FK_Invoice_Clinician];

-- AlterTable
ALTER TABLE [dbo].[Invoice] ALTER COLUMN [clinician_id] UNIQUEIDENTIFIER NULL;
ALTER TABLE [dbo].[Invoice] ADD [client_info] TEXT,
[notes] TEXT,
[provider_info] TEXT,
[service_description] TEXT;

-- AddForeignKey
ALTER TABLE [dbo].[Invoice] ADD CONSTRAINT [FK_Invoice_Clinician] FOREIGN KEY ([clinician_id]) REFERENCES [dbo].[Clinician]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
