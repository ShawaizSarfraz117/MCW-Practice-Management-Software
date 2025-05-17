BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ClientPortalSettings] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [ClientPortalSettings_id_df] DEFAULT newid(),
    [clinician_id] UNIQUEIDENTIFIER NOT NULL,
    [website_domain] VARCHAR(255) NOT NULL,
    [allow_appointments] BIT NOT NULL CONSTRAINT [ClientPortalSettings_allow_appointments_df] DEFAULT 1,
    [allow_file_uploads] BIT NOT NULL CONSTRAINT [ClientPortalSettings_allow_file_uploads_df] DEFAULT 1,
    [greeting_message] TEXT,
    [allow_new_clients] BIT NOT NULL CONSTRAINT [ClientPortalSettings_allow_new_clients_df] DEFAULT 1,
    [allow_individual_clients] BIT NOT NULL CONSTRAINT [ClientPortalSettings_allow_individual_clients_df] DEFAULT 1,
    [allow_couple_clients] BIT NOT NULL CONSTRAINT [ClientPortalSettings_allow_couple_clients_df] DEFAULT 1,
    [allow_contact_clients] BIT NOT NULL CONSTRAINT [ClientPortalSettings_allow_contact_clients_df] DEFAULT 1,
    [show_prescreener] BIT NOT NULL CONSTRAINT [ClientPortalSettings_show_prescreener_df] DEFAULT 1,
    [ask_payment_method] BIT NOT NULL CONSTRAINT [ClientPortalSettings_ask_payment_method_df] DEFAULT 1,
    [require_credit_card] BIT NOT NULL CONSTRAINT [ClientPortalSettings_require_credit_card_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [ClientPortalSettings_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [ClientPortalSettings_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ClientPortalSettings_clinician_id_key] UNIQUE NONCLUSTERED ([clinician_id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ClientPortalSettings_clinician_id_idx] ON [dbo].[ClientPortalSettings]([clinician_id]);

-- AddForeignKey
ALTER TABLE [dbo].[ClientPortalSettings] ADD CONSTRAINT [ClientPortalSettings_clinician_id_fkey] FOREIGN KEY ([clinician_id]) REFERENCES [dbo].[Clinician]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
