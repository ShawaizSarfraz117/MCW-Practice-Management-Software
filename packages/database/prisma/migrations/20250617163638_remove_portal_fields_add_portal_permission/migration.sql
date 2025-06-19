/*
  Warnings:

  - You are about to drop the column `access_billing_documents` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `allow_online_appointment` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `use_secure_messaging` on the `Client` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- Drop default constraints first
ALTER TABLE [dbo].[Client] DROP CONSTRAINT [DF_Client_access_billing_documents];
ALTER TABLE [dbo].[Client] DROP CONSTRAINT [DF_Client_allow_online_appointment];
ALTER TABLE [dbo].[Client] DROP CONSTRAINT [DF_Client_use_secure_messaging];

-- AlterTable
ALTER TABLE [dbo].[Client] DROP COLUMN [access_billing_documents],
[allow_online_appointment],
[use_secure_messaging];

-- CreateTable
CREATE TABLE [dbo].[ClientPortalPermission] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [ClientPortalPermission_id_df] DEFAULT newid(),
    [client_id] UNIQUEIDENTIFIER NOT NULL,
    [email] VARCHAR(255) NOT NULL,
    [allow_appointment_requests] BIT NOT NULL CONSTRAINT [ClientPortalPermission_allow_appointment_requests_df] DEFAULT 1,
    [use_secure_messaging] BIT NOT NULL CONSTRAINT [ClientPortalPermission_use_secure_messaging_df] DEFAULT 1,
    [access_billing_documents] BIT NOT NULL CONSTRAINT [ClientPortalPermission_access_billing_documents_df] DEFAULT 1,
    [receive_announcements] BIT NOT NULL CONSTRAINT [ClientPortalPermission_receive_announcements_df] DEFAULT 1,
    [is_active] BIT NOT NULL CONSTRAINT [ClientPortalPermission_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [ClientPortalPermission_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [ClientPortalPermission_updated_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ClientPortalPermission_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ClientPortalPermission_client_id_key] UNIQUE NONCLUSTERED ([client_id]),
    CONSTRAINT [ClientPortalPermission_email_key] UNIQUE NONCLUSTERED ([email])
);

-- AddForeignKey
ALTER TABLE [dbo].[ClientPortalPermission] ADD CONSTRAINT [FK_ClientPortalPermission_Client] FOREIGN KEY ([client_id]) REFERENCES [dbo].[Client]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
