/*
  Warnings:

  - You are about to drop the column `client_id` on the `Appointment` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Appointment] DROP CONSTRAINT [FK_Appointment_Client];

-- AlterTable
ALTER TABLE [dbo].[Appointment] DROP COLUMN [client_id];
ALTER TABLE [dbo].[Appointment] ADD [client_group_id] UNIQUEIDENTIFIER;

-- AddForeignKey
ALTER TABLE [dbo].[Appointment] ADD CONSTRAINT [FK_Appointment_ClientGroup] FOREIGN KEY ([client_group_id]) REFERENCES [dbo].[ClientGroup]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
