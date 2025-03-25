BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Appointment] DROP CONSTRAINT [DF_Appointment_isAllDay],
[DF_Appointment_isRecurring];
ALTER TABLE [dbo].[Appointment] ADD CONSTRAINT [DF_Appointment_IsAllDay] DEFAULT 0 FOR [is_all_day], CONSTRAINT [DF_Appointment_IsRecurring] DEFAULT 0 FOR [is_recurring];

-- AlterTable
ALTER TABLE [dbo].[AppointmentTag] DROP CONSTRAINT [DF_AppointmentTag_Id];
ALTER TABLE [dbo].[AppointmentTag] ADD CONSTRAINT [DF_AppointmentTag_ID] DEFAULT newid() FOR [id];

-- AlterTable
ALTER TABLE [dbo].[Audit] DROP CONSTRAINT [DF_Audit_Id],
[DF__Audit__is_hipaa__18E19391];
ALTER TABLE [dbo].[Audit] ADD CONSTRAINT [DF_Audit_ID] DEFAULT newid() FOR [Id], CONSTRAINT [DF_Audit_IsHipaa] DEFAULT 0 FOR [is_hipaa];

-- AlterTable
ALTER TABLE [dbo].[Client] DROP CONSTRAINT [DF_Client_id],
[DF__Client__is_activ__30EE274C],
[DF__Client__is_waitl__2F05DEDA];
ALTER TABLE [dbo].[Client] ADD CONSTRAINT [DF_Client_IsActive] DEFAULT 1 FOR [is_active], CONSTRAINT [DF_Client_IsWaitlist] DEFAULT 0 FOR [is_waitlist], CONSTRAINT [PK_Client_ID] DEFAULT newid() FOR [id];

-- AlterTable
ALTER TABLE [dbo].[ClientContact] DROP CONSTRAINT [DF_ClientContact_id],
[DF__ClientCon__is_pr__49B9D516];
ALTER TABLE [dbo].[ClientContact] ADD CONSTRAINT [DF_ClientContact_IsPrimary] DEFAULT 0 FOR [is_primary], CONSTRAINT [PK_ClientContact_ID] DEFAULT newid() FOR [id];

-- AlterTable
ALTER TABLE [dbo].[ClientGroupMembership] DROP CONSTRAINT [DF_ClientGroupMembership_id],
[DF__GroupClie__is_co__71C7C670];
EXEC SP_RENAME N'dbo.GroupClient_pkey', N'PK_ClientGroupMembership_ID';
ALTER TABLE [dbo].[ClientGroupMembership] ADD CONSTRAINT [DF_ClientGroupMembership_ID] DEFAULT newid() FOR [client_group_id], CONSTRAINT [DF_ClientGroupMembership_IsContactOnly] DEFAULT 0 FOR [is_contact_only];

-- AlterTable
ALTER TABLE [dbo].[ClientReminderPreference] DROP CONSTRAINT [DF_ClientReminderPreference_id],
[DF__ClientRem__is_en__524F1B17];
ALTER TABLE [dbo].[ClientReminderPreference] ADD CONSTRAINT [DF_ClientReminderPreference_IsEnabled] DEFAULT 1 FOR [is_enabled], CONSTRAINT [PK_ClientReminderPreference_ID] DEFAULT newid() FOR [id];

-- AlterTable
ALTER TABLE [dbo].[Clinician] DROP CONSTRAINT [DF_Clinician_id],
[DF__Clinician__is_ac__2764BD12];
ALTER TABLE [dbo].[Clinician] ADD CONSTRAINT [DF_Clinician_IsActive] DEFAULT 1 FOR [is_active], CONSTRAINT [PK_Clinician_ID] DEFAULT newid() FOR [id];

-- AlterTable
ALTER TABLE [dbo].[ClinicianClient] DROP CONSTRAINT [DF__Clinician__is_pr__4218B34E];
EXEC SP_RENAME N'dbo.ClinicianClient_pkey', N'PK_ClinicianClient_ID';
ALTER TABLE [dbo].[ClinicianClient] ADD CONSTRAINT [DF_ClinicianClient_IsPrimary] DEFAULT 0 FOR [is_primary];

-- AlterTable
ALTER TABLE [dbo].[ClinicianLocation] DROP CONSTRAINT [DF__Clinician__is_pr__3F3C46A3];
EXEC SP_RENAME N'dbo.ClinicianLocation_pkey', N'PK_ClinicianLocation_ID';
ALTER TABLE [dbo].[ClinicianLocation] ADD CONSTRAINT [DF_ClinicianLocation_IsPrimary] DEFAULT 0 FOR [is_primary];

-- AlterTable
ALTER TABLE [dbo].[ClinicianServices] DROP CONSTRAINT [DF__Clinician__is_ac__45E94432];
EXEC SP_RENAME N'dbo.ClinicianServices_pkey', N'PK_ClinicianServices_ID';
ALTER TABLE [dbo].[ClinicianServices] ADD CONSTRAINT [DF_ClinicianServices_IsActive] DEFAULT 1 FOR [is_active];

-- AlterTable
ALTER TABLE [dbo].[CreditCard] DROP CONSTRAINT [DF_CreditCard_id],
[DF__CreditCar__is_de__010A0A00];
ALTER TABLE [dbo].[CreditCard] ADD CONSTRAINT [DF_CreditCard_IsDefault] DEFAULT 0 FOR [is_default], CONSTRAINT [PK_CreditCard_ID] DEFAULT newid() FOR [id];

-- AlterTable
ALTER TABLE [dbo].[Invoice] DROP CONSTRAINT [DF_Invoice_id];
ALTER TABLE [dbo].[Invoice] ADD CONSTRAINT [PK_Invoice_ID] DEFAULT newid() FOR [id];

-- AlterTable
ALTER TABLE [dbo].[Location] DROP CONSTRAINT [DF_Location_id],
[DF__Location__is_act__22A007F5];
ALTER TABLE [dbo].[Location] ADD CONSTRAINT [DF_Location_IsActive] DEFAULT 1 FOR [is_active], CONSTRAINT [PK_Location_ID] DEFAULT newid() FOR [id];

-- AlterTable
ALTER TABLE [dbo].[Payment] DROP CONSTRAINT [DF_Payment_id];
ALTER TABLE [dbo].[Payment] ADD CONSTRAINT [PK_Payment_ID] DEFAULT newid() FOR [id];

-- AlterTable
ALTER TABLE [dbo].[PracticeService] DROP CONSTRAINT [DF_PracticeService_id];
ALTER TABLE [dbo].[PracticeService] ADD CONSTRAINT [PK_PracticeService_ID] DEFAULT newid() FOR [id];

-- AlterTable
ALTER TABLE [dbo].[Role] DROP CONSTRAINT [DF_Role_id];
ALTER TABLE [dbo].[Role] ADD CONSTRAINT [PK_Role_ID] DEFAULT newid() FOR [id];

-- AlterTable
ALTER TABLE [dbo].[SurveyAnswers] DROP CONSTRAINT [DF_SurveyAnswers_id];
ALTER TABLE [dbo].[SurveyAnswers] ADD CONSTRAINT [DF_SurveyAnswers_ID] DEFAULT newid() FOR [id];

-- AlterTable
ALTER TABLE [dbo].[SurveyTemplate] DROP CONSTRAINT [DF_SurveyTemplate_id],
[DF__DocumentT__is_ac__34BEB830],
[DF__SurveyTem__requi__141CDE74];
ALTER TABLE [dbo].[SurveyTemplate] ADD CONSTRAINT [DF_SurveyTemplate_ID] DEFAULT newid() FOR [id], CONSTRAINT [DF_SurveyTemplate_IsActive] DEFAULT 1 FOR [is_active], CONSTRAINT [DF_SurveyTemplate_RequiresSignature] DEFAULT 0 FOR [requires_signature];

-- AlterTable
ALTER TABLE [dbo].[Tag] DROP CONSTRAINT [DF_Tag_id];
ALTER TABLE [dbo].[Tag] ADD CONSTRAINT [DF_Tag_ID] DEFAULT newid() FOR [id];

-- AlterTable
ALTER TABLE [dbo].[User] DROP CONSTRAINT [DF_User_id];
ALTER TABLE [dbo].[User] ADD CONSTRAINT [PK_User_ID] DEFAULT newid() FOR [id];

-- AlterTable
EXEC SP_RENAME N'dbo.UserRole_pkey', N'PK_UserRole_ID';

-- RenameForeignKey
EXEC sp_rename 'dbo.Appointment_client_id_fkey', 'FK_Appointment_Client', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.Appointment_clinician_id_fkey', 'FK_Appointment_Clinician', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.Appointment_created_by_fkey', 'FK_Appointment_User', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.Appointment_location_id_fkey', 'FK_Appointment_Location', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.Appointment_recurring_root_id_fkey', 'FK_Appointment_RecurringAppointment', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.Appointment_service_id_fkey', 'FK_Appointment_PracticeService', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.Client_primary_clinician_id_fkey', 'FK_Client_Clinician', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.Client_primary_location_id_fkey', 'FK_Client_Location', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.ClientContact_client_id_fkey', 'FK_ClientContact_Client', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.ClientGroupMembership_client_id_fkey', 'FK_ClientGroupMembership_Client', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.ClientReminderPreference_client_id_fkey', 'FK_ClientReminderPreference_Client', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.Clinician_user_id_fkey', 'FK_Clinician_User', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.ClinicianClient_client_id_fkey', 'FK_ClinicianClient_Client', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.ClinicianClient_clinician_id_fkey', 'FK_ClinicianClient_Clinician', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.ClinicianLocation_clinician_id_fkey', 'FK_ClinicianLocation_Clinician', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.ClinicianLocation_location_id_fkey', 'FK_ClinicianLocation_Location', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.ClinicianServices_clinician_id_fkey', 'FK_ClinicianServices_Clinician', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.ClinicianServices_service_id_fkey', 'FK_ClinicianServices_PracticeService', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.CreditCard_client_id_fkey', 'FK_CreditCard_Client', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.Invoice_appointment_id_fkey', 'FK_Invoice_Appointment', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.Invoice_client_group_id_fkey', 'FK_Invoice_ClientGroup', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.Invoice_clinician_id_fkey', 'FK_Invoice_Clinician', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.Payment_credit_card_id_fkey', 'FK_Payment_CreditCard', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.Payment_invoice_id_fkey', 'FK_Payment_Invoice', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.ClientDocument_client_id_fkey', 'FK_SurveyAnswers_Client', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.ClientDocument_template_id_fkey', 'FK_SurveyAnswers_SurveyTemplate', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.UserRole_role_id_fkey', 'FK_UserRole_Role', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.UserRole_user_id_fkey', 'FK_UserRole_User', 'OBJECT';

-- RenameIndex
EXEC SP_RENAME N'dbo.ClientGroupMembership.IX_GroupClient_client_id', N'IX_ClientGroupMembership_client_id', N'INDEX';

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
