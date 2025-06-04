/*
  Warnings:

  - You are about to drop the column `allow_online_requests` on the `Availability` table. All the data in the column will be lost.
  - You are about to drop the column `end_date` on the `Availability` table. All the data in the column will be lost.
  - You are about to drop the column `is_all_day` on the `Availability` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Availability` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `Availability` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Availability` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropIndex
DROP INDEX [IX_Availability_time_range] ON [dbo].[Availability];
-- Drop Constraints manually
ALTER TABLE [dbo].[Availability] DROP CONSTRAINT [Availability_is_all_day_df];
ALTER TABLE [dbo].[Availability] DROP CONSTRAINT [Availability_allow_online_requests_df];
-- AlterTable
ALTER TABLE [dbo].[Availability] DROP COLUMN [allow_online_requests],
[end_date],
[is_all_day],
[location],
[start_date],
[title];
ALTER TABLE [dbo].[Availability] ADD [end_time] DATETIME2 NOT NULL CONSTRAINT [DF_Availability_EndTime] DEFAULT CURRENT_TIMESTAMP,
[start_time] DATETIME2 NOT NULL CONSTRAINT [DF_Availability_StartTime] DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE [dbo].[AppointmentLimit] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [AppointmentLimit_id_df] DEFAULT newid(),
    [date] DATE NOT NULL,
    [max_limit] INT NOT NULL CONSTRAINT [AppointmentLimit_max_limit_df] DEFAULT 10,
    [clinician_id] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [AppointmentLimit_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [AppointmentLimit_date_clinician_id_key] UNIQUE NONCLUSTERED ([date],[clinician_id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_AppointmentLimit_clinician_id] ON [dbo].[AppointmentLimit]([clinician_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_AppointmentLimit_date] ON [dbo].[AppointmentLimit]([date]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Availability_time_range] ON [dbo].[Availability]([start_time], [end_time]);

-- AddForeignKey
ALTER TABLE [dbo].[AppointmentLimit] ADD CONSTRAINT [AppointmentLimit_clinician_id_fkey] FOREIGN KEY ([clinician_id]) REFERENCES [dbo].[Clinician]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
