BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Appointment] ADD [created_at] DATETIME NOT NULL CONSTRAINT [Appointment_created_at_df] DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE [dbo].[ClientGroupChartNote] ADD [created_at] DATETIME NOT NULL CONSTRAINT [ClientGroupChartNote_created_at_df] DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE [dbo].[DiagnosisTreatmentPlan] ADD [client_group_id] UNIQUEIDENTIFIER;

-- AlterTable
ALTER TABLE [dbo].[GoodFaithEstimate] ADD [client_group_id] UNIQUEIDENTIFIER,
[created_at] DATETIME NOT NULL CONSTRAINT [GoodFaithEstimate_created_at_df] DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE [dbo].[SurveyAnswers] ADD [client_group_id] UNIQUEIDENTIFIER,
[created_at] DATETIME NOT NULL CONSTRAINT [SurveyAnswers_created_at_df] DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_DiagnosisTreatmentPlan_ClientGroupId] ON [dbo].[DiagnosisTreatmentPlan]([client_group_id]);

-- AddForeignKey
ALTER TABLE [dbo].[SurveyAnswers] ADD CONSTRAINT [FK_SurveyAnswers_ClientGroup] FOREIGN KEY ([client_group_id]) REFERENCES [dbo].[ClientGroup]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DiagnosisTreatmentPlan] ADD CONSTRAINT [FK_DiagnosisTreatmentPlan_ClientGroup] FOREIGN KEY ([client_group_id]) REFERENCES [dbo].[ClientGroup]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[GoodFaithEstimate] ADD CONSTRAINT [FK_GoodFaithEstimate_ClientGroup] FOREIGN KEY ([client_group_id]) REFERENCES [dbo].[ClientGroup]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
