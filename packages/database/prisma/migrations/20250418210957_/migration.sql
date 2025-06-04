/*
  Warnings:

  - You are about to drop the column `NPInumber` on the `ClinicalInfo` table. All the data in the column will be lost.
  - You are about to drop the column `taxonomyCode` on the `ClinicalInfo` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `ClinicalInfo` table. All the data in the column will be lost.
  - Added the required column `NPI_number` to the `ClinicalInfo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taxonomy_code` to the `ClinicalInfo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `ClinicalInfo` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[ClinicalInfo] DROP CONSTRAINT [FK_clinicalInfo_User];

-- AlterTable
ALTER TABLE [dbo].[ClinicalInfo] DROP COLUMN [NPInumber],
[taxonomyCode],
[userId];
ALTER TABLE [dbo].[ClinicalInfo] ADD [NPI_number] FLOAT(53) NOT NULL,
[taxonomy_code] NVARCHAR(1000) NOT NULL,
[user_id] UNIQUEIDENTIFIER NOT NULL;

-- AddForeignKey
ALTER TABLE [dbo].[ClinicalInfo] ADD CONSTRAINT [FK_clinicalInfo_User] FOREIGN KEY ([user_id]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
