/*
  Warnings:

  - You are about to drop the column `adjustable_amount` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `write_off` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `available_credit` on the `ClientGroup` table. All the data in the column will be lost.
  - You are about to drop the column `client_info` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `provider_info` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `service_description` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `credit_applied` on the `Payment` table. All the data in the column will be lost.
  - You are about to alter the column `rate` on the `PracticeService` table. The data in that column could be lost. The data in that column will be cast from `Decimal(32,16)` to `Decimal(10,2)`.
  - Made the column `clinician_id` on table `Invoice` required. This step will fail if there are existing NULL values in that column.

*/
BEGIN TRY

BEGIN TRAN;


-- Drop default constraint from available_credit column
ALTER TABLE [ClientGroup] DROP CONSTRAINT [ClientGroup_available_credit_df];

-- DropForeignKey
ALTER TABLE [dbo].[Invoice] DROP CONSTRAINT [FK_Invoice_Clinician];

-- AlterTable
ALTER TABLE [dbo].[Appointment] DROP COLUMN [adjustable_amount],
[write_off];

-- AlterTable
ALTER TABLE [dbo].[ClientGroup] DROP COLUMN [available_credit];

-- AlterTable
ALTER TABLE [dbo].[Invoice] ALTER COLUMN [clinician_id] UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE [dbo].[Invoice] DROP COLUMN [client_info],
[notes],
[provider_info],
[service_description],
[type];

-- AlterTable
ALTER TABLE [dbo].[Payment] DROP COLUMN [credit_applied];

-- AlterTable
ALTER TABLE [dbo].[PracticeService] ALTER COLUMN [rate] DECIMAL(10,2) NOT NULL;

-- CreateTable
CREATE TABLE [dbo].[Product] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [Product_id_df] DEFAULT newid(),
    [name] VARCHAR(255) NOT NULL,
    [price] DECIMAL(10,2) NOT NULL,
    CONSTRAINT [Product_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Invoice] ADD CONSTRAINT [FK_Invoice_Clinician] FOREIGN KEY ([clinician_id]) REFERENCES [dbo].[Clinician]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
