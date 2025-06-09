/*
  Warnings:

  - You are about to drop the column `client_address` on the `GoodFaithEstimate` table. All the data in the column will be lost.
  - You are about to drop the column `client_city` on the `GoodFaithEstimate` table. All the data in the column will be lost.
  - You are about to drop the column `client_dob` on the `GoodFaithEstimate` table. All the data in the column will be lost.
  - You are about to drop the column `client_email` on the `GoodFaithEstimate` table. All the data in the column will be lost.
  - You are about to drop the column `client_id` on the `GoodFaithEstimate` table. All the data in the column will be lost.
  - You are about to drop the column `client_name` on the `GoodFaithEstimate` table. All the data in the column will be lost.
  - You are about to drop the column `client_phone` on the `GoodFaithEstimate` table. All the data in the column will be lost.
  - You are about to drop the column `client_state` on the `GoodFaithEstimate` table. All the data in the column will be lost.
  - You are about to drop the column `client_zip_code` on the `GoodFaithEstimate` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[GoodFaithEstimate] DROP CONSTRAINT [FK_GoodFaithEstimate_Client];

-- AlterTable
ALTER TABLE [dbo].[GoodFaithEstimate] DROP COLUMN [client_address],
[client_city],
[client_dob],
[client_email],
[client_id],
[client_name],
[client_phone],
[client_state],
[client_zip_code];
ALTER TABLE [dbo].[GoodFaithEstimate] ADD CONSTRAINT [GoodFaithEstimate_id_df] DEFAULT newid() FOR [id];
ALTER TABLE [dbo].[GoodFaithEstimate] ADD [notes] TEXT;

-- AlterTable
ALTER TABLE [dbo].[GoodFaithServices] ADD CONSTRAINT [GoodFaithServices_id_df] DEFAULT newid() FOR [id];

-- CreateTable
CREATE TABLE [dbo].[GoodFaithClients] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [GoodFaithClients_id_df] DEFAULT newid(),
    [client_id] UNIQUEIDENTIFIER NOT NULL,
    [good_faith_id] UNIQUEIDENTIFIER NOT NULL,
    [name] VARCHAR(100) NOT NULL,
    [dob] DATE NOT NULL,
    [address] VARCHAR(250),
    [city] VARCHAR(100),
    [state] VARCHAR(100),
    [zip_code] VARCHAR(50),
    [phone] VARCHAR(50),
    [email] VARCHAR(100),
    [should_voice] BIT NOT NULL CONSTRAINT [DF_GoodFaithClients_should_voice] DEFAULT 0,
    [should_text] BIT NOT NULL CONSTRAINT [DF_GoodFaithClients_should_text] DEFAULT 0,
    [should_email] BIT NOT NULL CONSTRAINT [DF_GoodFaithClients_should_email] DEFAULT 0,
    CONSTRAINT [PK_GoodFaithClients] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[GoodFaithClients] ADD CONSTRAINT [FK_GoodFaithClients_Client] FOREIGN KEY ([client_id]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[GoodFaithClients] ADD CONSTRAINT [FK_GoodFaithClients_GoodFaithEstimate] FOREIGN KEY ([good_faith_id]) REFERENCES [dbo].[GoodFaithEstimate]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
