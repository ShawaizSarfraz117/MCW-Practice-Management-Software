/*
  Warnings:

  - You are about to drop the column `end_time` on the `Availability` table. All the data in the column will be lost.
  - You are about to drop the column `start_time` on the `Availability` table. All the data in the column will be lost.
  - Added the required column `end_date` to the `Availability` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_date` to the `Availability` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropIndex
DROP INDEX [IX_Availability_time_range] ON [dbo].[Availability];

-- AlterTable
ALTER TABLE [dbo].[Availability] DROP COLUMN [end_time],
[start_time];
ALTER TABLE [dbo].[Availability] ADD [allow_online_requests] BIT NOT NULL CONSTRAINT [Availability_allow_online_requests_df] DEFAULT 0,
[end_date] DATETIME2 NOT NULL,
[is_all_day] BIT NOT NULL CONSTRAINT [Availability_is_all_day_df] DEFAULT 0,
[location] VARCHAR(255),
[start_date] DATETIME2 NOT NULL,
[title] VARCHAR(255);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Availability_time_range] ON [dbo].[Availability]([start_date], [end_date]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
