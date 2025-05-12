/*
  Warnings:

  - You are about to alter the column `rate` on the `PracticeService` table. The data in that column could be lost. The data in that column will be cast from `Decimal(32,16)` to `Decimal(10,2)`.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[PracticeService] ALTER COLUMN [rate] DECIMAL(10,2) NOT NULL;

-- CreateTable
CREATE TABLE [dbo].[EmailTemplate] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [EmailTemplate_id_df] DEFAULT newid(),
    [name] VARCHAR(255) NOT NULL,
    [subject] VARCHAR(255) NOT NULL,
    [content] TEXT NOT NULL,
    [type] VARCHAR(50) NOT NULL,
    [is_active] BIT NOT NULL CONSTRAINT [EmailTemplate_is_active_df] DEFAULT 1,
    [is_enabled] BIT NOT NULL CONSTRAINT [EmailTemplate_is_enabled_df] DEFAULT 1,
    [reminder_time] INT,
    [include_attachments] BIT CONSTRAINT [EmailTemplate_include_attachments_df] DEFAULT 0,
    [send_to_client] BIT NOT NULL CONSTRAINT [EmailTemplate_send_to_client_df] DEFAULT 1,
    [send_to_clinician] BIT NOT NULL CONSTRAINT [EmailTemplate_send_to_clinician_df] DEFAULT 0,
    [send_to_practice] BIT NOT NULL CONSTRAINT [EmailTemplate_send_to_practice_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [EmailTemplate_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [EmailTemplate_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [EmailTemplate_type_idx] ON [dbo].[EmailTemplate]([type]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [EmailTemplate_created_by_idx] ON [dbo].[EmailTemplate]([created_by]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
