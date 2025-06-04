/*
  Warnings:

  - You are about to drop the `ProfileDetails` table. If the table is not empty, all the data it contains will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[ProfileDetails] DROP CONSTRAINT [ProfileDetails_user_id_fkey];

-- AlterTable
ALTER TABLE [dbo].[User] ADD [date_of_birth] DATE,
[phone] VARCHAR(20),
[profile_photo] VARCHAR(500);

-- DropTable
DROP TABLE [dbo].[ProfileDetails];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
