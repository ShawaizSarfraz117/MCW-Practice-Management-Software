/*
  Warnings:

  - You are about to alter the column `rate` on the `PracticeService` table. The data in that column could be lost. The data in that column will be cast from `Decimal(32,16)` to `Decimal(10,2)`.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[PracticeService] ALTER COLUMN [rate] DECIMAL(10,2) NOT NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
