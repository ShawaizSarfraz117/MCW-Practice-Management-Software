BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ClientGroupChartNote] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [ClientGroupChartNote_id_df] DEFAULT newid(),
    [text] TEXT NOT NULL,
    [client_group_id] UNIQUEIDENTIFIER NOT NULL,
    [note_date] DATETIME2 NOT NULL CONSTRAINT [ClientGroupChartNote_note_date_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ClientGroupChartNote_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ClientGroupChartNote_client_group_id] ON [dbo].[ClientGroupChartNote]([client_group_id]);

-- AddForeignKey
ALTER TABLE [dbo].[ClientGroupChartNote] ADD CONSTRAINT [FK_ClientGroupChartNote_ClientGroup] FOREIGN KEY ([client_group_id]) REFERENCES [dbo].[ClientGroup]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
