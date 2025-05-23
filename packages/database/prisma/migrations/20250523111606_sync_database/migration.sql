/*
  Warnings:

  - You are about to drop the column `location` on the `Availability` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `ClientGroupFile` table. All the data in the column will be lost.
  - You are about to drop the column `include_attachments` on the `EmailTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `EmailTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `is_enabled` on the `EmailTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `reminder_time` on the `EmailTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `send_to_client` on the `EmailTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `send_to_clinician` on the `EmailTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `send_to_practice` on the `EmailTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `PracticeInformation` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `Superbill` table. All the data in the column will be lost.
  - You are about to drop the column `appointment_id` on the `Superbill` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosis_code` on the `Superbill` table. All the data in the column will be lost.
  - You are about to drop the column `paid_amount` on the `Superbill` table. All the data in the column will be lost.
  - You are about to drop the column `pos` on the `Superbill` table. All the data in the column will be lost.
  - You are about to drop the column `service_code` on the `Superbill` table. All the data in the column will be lost.
  - You are about to drop the column `service_description` on the `Superbill` table. All the data in the column will be lost.
  - You are about to drop the column `units` on the `Superbill` table. All the data in the column will be lost.
  - The primary key for the `License` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `clinical_info_id` on the `License` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `License` table. The data in that column will be cast from `Int` to `String`. This cast may fail. Please make sure the data in the column can be cast.
  - Added the required column `location_id` to the `Availability` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clinician_id` to the `License` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;




-- AlterTable
ALTER TABLE [dbo].[Appointment] ADD [superbill_id] UNIQUEIDENTIFIER;

-- AlterTable
ALTER TABLE [dbo].[Availability] DROP COLUMN [location];
ALTER TABLE [dbo].[Availability] ADD [location_id] UNIQUEIDENTIFIER NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[BillingSettings] ALTER COLUMN [clinician_id] UNIQUEIDENTIFIER NULL;
ALTER TABLE [dbo].[BillingSettings] ALTER COLUMN [autoInvoiceCreation] VARCHAR(50) NULL;
ALTER TABLE [dbo].[BillingSettings] ALTER COLUMN [pastDueDays] INT NULL;
ALTER TABLE [dbo].[BillingSettings] ALTER COLUMN [emailClientPastDue] BIT NULL;
ALTER TABLE [dbo].[BillingSettings] ALTER COLUMN [invoiceIncludePracticeLogo] BIT NULL;
ALTER TABLE [dbo].[BillingSettings] ALTER COLUMN [superbillDayOfMonth] INT NULL;
ALTER TABLE [dbo].[BillingSettings] ALTER COLUMN [superbillIncludePracticeLogo] BIT NULL;
ALTER TABLE [dbo].[BillingSettings] ALTER COLUMN [superbillIncludeSignatureLine] BIT NULL;
ALTER TABLE [dbo].[BillingSettings] ALTER COLUMN [superbillIncludeDiagnosisDescription] BIT NULL;
ALTER TABLE [dbo].[BillingSettings] ALTER COLUMN [billingDocEmailDelayMinutes] INT NULL;
ALTER TABLE [dbo].[BillingSettings] ALTER COLUMN [createMonthlyStatementsForNewClients] BIT NULL;
ALTER TABLE [dbo].[BillingSettings] ALTER COLUMN [createMonthlySuperbillsForNewClients] BIT NULL;
ALTER TABLE [dbo].[BillingSettings] ALTER COLUMN [defaultNotificationMethod] VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE [dbo].[Client] ADD [access_billing_documents] BIT NOT NULL CONSTRAINT [DF_Client_access_billing_documents] DEFAULT 0,
[allow_online_appointment] BIT NOT NULL CONSTRAINT [DF_Client_allow_online_appointment] DEFAULT 0,
[use_secure_messaging] BIT NOT NULL CONSTRAINT [DF_Client_use_secure_messaging] DEFAULT 0;

-- AlterTable
ALTER TABLE [dbo].[ClientGroup] ADD [auto_monthly_statement_enabled] BIT CONSTRAINT [DF_ClientGroup_auto_monthly_statement_enabled] DEFAULT 0,
[auto_monthly_superbill_enabled] BIT CONSTRAINT [DF_ClientGroup_auto_monthly_superbill_enabled] DEFAULT 0;

-- AlterTable
ALTER TABLE [dbo].[ClientGroupFile] ALTER COLUMN [url] TEXT NULL;
ALTER TABLE [dbo].[ClientGroupFile] DROP CONSTRAINT [ClientGroupFile_status_df];
ALTER TABLE [dbo].[ClientGroupFile] DROP COLUMN [status];
ALTER TABLE [dbo].[ClientGroupFile] ADD [survey_template_id] UNIQUEIDENTIFIER;

-- AlterTable
ALTER TABLE [dbo].[Clinician] ADD [NPI_number] VARCHAR(250),
[speciality] VARCHAR(250),
[taxonomy_code] VARCHAR(250);

-- AlterTable
ALTER TABLE [dbo].[EmailTemplate] DROP CONSTRAINT [EmailTemplate_include_attachments_df];
ALTER TABLE [dbo].[EmailTemplate] DROP CONSTRAINT [EmailTemplate_is_active_df];
ALTER TABLE [dbo].[EmailTemplate] DROP CONSTRAINT [EmailTemplate_is_enabled_df];
ALTER TABLE [dbo].[EmailTemplate] DROP CONSTRAINT [EmailTemplate_send_to_client_df];
ALTER TABLE [dbo].[EmailTemplate] DROP CONSTRAINT [EmailTemplate_send_to_clinician_df];
ALTER TABLE [dbo].[EmailTemplate] DROP CONSTRAINT [EmailTemplate_send_to_practice_df];
ALTER TABLE [dbo].[EmailTemplate] DROP COLUMN [include_attachments],
[is_active],
[is_enabled],
[reminder_time],
[send_to_client],
[send_to_clinician],
[send_to_practice];
ALTER TABLE [dbo].[EmailTemplate] ADD [email_type] VARCHAR(250);

-- AlterTable
ALTER TABLE [dbo].[Invoice] ADD [is_exported] BIT NOT NULL CONSTRAINT [DF_Invoice_is_exported] DEFAULT 0;

-- AlterTable
ALTER TABLE [dbo].[PracticeInformation] DROP CONSTRAINT [FK_practiceInformation_User];
ALTER TABLE [dbo].[PracticeInformation] DROP COLUMN [user_id];
ALTER TABLE [dbo].[PracticeInformation] ADD [clinician_id] UNIQUEIDENTIFIER;

-- AlterTable
ALTER TABLE [dbo].[Statement] ADD [is_exported] BIT NOT NULL CONSTRAINT [DF_Statement_is_exported] DEFAULT 0,
[issued_date] DATETIME2;

-- AlterTable
ALTER TABLE [dbo].[Superbill] DROP CONSTRAINT [Superbill_units_df];
ALTER TABLE [dbo].[Superbill] DROP CONSTRAINT [FK_Superbill_Appointment];
DROP INDEX [IX_Superbill_appointment_id] ON [dbo].[Superbill];
ALTER TABLE [dbo].[Superbill] DROP COLUMN [amount],
[appointment_id],
[diagnosis_code],
[paid_amount],
[pos],
[service_code],
[service_description],
[units];
ALTER TABLE [dbo].[Superbill] ADD [is_exported] BIT NOT NULL CONSTRAINT [DF_Superbill_is_exported] DEFAULT 0;

-- AlterTable
ALTER TABLE [dbo].[SurveyAnswers] ADD [is_intake] BIT NOT NULL CONSTRAINT [DF_SurveyAnswers_is_intake] DEFAULT 0;

-- AlterTable
ALTER TABLE [dbo].[SurveyTemplate] ADD [is_default] BIT NOT NULL CONSTRAINT [DF_SurveyTemplate_is_default] DEFAULT 0,
[is_shareable] BIT NOT NULL CONSTRAINT [DF_SurveyTemplate_is_shareable] DEFAULT 0;

-- CreateTable
CREATE TABLE [dbo].[AppointmentNotes] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [appointment_id] UNIQUEIDENTIFIER NOT NULL,
    [type] VARCHAR(50) NOT NULL,
    [survey_answer_id] UNIQUEIDENTIFIER NOT NULL,
    [created_by] UNIQUEIDENTIFIER,
    [is_signed] BIT NOT NULL CONSTRAINT [DF_AppointmentNotes_is_signed] DEFAULT 0,
    [unlocked_by] UNIQUEIDENTIFIER,
    [unlocked_time] DATETIME2,
    [signed_name] VARCHAR(250),
    [signed_credentials] VARCHAR(250),
    [signed_time] DATETIME2,
    [signed_ipaddress] VARCHAR(50),
    CONSTRAINT [PK_AppointmentNotes] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ClientBillingPreferences] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [client_group_id] UNIQUEIDENTIFIER NOT NULL,
    [email_generated_invoices] BIT NOT NULL CONSTRAINT [DF_ClientBillingPreferences_email_generated_invoices] DEFAULT 0,
    [email_generated_statements] BIT NOT NULL CONSTRAINT [DF_ClientBillingPreferences_email_generated_statements] DEFAULT 0,
    [email_generated_superbills] BIT NOT NULL CONSTRAINT [DF_ClientBillingPreferences_email_generated_superbills] DEFAULT 0,
    [notify_new_invoices] BIT NOT NULL CONSTRAINT [DF_ClientBillingPreferences_notify_new_invoices] DEFAULT 0,
    [notify_new_statements] BIT NOT NULL CONSTRAINT [DF_ClientBillingPreferences_notify_new_statements] DEFAULT 0,
    [notify_new_superbills] BIT NOT NULL CONSTRAINT [DF_ClientBillingPreferences_notify_new_superbills] DEFAULT 0,
    CONSTRAINT [PK_ClientBillingPreferences] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ClientFiles] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [client_group_file_id] UNIQUEIDENTIFIER NOT NULL,
    [client_id] UNIQUEIDENTIFIER NOT NULL,
    [status] VARCHAR(50) NOT NULL,
    [survey_answers_id] UNIQUEIDENTIFIER,
    CONSTRAINT [PK_ClientFiles] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ClientGroupServices] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [client_group_id] UNIQUEIDENTIFIER NOT NULL,
    [service_id] UNIQUEIDENTIFIER NOT NULL,
    [custom_rate] DECIMAL(32,16) NOT NULL,
    CONSTRAINT [PK_ClientGroupServices] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Diagnosis] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF__Diagnosis__id__4F688CCB] DEFAULT newid(),
    [code] VARCHAR(50) NOT NULL,
    [description] VARCHAR(255) NOT NULL,
    CONSTRAINT [PK__Diagnosi__3213E83FF84A10BA] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[DiagnosisTreatmentPlan] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF__DiagnosisTre__id__5244F976] DEFAULT newid(),
    [client_id] UNIQUEIDENTIFIER NOT NULL,
    [created_at] DATETIME NOT NULL CONSTRAINT [DF__Diagnosis__creat__53391DAF] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME,
    [is_signed] NCHAR(10) CONSTRAINT [DF_DiagnosisTreatmentPlan_is_signed] DEFAULT '0',
    [title] VARCHAR(255) NOT NULL,
    [survey_answers_id] UNIQUEIDENTIFIER,
    CONSTRAINT [PK__Diagnosi__3213E83FDFE52E56] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[DiagnosisTreatmentPlanItem] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF__DiagnosisTre__id__58F1F705] DEFAULT newid(),
    [treatment_plan_id] UNIQUEIDENTIFIER NOT NULL,
    [diagnosis_id] UNIQUEIDENTIFIER NOT NULL,
    [custom_description] VARCHAR(255),
    CONSTRAINT [PK__Diagnosi__3213E83F425BBD2A] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[GoodFaithEstimate] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [client_id] UNIQUEIDENTIFIER NOT NULL,
    [clinician_id] UNIQUEIDENTIFIER NOT NULL,
    [client_name] VARCHAR(100),
    [client_dob] DATE,
    [client_address] VARCHAR(250),
    [client_city] VARCHAR(100),
    [client_state] VARCHAR(100),
    [client_zip_code] INT,
    [client_phone] VARCHAR(50),
    [client_email] VARCHAR(100),
    [clinician_npi] VARCHAR(100),
    [clinician_tin] VARCHAR(100),
    [clinician_location_id] UNIQUEIDENTIFIER NOT NULL,
    [contact_person_id] UNIQUEIDENTIFIER,
    [clinician_phone] VARCHAR(50),
    [clinician_email] VARCHAR(50),
    [provided_date] DATETIME,
    [expiration_date] DATETIME,
    [service_start_date] DATE,
    [service_end_date] DATE,
    [total_cost] INT NOT NULL,
    CONSTRAINT [PK_GoodFaithEstimate] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[GoodFaithServices] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [good_faith_id] UNIQUEIDENTIFIER NOT NULL,
    [service_id] UNIQUEIDENTIFIER NOT NULL,
    [diagnosis_id] UNIQUEIDENTIFIER NOT NULL,
    [location_id] UNIQUEIDENTIFIER NOT NULL,
    [quantity] INT NOT NULL,
    [fee] INT NOT NULL,
    CONSTRAINT [PK_GoodFaithServices] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[StatementItem] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [statement_id] UNIQUEIDENTIFIER NOT NULL,
    [date] DATETIME2 NOT NULL,
    [description] VARCHAR(255) NOT NULL,
    [charges] INT NOT NULL,
    [payments] INT NOT NULL,
    [balance] INT NOT NULL,
    CONSTRAINT [PK_StatementItem] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[AppointmentRequests] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [clinician_id] UNIQUEIDENTIFIER NOT NULL,
    [client_id] UNIQUEIDENTIFIER,
    [service_id] UNIQUEIDENTIFIER NOT NULL,
    [appointment_for] VARCHAR(50),
    [reasons_for_seeking_care] TEXT,
    [mental_health_history] TEXT,
    [additional_notes] TEXT,
    [start_time] DATETIME NOT NULL,
    [end_time] DATETIME NOT NULL,
    [status] VARCHAR(250) NOT NULL,
    [received_date] DATETIME NOT NULL,
    [updated_at] DATETIME,
    CONSTRAINT [PK_AppointmentRequests] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[AvailabilityServices] (
    [availability_id] UNIQUEIDENTIFIER NOT NULL,
    [service_id] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [PK_AvailabilityServices] PRIMARY KEY CLUSTERED ([availability_id],[service_id])
);

-- CreateTable
CREATE TABLE [dbo].[ClientPortalSettings] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [clinician_id] UNIQUEIDENTIFIER NOT NULL,
    [is_enabled] BIT NOT NULL CONSTRAINT [DF_ClientPortalSettings_is_client_portal_enabled] DEFAULT 0,
    [domain_url] VARCHAR(250),
    [is_appointment_requests_enabled] BIT,
    [appointment_start_times] VARCHAR(250),
    [request_minimum_notice] VARCHAR(250),
    [maximum_request_notice] VARCHAR(250),
    [allow_new_clients_request] BIT NOT NULL CONSTRAINT [DF_ClientPortalSettings_allow_new_clients_request] DEFAULT 0,
    [requests_from_new_individuals] BIT NOT NULL CONSTRAINT [DF_ClientPortalSettings_requests_from_new_individuals] DEFAULT 0,
    [requests_from_new_couples] BIT NOT NULL CONSTRAINT [DF_ClientPortalSettings_requests_from_new_couples] DEFAULT 0,
    [requests_from_new_contacts] BIT NOT NULL CONSTRAINT [DF_ClientPortalSettings_requests_from_new_contacts] DEFAULT 0,
    [is_prescreen_new_clinets] BIT NOT NULL CONSTRAINT [DF_ClientPortalSettings_is_prescreen_new_clinets] DEFAULT 0,
    [card_for_appointment_request] BIT NOT NULL CONSTRAINT [DF_ClientPortalSettings_card_for_appointment_request] DEFAULT 0,
    [is_upload_documents_allowed] BIT NOT NULL CONSTRAINT [DF_ClientPortalSettings_is_upload_documents_allowed] DEFAULT 0,
    [welcome_message] NVARCHAR(max),
    CONSTRAINT [PK_ClientPortalSettings] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[PracticeSettings] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [key] VARCHAR(250) NOT NULL,
    [value] NVARCHAR(max) NOT NULL,
    CONSTRAINT [PK_PracticeSettings] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ReminderTextTemplates] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [type] VARCHAR(250) NOT NULL,
    [content] TEXT NOT NULL,
    CONSTRAINT [PK_ReminderTextTemplates] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[RequestContactItems] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [appointment_request_id] UNIQUEIDENTIFIER NOT NULL,
    [type] VARCHAR(250) NOT NULL,
    [first_name] VARCHAR(250) NOT NULL,
    [last_name] VARCHAR(250) NOT NULL,
    [preferred_name] VARCHAR(250),
    [date_of_birth] DATE,
    [email] VARCHAR(250) NOT NULL,
    [phone] VARCHAR(250) NOT NULL,
    [payment_method] VARCHAR(250),
    [is_client_minor] BIT,
    CONSTRAINT [PK_RequestContactItems] PRIMARY KEY CLUSTERED ([id])
);

-- RedefineTables
BEGIN TRANSACTION;
DECLARE @SQL NVARCHAR(MAX) = N''
SELECT @SQL += N'ALTER TABLE '
    + QUOTENAME(OBJECT_SCHEMA_NAME(PARENT_OBJECT_ID))
    + '.'
    + QUOTENAME(OBJECT_NAME(PARENT_OBJECT_ID))
    + ' DROP CONSTRAINT '
    + OBJECT_NAME(OBJECT_ID) + ';'
FROM SYS.OBJECTS
WHERE TYPE_DESC LIKE '%CONSTRAINT'
    AND OBJECT_NAME(PARENT_OBJECT_ID) = 'License'
    AND SCHEMA_NAME(SCHEMA_ID) = 'dbo'
EXEC sp_executesql @SQL
;
CREATE TABLE [dbo].[_prisma_new_License] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_License_id] DEFAULT newid(),
    [clinician_id] UNIQUEIDENTIFIER NOT NULL,
    [license_type] NVARCHAR(1000) NOT NULL,
    [license_number] NVARCHAR(1000) NOT NULL,
    [expiration_date] DATETIME2 NOT NULL,
    [state] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [PK_License] PRIMARY KEY CLUSTERED ([id])
);
IF EXISTS(SELECT * FROM [dbo].[License])
    EXEC('INSERT INTO [dbo].[_prisma_new_License] ([expiration_date],[id],[license_number],[license_type],[state]) SELECT [expiration_date],[id],[license_number],[license_type],[state] FROM [dbo].[License] WITH (holdlock tablockx)');
DROP TABLE [dbo].[License];
EXEC SP_RENAME N'dbo._prisma_new_License', N'License';
COMMIT;

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Diagnosis_Code] ON [dbo].[Diagnosis]([code]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_DiagnosisTreatmentPlan_ClientId] ON [dbo].[DiagnosisTreatmentPlan]([client_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_DiagnosisTreatmentPlan_SurveyAnswersId] ON [dbo].[DiagnosisTreatmentPlan]([survey_answers_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_DiagnosisTreatmentPlanItem_DiagnosisId] ON [dbo].[DiagnosisTreatmentPlanItem]([diagnosis_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_DiagnosisTreatmentPlanItem_TreatmentPlanId] ON [dbo].[DiagnosisTreatmentPlanItem]([treatment_plan_id]);

-- AddForeignKey
ALTER TABLE [dbo].[Appointment] ADD CONSTRAINT [FK_Appointment_Superbill] FOREIGN KEY ([superbill_id]) REFERENCES [dbo].[Superbill]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Availability] ADD CONSTRAINT [FK_Availability_Location] FOREIGN KEY ([location_id]) REFERENCES [dbo].[Location]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PracticeInformation] ADD CONSTRAINT [FK_PracticeInformation_Clinician] FOREIGN KEY ([clinician_id]) REFERENCES [dbo].[Clinician]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AppointmentNotes] ADD CONSTRAINT [FK_AppointmentNotes_Appointment] FOREIGN KEY ([appointment_id]) REFERENCES [dbo].[Appointment]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AppointmentNotes] ADD CONSTRAINT [FK_AppointmentNotes_SurveyAnswers] FOREIGN KEY ([survey_answer_id]) REFERENCES [dbo].[SurveyAnswers]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ClientBillingPreferences] ADD CONSTRAINT [FK_ClientBillingPreferences_ClientGroup] FOREIGN KEY ([client_group_id]) REFERENCES [dbo].[ClientGroup]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ClientFiles] ADD CONSTRAINT [FK_ClientFiles_Client] FOREIGN KEY ([client_id]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ClientFiles] ADD CONSTRAINT [FK_ClientFiles_ClientGroupFile] FOREIGN KEY ([client_group_file_id]) REFERENCES [dbo].[ClientGroupFile]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ClientFiles] ADD CONSTRAINT [FK_ClientFiles_SurveyAnswers] FOREIGN KEY ([survey_answers_id]) REFERENCES [dbo].[SurveyAnswers]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ClientGroupServices] ADD CONSTRAINT [FK_ClientGroupServices_ClientGroup] FOREIGN KEY ([client_group_id]) REFERENCES [dbo].[ClientGroup]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ClientGroupServices] ADD CONSTRAINT [FK_ClientGroupServices_PracticeService] FOREIGN KEY ([service_id]) REFERENCES [dbo].[PracticeService]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DiagnosisTreatmentPlan] ADD CONSTRAINT [FK_DiagnosisTreatmentPlan_Client] FOREIGN KEY ([client_id]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DiagnosisTreatmentPlan] ADD CONSTRAINT [FK_DiagnosisTreatmentPlan_SurveyAnswers] FOREIGN KEY ([survey_answers_id]) REFERENCES [dbo].[SurveyAnswers]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DiagnosisTreatmentPlanItem] ADD CONSTRAINT [FK_DiagnosisTreatmentPlanItem_Diagnosis] FOREIGN KEY ([diagnosis_id]) REFERENCES [dbo].[Diagnosis]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DiagnosisTreatmentPlanItem] ADD CONSTRAINT [FK_DiagnosisTreatmentPlanItem_DiagnosisTreatmentPlan] FOREIGN KEY ([treatment_plan_id]) REFERENCES [dbo].[DiagnosisTreatmentPlan]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[GoodFaithEstimate] ADD CONSTRAINT [FK_GoodFaithEstimate_Client] FOREIGN KEY ([client_id]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[GoodFaithEstimate] ADD CONSTRAINT [FK_GoodFaithEstimate_Clinician] FOREIGN KEY ([clinician_id]) REFERENCES [dbo].[Clinician]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[GoodFaithEstimate] ADD CONSTRAINT [FK_GoodFaithEstimate_Location] FOREIGN KEY ([clinician_location_id]) REFERENCES [dbo].[Location]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[GoodFaithServices] ADD CONSTRAINT [FK_GoodFaithServices_Diagnosis] FOREIGN KEY ([diagnosis_id]) REFERENCES [dbo].[Diagnosis]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[GoodFaithServices] ADD CONSTRAINT [FK_GoodFaithServices_GoodFaithEstimate] FOREIGN KEY ([good_faith_id]) REFERENCES [dbo].[GoodFaithEstimate]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[GoodFaithServices] ADD CONSTRAINT [FK_GoodFaithServices_Location] FOREIGN KEY ([location_id]) REFERENCES [dbo].[Location]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[GoodFaithServices] ADD CONSTRAINT [FK_GoodFaithServices_PracticeService] FOREIGN KEY ([service_id]) REFERENCES [dbo].[PracticeService]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[StatementItem] ADD CONSTRAINT [FK_StatementItem_Statement] FOREIGN KEY ([statement_id]) REFERENCES [dbo].[Statement]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AppointmentRequests] ADD CONSTRAINT [FK_AppointmentRequests_PracticeService] FOREIGN KEY ([service_id]) REFERENCES [dbo].[PracticeService]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AvailabilityServices] ADD CONSTRAINT [FK_AvailabilityServices_Availability] FOREIGN KEY ([availability_id]) REFERENCES [dbo].[Availability]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[RequestContactItems] ADD CONSTRAINT [FK_RequestContactItems_AppointmentRequests] FOREIGN KEY ([appointment_request_id]) REFERENCES [dbo].[AppointmentRequests]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
