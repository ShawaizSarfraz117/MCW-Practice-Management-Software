BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ClientGroupFile] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [ClientGroupFile_id_df] DEFAULT newid(),
    [title] VARCHAR(255) NOT NULL,
    [type] VARCHAR(50) NOT NULL CONSTRAINT [ClientGroupFile_type_df] DEFAULT 'PRACTICE_UPLOAD',
    [status] VARCHAR(50) NOT NULL CONSTRAINT [ClientGroupFile_status_df] DEFAULT 'UPLOADED',
    [url] TEXT NOT NULL,
    [client_group_id] UNIQUEIDENTIFIER NOT NULL,
    [uploaded_by_id] UNIQUEIDENTIFIER,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [ClientGroupFile_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [ClientGroupFile_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ClientGroupFile_client_group_id] ON [dbo].[ClientGroupFile]([client_group_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ClientGroupFile_uploaded_by_id] ON [dbo].[ClientGroupFile]([uploaded_by_id]);

-- AddForeignKey
ALTER TABLE [dbo].[ClientGroupFile] ADD CONSTRAINT [FK_ClientGroupFile_ClientGroup] FOREIGN KEY ([client_group_id]) REFERENCES [dbo].[ClientGroup]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ClientGroupFile] ADD CONSTRAINT [FK_ClientGroupFile_User] FOREIGN KEY ([uploaded_by_id]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
