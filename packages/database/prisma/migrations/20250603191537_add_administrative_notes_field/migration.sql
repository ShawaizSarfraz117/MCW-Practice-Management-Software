BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[ClientGroup] ADD [administrative_notes] TEXT;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
