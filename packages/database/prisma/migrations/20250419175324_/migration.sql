/*
  Warnings:

  - You are about to drop the column `user_id` on the `License` table. All the data in the column will be lost.
  - Added the required column `clinical_info_id` to the `License` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[License] DROP CONSTRAINT [License_user_id_fkey];

-- AlterTable
ALTER TABLE [dbo].[License] DROP COLUMN [user_id];
ALTER TABLE [dbo].[License] ADD [clinical_info_id] INT NOT NULL;

-- AddForeignKey
ALTER TABLE [dbo].[License] ADD CONSTRAINT [License_clinical_info_id_fkey] FOREIGN KEY ([clinical_info_id]) REFERENCES [dbo].[ClinicalInfo]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
