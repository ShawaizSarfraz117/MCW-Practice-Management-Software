BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Appointment] DROP CONSTRAINT [DF__Appointme__is_al__39836D4D];
ALTER TABLE [dbo].[Appointment] ADD CONSTRAINT [Appointment_isAllDay_default] DEFAULT 0 FOR [is_all_day];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
