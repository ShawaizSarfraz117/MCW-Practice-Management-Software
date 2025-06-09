BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Availability] ADD [recurring_availability_id] UNIQUEIDENTIFIER;

-- AddForeignKey
ALTER TABLE [dbo].[Availability] ADD CONSTRAINT [FK_Availability_RecurringAvailability] FOREIGN KEY ([recurring_availability_id]) REFERENCES [dbo].[Availability]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AvailabilityServices] ADD CONSTRAINT [FK_AvailabilityServices_PracticeService] FOREIGN KEY ([service_id]) REFERENCES [dbo].[PracticeService]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
