BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[GoodFaithServices] DROP CONSTRAINT [FK_GoodFaithServices_Diagnosis];

-- AlterTable
ALTER TABLE [dbo].[GoodFaithServices] ALTER COLUMN [diagnosis_id] UNIQUEIDENTIFIER NULL;

-- AddForeignKey
ALTER TABLE [dbo].[GoodFaithServices] ADD CONSTRAINT [FK_GoodFaithServices_Diagnosis] FOREIGN KEY ([diagnosis_id]) REFERENCES [dbo].[Diagnosis]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
