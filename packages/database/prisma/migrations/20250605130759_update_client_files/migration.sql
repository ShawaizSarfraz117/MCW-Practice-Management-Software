BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[AvailabilityServices] DROP CONSTRAINT [FK_AvailabilityServices_PracticeService];

-- AlterTable
ALTER TABLE [dbo].[ClientFiles] ADD [completed_at] DATETIME,
[frequency] VARCHAR(50),
[next_due_date] DATETIME,
[shared_at] DATETIME;

-- AlterTable
ALTER TABLE [dbo].[ClientGroupFile] ADD [expiry_date] DATETIME,
[is_template] BIT NOT NULL CONSTRAINT [ClientGroupFile_is_template_df] DEFAULT 0,
[original_template_id] UNIQUEIDENTIFIER,
[sharing_enabled] BIT NOT NULL CONSTRAINT [ClientGroupFile_sharing_enabled_df] DEFAULT 1;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
