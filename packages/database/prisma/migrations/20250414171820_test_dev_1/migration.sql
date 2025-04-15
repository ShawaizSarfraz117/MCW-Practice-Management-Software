BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Appointment] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_Appointment_ID] DEFAULT newid(),
    [type] VARCHAR(50) NOT NULL,
    [title] VARCHAR(255),
    [is_all_day] BIT NOT NULL CONSTRAINT [DF_Appointment_IsAllDay] DEFAULT 0,
    [start_date] DATETIME2 NOT NULL,
    [end_date] DATETIME2 NOT NULL,
    [location_id] UNIQUEIDENTIFIER,
    [created_by] UNIQUEIDENTIFIER NOT NULL,
    [status] VARCHAR(100) NOT NULL,
    [client_id] UNIQUEIDENTIFIER,
    [clinician_id] UNIQUEIDENTIFIER,
    [appointment_fee] DECIMAL(32,16),
    [service_id] UNIQUEIDENTIFIER,
    [is_recurring] BIT NOT NULL CONSTRAINT [DF_Appointment_IsRecurring] DEFAULT 0,
    [recurring_rule] TEXT,
    [cancel_appointments] BIT,
    [notify_cancellation] BIT,
    [recurring_appointment_id] UNIQUEIDENTIFIER,
    CONSTRAINT [Appointment_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[AppointmentTag] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_AppointmentTag_ID] DEFAULT newid(),
    [appointment_id] UNIQUEIDENTIFIER NOT NULL,
    [tag_id] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [PK_AppointmentTag_ID] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_AppointmentTag_Appointment_Tag] UNIQUE NONCLUSTERED ([appointment_id],[tag_id])
);

-- CreateTable
CREATE TABLE [dbo].[Audit] (
    [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Audit_ID] DEFAULT newid(),
    [client_id] UNIQUEIDENTIFIER,
    [user_id] UNIQUEIDENTIFIER,
    [datetime] DATETIME NOT NULL CONSTRAINT [DF_Audit_Datetime] DEFAULT CURRENT_TIMESTAMP,
    [event_type] NCHAR(10),
    [event_text] NVARCHAR(255) NOT NULL,
    [is_hipaa] BIT NOT NULL CONSTRAINT [DF_Audit_IsHipaa] DEFAULT 0,
    CONSTRAINT [PK_Audit_ID] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Client] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_Client_ID] DEFAULT newid(),
    [legal_first_name] VARCHAR(100) NOT NULL,
    [legal_last_name] VARCHAR(100) NOT NULL,
    [is_waitlist] BIT NOT NULL CONSTRAINT [DF_Client_IsWaitlist] DEFAULT 0,
    [primary_clinician_id] UNIQUEIDENTIFIER,
    [primary_location_id] UNIQUEIDENTIFIER,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_Client_CreatedAt] DEFAULT CURRENT_TIMESTAMP,
    [is_active] BIT NOT NULL CONSTRAINT [DF_Client_IsActive] DEFAULT 1,
    [preferred_name] VARCHAR(100),
    [date_of_birth] DATE,
    [referred_by] VARCHAR(200),
    CONSTRAINT [Client_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ClientContact] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_ClientContact_ID] DEFAULT newid(),
    [client_id] UNIQUEIDENTIFIER NOT NULL,
    [is_primary] BIT NOT NULL CONSTRAINT [DF_ClientContact_IsPrimary] DEFAULT 0,
    [permission] VARCHAR(50) NOT NULL,
    [contact_type] VARCHAR(50) NOT NULL,
    [type] VARCHAR(50) NOT NULL,
    [value] VARCHAR(255) NOT NULL,
    CONSTRAINT [ClientContact_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ClientGroup] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [type] VARCHAR(150) NOT NULL,
    [name] VARCHAR(250) NOT NULL,
    CONSTRAINT [PK_ClientGroup_ID] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ClientGroupMembership] (
    [client_group_id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_ClientGroupMembership_ID] DEFAULT newid(),
    [client_id] UNIQUEIDENTIFIER NOT NULL,
    [role] VARCHAR(50),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_ClientGroupMembership_CreatedAt] DEFAULT CURRENT_TIMESTAMP,
    [is_contact_only] BIT NOT NULL CONSTRAINT [DF_ClientGroupMembership_IsContactOnly] DEFAULT 0,
    [is_responsible_for_billing] BIT,
    CONSTRAINT [PK_ClientGroupMembership_ID] PRIMARY KEY CLUSTERED ([client_group_id],[client_id])
);

-- CreateTable
CREATE TABLE [dbo].[ClientReminderPreference] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_ClientReminderPreference_ID] DEFAULT newid(),
    [client_id] UNIQUEIDENTIFIER NOT NULL,
    [reminder_type] VARCHAR(100) NOT NULL,
    [is_enabled] BIT NOT NULL CONSTRAINT [DF_ClientReminderPreference_IsEnabled] DEFAULT 1,
    CONSTRAINT [ClientReminderPreference_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ClientReminderPreference_client_id_reminder_type_key] UNIQUE NONCLUSTERED ([client_id],[reminder_type])
);

-- CreateTable
CREATE TABLE [dbo].[Clinician] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_Clinician_ID] DEFAULT newid(),
    [user_id] UNIQUEIDENTIFIER NOT NULL,
    [address] TEXT NOT NULL,
    [percentage_split] FLOAT(53) NOT NULL,
    [is_active] BIT NOT NULL CONSTRAINT [DF_Clinician_IsActive] DEFAULT 1,
    [first_name] VARCHAR(100) NOT NULL,
    [last_name] VARCHAR(100) NOT NULL,
    CONSTRAINT [Clinician_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Clinician_user_id_key] UNIQUE NONCLUSTERED ([user_id])
);

-- CreateTable
CREATE TABLE [dbo].[ClinicianClient] (
    [client_id] UNIQUEIDENTIFIER NOT NULL,
    [clinician_id] UNIQUEIDENTIFIER NOT NULL,
    [is_primary] BIT NOT NULL CONSTRAINT [DF_ClinicianClient_IsPrimary] DEFAULT 0,
    [assigned_date] DATETIME2 NOT NULL CONSTRAINT [DF_ClinicianClient_AssignedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_ClinicianClient_ID] PRIMARY KEY CLUSTERED ([client_id],[clinician_id])
);

-- CreateTable
CREATE TABLE [dbo].[ClinicianLocation] (
    [clinician_id] UNIQUEIDENTIFIER NOT NULL,
    [location_id] UNIQUEIDENTIFIER NOT NULL,
    [is_primary] BIT NOT NULL CONSTRAINT [DF_ClinicianLocation_IsPrimary] DEFAULT 0,
    CONSTRAINT [PK_ClinicianLocation_ID] PRIMARY KEY CLUSTERED ([clinician_id],[location_id])
);

-- CreateTable
CREATE TABLE [dbo].[ClinicianServices] (
    [clinician_id] UNIQUEIDENTIFIER NOT NULL,
    [service_id] UNIQUEIDENTIFIER NOT NULL,
    [custom_rate] DECIMAL(32,16),
    [is_active] BIT NOT NULL CONSTRAINT [DF_ClinicianServices_IsActive] DEFAULT 1,
    CONSTRAINT [PK_ClinicianServices_ID] PRIMARY KEY CLUSTERED ([clinician_id],[service_id])
);

-- CreateTable
CREATE TABLE [dbo].[CreditCard] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_CreditCard_ID] DEFAULT newid(),
    [client_id] UNIQUEIDENTIFIER NOT NULL,
    [card_type] VARCHAR(50) NOT NULL,
    [last_four] VARCHAR(4) NOT NULL,
    [expiry_month] INT NOT NULL,
    [expiry_year] INT NOT NULL,
    [cardholder_name] VARCHAR(100) NOT NULL,
    [is_default] BIT NOT NULL CONSTRAINT [DF_CreditCard_IsDefault] DEFAULT 0,
    [billing_address] TEXT,
    [token] VARCHAR(255),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_CreditCard_CreatedAt] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [CreditCard_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Invoice] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_Invoice_ID] DEFAULT newid(),
    [invoice_number] VARCHAR(50) NOT NULL,
    [client_group_id] UNIQUEIDENTIFIER,
    [appointment_id] UNIQUEIDENTIFIER,
    [clinician_id] UNIQUEIDENTIFIER NOT NULL,
    [issued_date] DATETIME2 NOT NULL CONSTRAINT [DF_Invoice_IssuedDate] DEFAULT CURRENT_TIMESTAMP,
    [due_date] DATETIME2 NOT NULL,
    [amount] DECIMAL(10,2) NOT NULL,
    [status] VARCHAR(50) NOT NULL,
    CONSTRAINT [Invoice_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Location] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_Location_ID] DEFAULT newid(),
    [name] VARCHAR(255) NOT NULL,
    [address] TEXT NOT NULL,
    [is_active] BIT NOT NULL CONSTRAINT [DF_Location_IsActive] DEFAULT 1,
    CONSTRAINT [Location_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Payment] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_Payment_ID] DEFAULT newid(),
    [invoice_id] UNIQUEIDENTIFIER NOT NULL,
    [payment_date] DATETIME2 NOT NULL CONSTRAINT [DF_Payment_PaymentDate] DEFAULT CURRENT_TIMESTAMP,
    [amount] DECIMAL(10,2) NOT NULL,
    [credit_card_id] UNIQUEIDENTIFIER,
    [transaction_id] VARCHAR(100),
    [status] VARCHAR(50) NOT NULL,
    [response] TEXT,
    CONSTRAINT [Payment_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[PracticeService] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_PracticeService_ID] DEFAULT newid(),
    [type] VARCHAR(255) NOT NULL,
    [rate] DECIMAL(32,16) NOT NULL,
    [code] VARCHAR(50) NOT NULL,
    [description] TEXT,
    [duration] INT NOT NULL,
    [color] VARCHAR(7),
    CONSTRAINT [PracticeService_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PracticeService_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[Role] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_Role_ID] DEFAULT newid(),
    [name] VARCHAR(255) NOT NULL,
    CONSTRAINT [Role_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Role_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[SurveyAnswers] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_SurveyAnswers_ID] DEFAULT newid(),
    [template_id] UNIQUEIDENTIFIER NOT NULL,
    [client_id] UNIQUEIDENTIFIER NOT NULL,
    [content] TEXT,
    [frequency] NCHAR(10),
    [completed_at] DATETIME2,
    [assigned_at] DATETIME2 NOT NULL CONSTRAINT [DF_SurveyAnswers_AssignedAt] DEFAULT CURRENT_TIMESTAMP,
    [expiry_date] DATETIME2,
    [status] VARCHAR(100) NOT NULL,
    [appointment_id] UNIQUEIDENTIFIER,
    [is_signed] BIT,
    [is_locked] BIT,
    CONSTRAINT [PK_SurveyAnswers_ID] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SurveyTemplate] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_SurveyTemplate_ID] DEFAULT newid(),
    [name] VARCHAR(255) NOT NULL,
    [content] TEXT NOT NULL,
    [frequency_options] NCHAR(10),
    [is_active] BIT NOT NULL CONSTRAINT [DF_SurveyTemplate_IsActive] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_SurveyTemplate_CreatedAt] DEFAULT CURRENT_TIMESTAMP,
    [description] TEXT,
    [updated_at] DATETIME2 NOT NULL,
    [type] VARCHAR(100) NOT NULL,
    [requires_signature] BIT NOT NULL CONSTRAINT [DF_SurveyTemplate_RequiresSignature] DEFAULT 0,
    CONSTRAINT [PK_SurveyTemplate_ID] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[sysdiagrams] (
    [name] NVARCHAR(128) NOT NULL,
    [principal_id] INT NOT NULL,
    [diagram_id] INT NOT NULL IDENTITY(1,1),
    [version] INT,
    [definition] VARBINARY(max),
    CONSTRAINT [PK_sysdiagrams_ID] PRIMARY KEY CLUSTERED ([diagram_id]),
    CONSTRAINT [UK_principal_name] UNIQUE NONCLUSTERED ([principal_id],[name])
);

-- CreateTable
CREATE TABLE [dbo].[Tag] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Tag_ID] DEFAULT newid(),
    [name] NVARCHAR(100) NOT NULL,
    [color] NVARCHAR(50),
    CONSTRAINT [PK_Tag_ID] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_User_ID] DEFAULT newid(),
    [email] VARCHAR(255) NOT NULL,
    [password_hash] VARCHAR(255) NOT NULL,
    [last_login] DATETIME2,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[UserRole] (
    [user_id] UNIQUEIDENTIFIER NOT NULL,
    [role_id] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [PK_UserRole_ID] PRIMARY KEY CLUSTERED ([user_id],[role_id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_AppointmentTag_appointment_id] ON [dbo].[AppointmentTag]([appointment_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_AppointmentTag_tag_id] ON [dbo].[AppointmentTag]([tag_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ClientGroupMembership_client_id] ON [dbo].[ClientGroupMembership]([client_id]);

-- AddForeignKey
ALTER TABLE [dbo].[Appointment] ADD CONSTRAINT [FK_Appointment_Client] FOREIGN KEY ([client_id]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Appointment] ADD CONSTRAINT [FK_Appointment_Clinician] FOREIGN KEY ([clinician_id]) REFERENCES [dbo].[Clinician]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Appointment] ADD CONSTRAINT [FK_Appointment_User] FOREIGN KEY ([created_by]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Appointment] ADD CONSTRAINT [FK_Appointment_Location] FOREIGN KEY ([location_id]) REFERENCES [dbo].[Location]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Appointment] ADD CONSTRAINT [FK_Appointment_RecurringAppointment] FOREIGN KEY ([recurring_appointment_id]) REFERENCES [dbo].[Appointment]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Appointment] ADD CONSTRAINT [FK_Appointment_PracticeService] FOREIGN KEY ([service_id]) REFERENCES [dbo].[PracticeService]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[AppointmentTag] ADD CONSTRAINT [FK_AppointmentTag_Appointment] FOREIGN KEY ([appointment_id]) REFERENCES [dbo].[Appointment]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AppointmentTag] ADD CONSTRAINT [FK_AppointmentTag_Tag] FOREIGN KEY ([tag_id]) REFERENCES [dbo].[Tag]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Audit] ADD CONSTRAINT [FK_Audit_Client] FOREIGN KEY ([client_id]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Audit] ADD CONSTRAINT [FK_Audit_User] FOREIGN KEY ([user_id]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Client] ADD CONSTRAINT [FK_Client_Clinician] FOREIGN KEY ([primary_clinician_id]) REFERENCES [dbo].[Clinician]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Client] ADD CONSTRAINT [FK_Client_Location] FOREIGN KEY ([primary_location_id]) REFERENCES [dbo].[Location]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ClientContact] ADD CONSTRAINT [FK_ClientContact_Client] FOREIGN KEY ([client_id]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ClientGroupMembership] ADD CONSTRAINT [FK_ClientGroupMembership_Client] FOREIGN KEY ([client_id]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ClientGroupMembership] ADD CONSTRAINT [FK_ClientGroupMembership_ClientGroup] FOREIGN KEY ([client_group_id]) REFERENCES [dbo].[ClientGroup]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ClientReminderPreference] ADD CONSTRAINT [FK_ClientReminderPreference_Client] FOREIGN KEY ([client_id]) REFERENCES [dbo].[Client]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Clinician] ADD CONSTRAINT [FK_Clinician_User] FOREIGN KEY ([user_id]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ClinicianClient] ADD CONSTRAINT [FK_ClinicianClient_Client] FOREIGN KEY ([client_id]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ClinicianClient] ADD CONSTRAINT [FK_ClinicianClient_Clinician] FOREIGN KEY ([clinician_id]) REFERENCES [dbo].[Clinician]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ClinicianLocation] ADD CONSTRAINT [FK_ClinicianLocation_Clinician] FOREIGN KEY ([clinician_id]) REFERENCES [dbo].[Clinician]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ClinicianLocation] ADD CONSTRAINT [FK_ClinicianLocation_Location] FOREIGN KEY ([location_id]) REFERENCES [dbo].[Location]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ClinicianServices] ADD CONSTRAINT [FK_ClinicianServices_Clinician] FOREIGN KEY ([clinician_id]) REFERENCES [dbo].[Clinician]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ClinicianServices] ADD CONSTRAINT [FK_ClinicianServices_PracticeService] FOREIGN KEY ([service_id]) REFERENCES [dbo].[PracticeService]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CreditCard] ADD CONSTRAINT [FK_CreditCard_Client] FOREIGN KEY ([client_id]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Invoice] ADD CONSTRAINT [FK_Invoice_Appointment] FOREIGN KEY ([appointment_id]) REFERENCES [dbo].[Appointment]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Invoice] ADD CONSTRAINT [FK_Invoice_ClientGroup] FOREIGN KEY ([client_group_id]) REFERENCES [dbo].[ClientGroup]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Invoice] ADD CONSTRAINT [FK_Invoice_Clinician] FOREIGN KEY ([clinician_id]) REFERENCES [dbo].[Clinician]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Payment] ADD CONSTRAINT [FK_Payment_CreditCard] FOREIGN KEY ([credit_card_id]) REFERENCES [dbo].[CreditCard]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Payment] ADD CONSTRAINT [FK_Payment_Invoice] FOREIGN KEY ([invoice_id]) REFERENCES [dbo].[Invoice]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[SurveyAnswers] ADD CONSTRAINT [FK_SurveyAnswers_Client] FOREIGN KEY ([client_id]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[SurveyAnswers] ADD CONSTRAINT [FK_SurveyAnswers_SurveyTemplate] FOREIGN KEY ([template_id]) REFERENCES [dbo].[SurveyTemplate]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[SurveyAnswers] ADD CONSTRAINT [FK_SurveyAnswers_Appointment] FOREIGN KEY ([appointment_id]) REFERENCES [dbo].[Appointment]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[UserRole] ADD CONSTRAINT [FK_UserRole_Role] FOREIGN KEY ([role_id]) REFERENCES [dbo].[Role]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserRole] ADD CONSTRAINT [FK_UserRole_User] FOREIGN KEY ([user_id]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
