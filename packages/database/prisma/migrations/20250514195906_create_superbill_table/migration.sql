BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Superbill] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [Superbill_id_df] DEFAULT newid(),
    [superbill_number] INT NOT NULL CONSTRAINT [Superbill_superbill_number_df] DEFAULT 0,
    [client_group_id] UNIQUEIDENTIFIER NOT NULL,
    [appointment_id] UNIQUEIDENTIFIER NOT NULL,
    [issued_date] DATETIME2 NOT NULL CONSTRAINT [Superbill_issued_date_df] DEFAULT CURRENT_TIMESTAMP,
    [service_code] VARCHAR(50),
    [service_description] VARCHAR(255),
    [diagnosis_code] VARCHAR(50),
    [units] INT CONSTRAINT [Superbill_units_df] DEFAULT 1,
    [pos] VARCHAR(10),
    [provider_name] VARCHAR(255),
    [provider_email] VARCHAR(255),
    [provider_license] VARCHAR(100),
    [client_name] VARCHAR(255) NOT NULL,
    [amount] DECIMAL(10,2) NOT NULL,
    [paid_amount] DECIMAL(10,2),
    [status] VARCHAR(50) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Superbill_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [created_by] UNIQUEIDENTIFIER,
    CONSTRAINT [Superbill_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Superbill_client_group_id] ON [dbo].[Superbill]([client_group_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Superbill_appointment_id] ON [dbo].[Superbill]([appointment_id]);

-- AddForeignKey
ALTER TABLE [dbo].[Superbill] ADD CONSTRAINT [FK_Superbill_ClientGroup] FOREIGN KEY ([client_group_id]) REFERENCES [dbo].[ClientGroup]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Superbill] ADD CONSTRAINT [FK_Superbill_Appointment] FOREIGN KEY ([appointment_id]) REFERENCES [dbo].[Appointment]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Superbill] ADD CONSTRAINT [FK_Superbill_User] FOREIGN KEY ([created_by]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
