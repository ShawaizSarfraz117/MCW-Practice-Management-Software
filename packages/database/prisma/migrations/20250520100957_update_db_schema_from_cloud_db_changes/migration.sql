/*
  Warnings:

  - You are about to drop the column `user_id` on the `PracticeInformation` table. All the data in the column will be lost.
  - The primary key for the `License` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `clinical_info_id` on the `License` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `License` table. The data in that column will be cast from `Int` to `String`. This cast may fail. Please make sure the data in the column can be cast.
  - Added the required column `clinician_id` to the `License` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[PracticeInformation] DROP CONSTRAINT [FK_practiceInformation_User];

-- AlterTable
ALTER TABLE [dbo].[Clinician] ADD [NPI_number] VARCHAR(250),
[speciality] VARCHAR(250),
[taxonomy_code] VARCHAR(250);

-- AlterTable
ALTER TABLE [dbo].[Invoice] ADD [is_exported] BIT NOT NULL CONSTRAINT [DF_Invoice_isExported] DEFAULT 0;

-- AlterTable
ALTER TABLE [dbo].[PracticeInformation] DROP COLUMN [user_id];
ALTER TABLE [dbo].[PracticeInformation] ADD [clinician_id] UNIQUEIDENTIFIER;

-- AlterTable
ALTER TABLE [dbo].[Statement] ADD [is_exported] BIT NOT NULL CONSTRAINT [DF_Statement_isExported] DEFAULT 0;

-- AlterTable
ALTER TABLE [dbo].[Superbill] ADD [is_exported] BIT NOT NULL CONSTRAINT [DF_Superbill_isExported] DEFAULT 0;

-- RedefineTables
BEGIN TRANSACTION;
DECLARE @SQL NVARCHAR(MAX) = N''
SELECT @SQL += N'ALTER TABLE '
    + QUOTENAME(OBJECT_SCHEMA_NAME(PARENT_OBJECT_ID))
    + '.'
    + QUOTENAME(OBJECT_NAME(PARENT_OBJECT_ID))
    + ' DROP CONSTRAINT '
    + OBJECT_NAME(OBJECT_ID) + ';'
FROM SYS.OBJECTS
WHERE TYPE_DESC LIKE '%CONSTRAINT'
    AND OBJECT_NAME(PARENT_OBJECT_ID) = 'License'
    AND SCHEMA_NAME(SCHEMA_ID) = 'dbo'
EXEC sp_executesql @SQL
;
CREATE TABLE [dbo].[_prisma_new_License] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [clinician_id] UNIQUEIDENTIFIER NOT NULL,
    [license_type] NVARCHAR(1000) NOT NULL,
    [license_number] NVARCHAR(1000) NOT NULL,
    [expiration_date] DATETIME2 NOT NULL,
    [state] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [PK_License] PRIMARY KEY CLUSTERED ([id])
);
IF EXISTS(SELECT * FROM [dbo].[License])
    EXEC('INSERT INTO [dbo].[_prisma_new_License] ([expiration_date],[id],[license_number],[license_type],[state]) SELECT [expiration_date],[id],[license_number],[license_type],[state] FROM [dbo].[License] WITH (holdlock tablockx)');
DROP TABLE [dbo].[License];
EXEC SP_RENAME N'dbo._prisma_new_License', N'License';
COMMIT;

-- AddForeignKey
ALTER TABLE [dbo].[PracticeInformation] ADD CONSTRAINT [FK_PracticeInformation_Clinician] FOREIGN KEY ([clinician_id]) REFERENCES [dbo].[Clinician]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
