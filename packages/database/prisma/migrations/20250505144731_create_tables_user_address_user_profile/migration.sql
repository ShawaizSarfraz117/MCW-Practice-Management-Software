/*
  Warnings:

  - You are about to alter the column `rate` on the `PracticeService` table. The data in that column could be lost. The data in that column will be cast from `Decimal(32,16)` to `Decimal(10,2)`.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[PracticeService] ALTER COLUMN [rate] DECIMAL(10,2) NOT NULL;

-- CreateTable
CREATE TABLE [dbo].[ClientProfile] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_ClientProfile_ID] DEFAULT newid(),
    [client_id] UNIQUEIDENTIFIER NOT NULL,
    [gender] VARCHAR(50) NOT NULL,
    [gender_identity] VARCHAR(50) NOT NULL,
    [relationship_status] VARCHAR(50) NOT NULL,
    [employment_status] VARCHAR(50) NOT NULL,
    [race_ethnicity] VARCHAR(50) NOT NULL,
    [race_ethnicity_details] VARCHAR(50) NOT NULL,
    [preferred_language] VARCHAR(50) NOT NULL,
    [notes] TEXT NOT NULL,
    [first_seen_at] DATETIME2 NOT NULL CONSTRAINT [ClientProfile_first_seen_at] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ClientProfile_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ClientProfile_client_id_key] UNIQUE NONCLUSTERED ([client_id])
);

-- CreateTable
CREATE TABLE [dbo].[ClientAdress] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_ClientAddress_ID] DEFAULT newid(),
    [client_id] UNIQUEIDENTIFIER NOT NULL,
    [address_line1] VARCHAR(255) NOT NULL,
    [address_line2] VARCHAR(255) NOT NULL,
    [zip_code] VARCHAR(50) NOT NULL,
    [city] VARCHAR(50) NOT NULL,
    [state] VARCHAR(50) NOT NULL,
    [country] VARCHAR(50) NOT NULL,
    [is_primary] BIT NOT NULL CONSTRAINT [DF_ClientAddress_IsPrimary] DEFAULT 0,
    CONSTRAINT [ClientAdress_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[ClientProfile] ADD CONSTRAINT [FK_ClientProfile_Client] FOREIGN KEY ([client_id]) REFERENCES [dbo].[Client]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ClientAdress] ADD CONSTRAINT [FK_ClientAddress_Client] FOREIGN KEY ([client_id]) REFERENCES [dbo].[Client]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
