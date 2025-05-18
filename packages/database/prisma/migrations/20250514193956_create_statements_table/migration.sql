BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Statement] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [Statement_id_df] DEFAULT newid(),
    [statement_number] INT NOT NULL CONSTRAINT [Statement_statement_number_df] DEFAULT 0,
    [client_group_id] UNIQUEIDENTIFIER NOT NULL,
    [start_date] DATETIME2,
    [end_date] DATETIME2,
    [beginning_balance] DECIMAL(10,2) NOT NULL,
    [invoices_total] DECIMAL(10,2) NOT NULL,
    [payments_total] DECIMAL(10,2) NOT NULL,
    [ending_balance] DECIMAL(10,2) NOT NULL,
    [provider_name] VARCHAR(255),
    [provider_email] VARCHAR(255),
    [provider_phone] VARCHAR(255),
    [client_group_name] VARCHAR(255) NOT NULL,
    [client_name] VARCHAR(255) NOT NULL,
    [client_email] VARCHAR(255),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Statement_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [created_by] UNIQUEIDENTIFIER,
    CONSTRAINT [Statement_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Statement_client_group_id] ON [dbo].[Statement]([client_group_id]);

-- AddForeignKey
ALTER TABLE [dbo].[Statement] ADD CONSTRAINT [FK_Statement_ClientGroup] FOREIGN KEY ([client_group_id]) REFERENCES [dbo].[ClientGroup]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Statement] ADD CONSTRAINT [FK_Statement_User] FOREIGN KEY ([created_by]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
