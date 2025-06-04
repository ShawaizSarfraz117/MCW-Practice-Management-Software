/*
  Warnings:

  - A unique constraint covering the columns `[client_id,reminder_type,channel]` on the table `ClientReminderPreference` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `channel` to the `ClientReminderPreference` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contact_id` to the `ClientReminderPreference` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropIndex
ALTER TABLE [dbo].[ClientReminderPreference] DROP CONSTRAINT [ClientReminderPreference_client_id_reminder_type_key];

-- AlterTable
ALTER TABLE [dbo].[ClientReminderPreference] ADD [channel] NVARCHAR(1000) NOT NULL,
[contact_id] UNIQUEIDENTIFIER NOT NULL;

-- CreateIndex
ALTER TABLE [dbo].[ClientReminderPreference] ADD CONSTRAINT [ClientReminderPreference_client_id_reminder_type_channel_key] UNIQUE NONCLUSTERED ([client_id], [reminder_type], [channel]);

-- AddForeignKey
ALTER TABLE [dbo].[ClientReminderPreference] ADD CONSTRAINT [FK_ClientReminderPreference_ClientContact] FOREIGN KEY ([contact_id]) REFERENCES [dbo].[ClientContact]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
