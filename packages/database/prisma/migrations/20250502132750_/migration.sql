/*
  Warnings:

  - You are about to alter the column `rate` on the `PracticeService` table. The data in that column could be lost. The data in that column will be cast from `Decimal(32,16)` to `Decimal(10,2)`.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Location] ADD [city] VARCHAR(100),
[color] VARCHAR(50),
[state] VARCHAR(100),
[street] VARCHAR(255),
[zip] VARCHAR(20);

-- AlterTable
ALTER TABLE [dbo].[PracticeService] ALTER COLUMN [rate] DECIMAL(10,2) NOT NULL;

-- CreateTable
CREATE TABLE [dbo].[BillingAddress] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_BillingAddress_ID] DEFAULT newid(),
    [street] VARCHAR(255) NOT NULL,
    [city] VARCHAR(100) NOT NULL,
    [state] VARCHAR(50) NOT NULL,
    [zip] VARCHAR(20) NOT NULL,
    [type] VARCHAR(50) NOT NULL,
    [clinician_id] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [BillingAddress_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_BillingAddress_Clinician_Type] UNIQUE NONCLUSTERED ([clinician_id],[type])
);

-- CreateTable
CREATE TABLE [dbo].[PracticeInformation] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PracticeInformation_id_df] DEFAULT newid(),
    [practice_name] NVARCHAR(1000) NOT NULL,
    [practice_email] NVARCHAR(1000) NOT NULL,
    [time_zone] NVARCHAR(1000) NOT NULL,
    [practice_logo] NVARCHAR(1000) NOT NULL,
    [phone_numbers] NVARCHAR(1000) NOT NULL,
    [tele_health] BIT NOT NULL,
    [user_id] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [PracticeInformation_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_BillingAddress_clinician_id] ON [dbo].[BillingAddress]([clinician_id]);

-- AddForeignKey
ALTER TABLE [dbo].[BillingAddress] ADD CONSTRAINT [FK_BillingAddress_Clinician] FOREIGN KEY ([clinician_id]) REFERENCES [dbo].[Clinician]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PracticeInformation] ADD CONSTRAINT [FK_practiceInformation_User] FOREIGN KEY ([user_id]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
