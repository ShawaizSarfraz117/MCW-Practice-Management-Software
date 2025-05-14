BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[BillingSettings] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [BillingSettings_id_df] DEFAULT newid(),
    [clinician_id] UNIQUEIDENTIFIER NOT NULL,
    [autoInvoiceCreation] VARCHAR(50) NOT NULL,
    [pastDueDays] INT NOT NULL,
    [emailClientPastDue] BIT NOT NULL,
    [invoiceIncludePracticeLogo] BIT NOT NULL,
    [invoiceFooterInfo] VARCHAR(120),
    [superbillDayOfMonth] INT NOT NULL,
    [superbillIncludePracticeLogo] BIT NOT NULL,
    [superbillIncludeSignatureLine] BIT NOT NULL,
    [superbillIncludeDiagnosisDescription] BIT NOT NULL,
    [superbillFooterInfo] VARCHAR(120),
    [billingDocEmailDelayMinutes] INT NOT NULL,
    [createMonthlyStatementsForNewClients] BIT NOT NULL,
    [createMonthlySuperbillsForNewClients] BIT NOT NULL,
    [defaultNotificationMethod] VARCHAR(50) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [BillingSettings_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [BillingSettings_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [BillingSettings_clinician_id_key] UNIQUE NONCLUSTERED ([clinician_id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BillingSettings_clinician_id_idx] ON [dbo].[BillingSettings]([clinician_id]);

-- AddForeignKey
ALTER TABLE [dbo].[BillingSettings] ADD CONSTRAINT [BillingSettings_clinician_id_fkey] FOREIGN KEY ([clinician_id]) REFERENCES [dbo].[Clinician]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
