BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Appointment] DROP CONSTRAINT [Appointment_isAllDay_default],
[DF__Appointme__is_re__3A779186];
ALTER TABLE [dbo].[Appointment] ADD CONSTRAINT [DF_Appointment_isAllDay] DEFAULT 0 FOR [is_all_day], CONSTRAINT [DF_Appointment_isRecurring] DEFAULT 0 FOR [is_recurring];

-- AlterTable
ALTER TABLE [dbo].[AppointmentTag] DROP CONSTRAINT [DF__AppointmentT__id__2DDCB077];
EXEC SP_RENAME N'dbo.PK__Appointm__3213E83F5CC0D1B3', N'PK_AppointmentTag_ID';
ALTER TABLE [dbo].[AppointmentTag] ADD CONSTRAINT [DF_AppointmentTag_Id] DEFAULT newid() FOR [id];

-- AlterTable
ALTER TABLE [dbo].[Audit] DROP CONSTRAINT [DF__Audit__Id__16F94B1F];
EXEC SP_RENAME N'dbo.PK__Audit__3214EC0710FE1A60', N'PK_Audit_ID';
ALTER TABLE [dbo].[Audit] ADD CONSTRAINT [DF_Audit_Id] DEFAULT newid() FOR [Id];

-- AlterTable
ALTER TABLE [dbo].[Client] DROP CONSTRAINT [DF__Client__id__2E11BAA1];
ALTER TABLE [dbo].[Client] ADD CONSTRAINT [DF_Client_id] DEFAULT newid() FOR [id];

-- AlterTable
ALTER TABLE [dbo].[ClientContact] DROP CONSTRAINT [DF__ClientContac__id__48C5B0DD];
ALTER TABLE [dbo].[ClientContact] ADD CONSTRAINT [DF_ClientContact_id] DEFAULT newid() FOR [id];

-- AlterTable
EXEC SP_RENAME N'dbo.PK_ClientGroup', N'PK_ClientGroup_ID';

-- AlterTable
ALTER TABLE [dbo].[ClientGroupMembership] DROP CONSTRAINT [DF__GroupClient__id__6D031153];
ALTER TABLE [dbo].[ClientGroupMembership] ADD CONSTRAINT [DF_ClientGroupMembership_id] DEFAULT newid() FOR [client_group_id];

-- AlterTable
ALTER TABLE [dbo].[ClientReminderPreference] DROP CONSTRAINT [DF__ClientRemind__id__515AF6DE];
ALTER TABLE [dbo].[ClientReminderPreference] ADD CONSTRAINT [DF_ClientReminderPreference_id] DEFAULT newid() FOR [id];

-- AlterTable
ALTER TABLE [dbo].[Clinician] DROP CONSTRAINT [DF__Clinician__id__267098D9];
ALTER TABLE [dbo].[Clinician] ADD CONSTRAINT [DF_Clinician_id] DEFAULT newid() FOR [id];

-- AlterTable
ALTER TABLE [dbo].[CreditCard] DROP CONSTRAINT [DF__CreditCard__id__0015E5C7];
ALTER TABLE [dbo].[CreditCard] ADD CONSTRAINT [DF_CreditCard_id] DEFAULT newid() FOR [id];

-- AlterTable
ALTER TABLE [dbo].[Invoice] DROP CONSTRAINT [DF__Invoice__id__7C4554E3];
ALTER TABLE [dbo].[Invoice] ADD CONSTRAINT [DF_Invoice_id] DEFAULT newid() FOR [id];

-- AlterTable
ALTER TABLE [dbo].[Location] DROP CONSTRAINT [DF__Location__id__21ABE3BC];
ALTER TABLE [dbo].[Location] ADD CONSTRAINT [DF_Location_id] DEFAULT newid() FOR [id];

-- AlterTable
ALTER TABLE [dbo].[Payment] DROP CONSTRAINT [DF__Payment__id__04DA9AE4];
ALTER TABLE [dbo].[Payment] ADD CONSTRAINT [DF_Payment_id] DEFAULT newid() FOR [id];

-- AlterTable
ALTER TABLE [dbo].[PracticeService] DROP CONSTRAINT [DF__PracticeServ__id__2B354DF6];
ALTER TABLE [dbo].[PracticeService] ADD CONSTRAINT [DF_PracticeService_id] DEFAULT newid() FOR [id];

-- AlterTable
ALTER TABLE [dbo].[Role] DROP CONSTRAINT [DF__Role__id__1AFEE62D];
ALTER TABLE [dbo].[Role] ADD CONSTRAINT [DF_Role_id] DEFAULT newid() FOR [id];

-- AlterTable
ALTER TABLE [dbo].[SurveyAnswers] DROP CONSTRAINT [DF__ClientDocume__id__4C9641C1];
EXEC SP_RENAME N'dbo.ClientDocument_pkey', N'PK_SurveyAnswers_ID';
ALTER TABLE [dbo].[SurveyAnswers] ADD CONSTRAINT [DF_SurveyAnswers_id] DEFAULT newid() FOR [id];

-- AlterTable
ALTER TABLE [dbo].[SurveyTemplate] DROP CONSTRAINT [DF__DocumentTemp__id__33CA93F7];
EXEC SP_RENAME N'dbo.DocumentTemplate_pkey', N'PK_SurveyTemplate_ID';
ALTER TABLE [dbo].[SurveyTemplate] ADD CONSTRAINT [DF_SurveyTemplate_id] DEFAULT newid() FOR [id];

-- AlterTable
EXEC SP_RENAME N'dbo.PK__sysdiagr__C2B05B610A67E8C9', N'PK_sysdiagrams_ID';

-- AlterTable
ALTER TABLE [dbo].[Tag] DROP CONSTRAINT [DF__Tag__id__2A0C1F93];
EXEC SP_RENAME N'dbo.PK__Tag__3213E83FFA70F600', N'PK_Tag_ID';
ALTER TABLE [dbo].[Tag] ADD CONSTRAINT [DF_Tag_id] DEFAULT newid() FOR [id];

-- AlterTable
ALTER TABLE [dbo].[User] DROP CONSTRAINT [DF__User__id__1ECF7711];
ALTER TABLE [dbo].[User] ADD CONSTRAINT [DF_User_id] DEFAULT newid() FOR [id];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
