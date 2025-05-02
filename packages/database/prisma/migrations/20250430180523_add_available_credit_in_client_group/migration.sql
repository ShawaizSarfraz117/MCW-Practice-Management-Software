/*
  Warnings:

  - Added the required column `type` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Appointment] ADD [adjustable_amount] DECIMAL(32,16),
[write_off] DECIMAL(32,16);

-- AlterTable
ALTER TABLE [dbo].[ClientGroup] ADD [available_credit] DECIMAL(32,16) NOT NULL CONSTRAINT [ClientGroup_available_credit_df] DEFAULT 0;

-- AlterTable
ALTER TABLE [dbo].[Invoice] ADD [type] VARCHAR(50) NOT NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
