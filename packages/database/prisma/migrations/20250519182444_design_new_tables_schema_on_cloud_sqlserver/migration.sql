/*
  Warnings:

  - You are about to drop the column `status` on the `ClientGroupFile` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `Superbill` table. All the data in the column will be lost.
  - You are about to drop the column `appointment_id` on the `Superbill` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosis_code` on the `Superbill` table. All the data in the column will be lost.
  - You are about to drop the column `paid_amount` on the `Superbill` table. All the data in the column will be lost.
  - You are about to drop the column `pos` on the `Superbill` table. All the data in the column will be lost.
  - You are about to drop the column `service_code` on the `Superbill` table. All the data in the column will be lost.
  - You are about to drop the column `service_description` on the `Superbill` table. All the data in the column will be lost.
  - You are about to drop the column `units` on the `Superbill` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Superbill] DROP CONSTRAINT [FK_Superbill_Appointment];

-- DropIndex
DROP INDEX [IX_Superbill_appointment_id] ON [dbo].[Superbill];

-- AlterTable
ALTER TABLE [dbo].[Appointment] ADD [superbill_id] UNIQUEIDENTIFIER;

-- AlterTable
ALTER TABLE [dbo].[Client] ADD [access_billing_documents] BIT NOT NULL CONSTRAINT [DF_Client_access_billing_documents] DEFAULT 0,
[allow_online_appointment] BIT NOT NULL CONSTRAINT [DF_Client_allow_online_appointment] DEFAULT 0,
[use_secure_messaging] BIT NOT NULL CONSTRAINT [DF_Client_use_secure_messaging] DEFAULT 0;

-- AlterTable
ALTER TABLE [dbo].[ClientGroup] ADD [auto_monthly_statement_enabled] BIT CONSTRAINT [DF_ClientGroup_auto_monthly_statement_enabled] DEFAULT 0,
[auto_monthly_superbill_enabled] BIT CONSTRAINT [DF_ClientGroup_auto_monthly_superbill_enabled] DEFAULT 0;

-- AlterTable
ALTER TABLE [dbo].[ClientGroupFile] ALTER COLUMN [url] TEXT NULL;
-- First drop the default constraint
IF EXISTS (SELECT * FROM sys.default_constraints WHERE name = 'ClientGroupFile_status_df')
    ALTER TABLE [dbo].[ClientGroupFile] DROP CONSTRAINT [ClientGroupFile_status_df];
-- Then drop the column
ALTER TABLE [dbo].[ClientGroupFile] DROP COLUMN [status];
ALTER TABLE [dbo].[ClientGroupFile] ADD [survey_template_id] UNIQUEIDENTIFIER;

-- AlterTable
ALTER TABLE [dbo].[Statement] ADD [issued_date] DATETIME2;

-- AlterTable
-- Drop default constraints first for each column that might have one
IF EXISTS (SELECT * FROM sys.default_constraints WHERE name = 'Superbill_amount_df')
    ALTER TABLE [dbo].[Superbill] DROP CONSTRAINT [Superbill_amount_df];
IF EXISTS (SELECT * FROM sys.default_constraints WHERE name = 'Superbill_appointment_id_df')
    ALTER TABLE [dbo].[Superbill] DROP CONSTRAINT [Superbill_appointment_id_df];
IF EXISTS (SELECT * FROM sys.default_constraints WHERE name = 'Superbill_diagnosis_code_df')
    ALTER TABLE [dbo].[Superbill] DROP CONSTRAINT [Superbill_diagnosis_code_df];
IF EXISTS (SELECT * FROM sys.default_constraints WHERE name = 'Superbill_paid_amount_df')
    ALTER TABLE [dbo].[Superbill] DROP CONSTRAINT [Superbill_paid_amount_df];
IF EXISTS (SELECT * FROM sys.default_constraints WHERE name = 'Superbill_pos_df')
    ALTER TABLE [dbo].[Superbill] DROP CONSTRAINT [Superbill_pos_df];
IF EXISTS (SELECT * FROM sys.default_constraints WHERE name = 'Superbill_service_code_df')
    ALTER TABLE [dbo].[Superbill] DROP CONSTRAINT [Superbill_service_code_df];
IF EXISTS (SELECT * FROM sys.default_constraints WHERE name = 'Superbill_service_description_df')
    ALTER TABLE [dbo].[Superbill] DROP CONSTRAINT [Superbill_service_description_df];
IF EXISTS (SELECT * FROM sys.default_constraints WHERE name = 'Superbill_units_df')
    ALTER TABLE [dbo].[Superbill] DROP CONSTRAINT [Superbill_units_df];

-- Now drop the columns
ALTER TABLE [dbo].[Superbill] DROP COLUMN [amount],
[appointment_id],
[diagnosis_code],
[paid_amount],
[pos],
[service_code],
[service_description],
[units];

-- AlterTable
ALTER TABLE [dbo].[SurveyAnswers] ADD [is_intake] BIT NOT NULL CONSTRAINT [DF_SurveyAnswers_is_intake] DEFAULT 0;

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

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
