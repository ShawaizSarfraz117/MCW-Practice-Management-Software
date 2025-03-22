BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Appointment] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF__Appointment__id__388F4914] DEFAULT newid(),
    [type] VARCHAR(50) NOT NULL,
    [title] VARCHAR(255),
    [is_all_day] BIT NOT NULL CONSTRAINT [DF__Appointme__is_al__39836D4D] DEFAULT 0,
    [start_date] DATETIME2 NOT NULL,
    [end_date] DATETIME2 NOT NULL,
    [location_id] UNIQUEIDENTIFIER,
    [created_by] UNIQUEIDENTIFIER NOT NULL,
    [status] VARCHAR(100) NOT NULL,
    [client_id] UNIQUEIDENTIFIER,
    [clinician_id] UNIQUEIDENTIFIER,
    [appointment_fee] DECIMAL(32,16),
    [service_id] UNIQUEIDENTIFIER,
    [is_recurring] BIT NOT NULL CONSTRAINT [DF__Appointme__is_re__3A779186] DEFAULT 0,
    [recurring_rule] TEXT,
    [cancel_appointments] BIT,
    [notify_cancellation] BIT,
    [recurring_appointment_id] UNIQUEIDENTIFIER,
    CONSTRAINT [Appointment_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[AppointmentTag] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF__AppointmentT__id__2DDCB077] DEFAULT newid(),
    [appointment_id] UNIQUEIDENTIFIER NOT NULL,
    [tag_id] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [PK__Appointm__3213E83F5CC0D1B3] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_AppointmentTag_Appointment_Tag] UNIQUE NONCLUSTERED ([appointment_id],[tag_id])
);

-- CreateTable
CREATE TABLE [dbo].[Audit] (
    [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF__Audit__Id__16F94B1F] DEFAULT newid(),
    [client_id] UNIQUEIDENTIFIER,
    [user_id] UNIQUEIDENTIFIER,
    [datetime] DATETIME NOT NULL CONSTRAINT [DF__Audit__datetime__17ED6F58] DEFAULT CURRENT_TIMESTAMP,
    [event_type] NCHAR(10),
    [event_text] NVARCHAR(255) NOT NULL,
    [is_hipaa] BIT NOT NULL CONSTRAINT [DF__Audit__is_hipaa__18E19391] DEFAULT 0,
    CONSTRAINT [PK__Audit__3214EC0710FE1A60] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Client] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF__Client__id__2E11BAA1] DEFAULT newid(),
    [legal_first_name] VARCHAR(100) NOT NULL,
    [legal_last_name] VARCHAR(100) NOT NULL,
    [is_waitlist] BIT NOT NULL CONSTRAINT [DF__Client__is_waitl__2F05DEDA] DEFAULT 0,
    [primary_clinician_id] UNIQUEIDENTIFIER,
    [primary_location_id] UNIQUEIDENTIFIER,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF__Client__created___2FFA0313] DEFAULT CURRENT_TIMESTAMP,
    [is_active] BIT NOT NULL CONSTRAINT [DF__Client__is_activ__30EE274C] DEFAULT 1,
    [preferred_name] VARCHAR(100),
    [date_of_birth] DATE,
    [referred_by] VARCHAR(200),
    CONSTRAINT [Client_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ClientContact] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF__ClientContac__id__48C5B0DD] DEFAULT newid(),
    [client_id] UNIQUEIDENTIFIER NOT NULL,
    [is_primary] BIT NOT NULL CONSTRAINT [DF__ClientCon__is_pr__49B9D516] DEFAULT 0,
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
    CONSTRAINT [PK_ClientGroup] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ClientGroupMembership] (
    [client_group_id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF__GroupClient__id__6D031153] DEFAULT newid(),
    [client_id] UNIQUEIDENTIFIER NOT NULL,
    [role] VARCHAR(50),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF__GroupClie__creat__6EEB59C5] DEFAULT CURRENT_TIMESTAMP,
    [is_contact_only] BIT NOT NULL CONSTRAINT [DF__GroupClie__is_co__71C7C670] DEFAULT 0,
    [is_responsible_for_billing] BIT,
    CONSTRAINT [GroupClient_pkey] PRIMARY KEY CLUSTERED ([client_group_id],[client_id])
);

-- CreateTable
CREATE TABLE [dbo].[ClientReminderPreference] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF__ClientRemind__id__515AF6DE] DEFAULT newid(),
    [client_id] UNIQUEIDENTIFIER NOT NULL,
    [reminder_type] VARCHAR(100) NOT NULL,
    [is_enabled] BIT NOT NULL CONSTRAINT [DF__ClientRem__is_en__524F1B17] DEFAULT 1,
    CONSTRAINT [ClientReminderPreference_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ClientReminderPreference_client_id_reminder_type_key] UNIQUE NONCLUSTERED ([client_id],[reminder_type])
);

-- CreateTable
CREATE TABLE [dbo].[Clinician] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF__Clinician__id__267098D9] DEFAULT newid(),
    [user_id] UNIQUEIDENTIFIER NOT NULL,
    [address] TEXT NOT NULL,
    [percentage_split] FLOAT(53) NOT NULL,
    [is_active] BIT NOT NULL CONSTRAINT [DF__Clinician__is_ac__2764BD12] DEFAULT 1,
    [first_name] VARCHAR(100) NOT NULL,
    [last_name] VARCHAR(100) NOT NULL,
    CONSTRAINT [Clinician_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Clinician_user_id_key] UNIQUE NONCLUSTERED ([user_id])
);

-- CreateTable
CREATE TABLE [dbo].[ClinicianClient] (
    [client_id] UNIQUEIDENTIFIER NOT NULL,
    [clinician_id] UNIQUEIDENTIFIER NOT NULL,
    [is_primary] BIT NOT NULL CONSTRAINT [DF__Clinician__is_pr__4218B34E] DEFAULT 0,
    [assigned_date] DATETIME2 NOT NULL CONSTRAINT [DF__Clinician__assig__430CD787] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ClinicianClient_pkey] PRIMARY KEY CLUSTERED ([client_id],[clinician_id])
);

-- CreateTable
CREATE TABLE [dbo].[ClinicianLocation] (
    [clinician_id] UNIQUEIDENTIFIER NOT NULL,
    [location_id] UNIQUEIDENTIFIER NOT NULL,
    [is_primary] BIT NOT NULL CONSTRAINT [DF__Clinician__is_pr__3F3C46A3] DEFAULT 0,
    CONSTRAINT [ClinicianLocation_pkey] PRIMARY KEY CLUSTERED ([clinician_id],[location_id])
);

-- CreateTable
CREATE TABLE [dbo].[ClinicianServices] (
    [clinician_id] UNIQUEIDENTIFIER NOT NULL,
    [service_id] UNIQUEIDENTIFIER NOT NULL,
    [custom_rate] DECIMAL(32,16),
    [is_active] BIT NOT NULL CONSTRAINT [DF__Clinician__is_ac__45E94432] DEFAULT 1,
    CONSTRAINT [ClinicianServices_pkey] PRIMARY KEY CLUSTERED ([clinician_id],[service_id])
);

-- CreateTable
CREATE TABLE [dbo].[CreditCard] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF__CreditCard__id__0015E5C7] DEFAULT newid(),
    [client_id] UNIQUEIDENTIFIER NOT NULL,
    [card_type] VARCHAR(50) NOT NULL,
    [last_four] VARCHAR(4) NOT NULL,
    [expiry_month] INT NOT NULL,
    [expiry_year] INT NOT NULL,
    [cardholder_name] VARCHAR(100) NOT NULL,
    [is_default] BIT NOT NULL CONSTRAINT [DF__CreditCar__is_de__010A0A00] DEFAULT 0,
    [billing_address] TEXT,
    [token] VARCHAR(255),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF__CreditCar__creat__01FE2E39] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [CreditCard_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Invoice] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF__Invoice__id__7C4554E3] DEFAULT newid(),
    [invoice_number] VARCHAR(50) NOT NULL,
    [client_group_id] UNIQUEIDENTIFIER,
    [appointment_id] UNIQUEIDENTIFIER,
    [clinician_id] UNIQUEIDENTIFIER NOT NULL,
    [issued_date] DATETIME2 NOT NULL CONSTRAINT [DF__Invoice__issued___7D39791C] DEFAULT CURRENT_TIMESTAMP,
    [due_date] DATETIME2 NOT NULL,
    [amount] DECIMAL(10,2) NOT NULL,
    [status] VARCHAR(50) NOT NULL,
    CONSTRAINT [Invoice_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Location] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF__Location__id__21ABE3BC] DEFAULT newid(),
    [name] VARCHAR(255) NOT NULL,
    [address] TEXT NOT NULL,
    [is_active] BIT NOT NULL CONSTRAINT [DF__Location__is_act__22A007F5] DEFAULT 1,
    CONSTRAINT [Location_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Payment] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF__Payment__id__04DA9AE4] DEFAULT newid(),
    [invoice_id] UNIQUEIDENTIFIER NOT NULL,
    [payment_date] DATETIME2 NOT NULL CONSTRAINT [DF__Payment__payment__05CEBF1D] DEFAULT CURRENT_TIMESTAMP,
    [amount] DECIMAL(10,2) NOT NULL,
    [credit_card_id] UNIQUEIDENTIFIER,
    [transaction_id] VARCHAR(100),
    [status] VARCHAR(50) NOT NULL,
    [response] TEXT,
    CONSTRAINT [Payment_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[PracticeService] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF__PracticeServ__id__2B354DF6] DEFAULT newid(),
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
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF__Role__id__1AFEE62D] DEFAULT newid(),
    [name] VARCHAR(255) NOT NULL,
    CONSTRAINT [Role_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SurveyAnswers] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF__ClientDocume__id__4C9641C1] DEFAULT newid(),
    [template_id] UNIQUEIDENTIFIER NOT NULL,
    [client_id] UNIQUEIDENTIFIER NOT NULL,
    [content] TEXT,
    [frequency] NCHAR(10),
    [completed_at] DATETIME2,
    [assigned_at] DATETIME2 NOT NULL CONSTRAINT [DF__ClientDoc__assig__4D8A65FA] DEFAULT CURRENT_TIMESTAMP,
    [expiry_date] DATETIME2,
    [status] VARCHAR(100) NOT NULL,
    [appointment_id] UNIQUEIDENTIFIER,
    [is_signed] BIT,
    [is_locked] BIT,
    CONSTRAINT [ClientDocument_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SurveyTemplate] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF__DocumentTemp__id__33CA93F7] DEFAULT newid(),
    [name] VARCHAR(255) NOT NULL,
    [content] TEXT NOT NULL,
    [frequency_options] NCHAR(10),
    [is_active] BIT NOT NULL CONSTRAINT [DF__DocumentT__is_ac__34BEB830] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF__DocumentT__creat__35B2DC69] DEFAULT CURRENT_TIMESTAMP,
    [description] TEXT,
    [updated_at] DATETIME2 NOT NULL,
    [type] VARCHAR(100) NOT NULL,
    [requires_signature] BIT NOT NULL CONSTRAINT [DF__SurveyTem__requi__141CDE74] DEFAULT 0,
    CONSTRAINT [DocumentTemplate_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[sysdiagrams] (
    [name] NVARCHAR(128) NOT NULL,
    [principal_id] INT NOT NULL,
    [diagram_id] INT NOT NULL IDENTITY(1,1),
    [version] INT,
    [definition] VARBINARY(max),
    CONSTRAINT [PK__sysdiagr__C2B05B610A67E8C9] PRIMARY KEY CLUSTERED ([diagram_id]),
    CONSTRAINT [UK_principal_name] UNIQUE NONCLUSTERED ([principal_id],[name])
);

-- CreateTable
CREATE TABLE [dbo].[Tag] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF__Tag__id__2A0C1F93] DEFAULT newid(),
    [name] NVARCHAR(100) NOT NULL,
    [color] NVARCHAR(50),
    CONSTRAINT [PK__Tag__3213E83FFA70F600] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF__User__id__1ECF7711] DEFAULT newid(),
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
    CONSTRAINT [UserRole_pkey] PRIMARY KEY CLUSTERED ([user_id],[role_id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_AppointmentTag_appointment_id] ON [dbo].[AppointmentTag]([appointment_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_AppointmentTag_tag_id] ON [dbo].[AppointmentTag]([tag_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_GroupClient_client_id] ON [dbo].[ClientGroupMembership]([client_id]);

-- AddForeignKey
ALTER TABLE [dbo].[Appointment] ADD CONSTRAINT [Appointment_client_id_fkey] FOREIGN KEY ([client_id]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Appointment] ADD CONSTRAINT [Appointment_clinician_id_fkey] FOREIGN KEY ([clinician_id]) REFERENCES [dbo].[Clinician]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Appointment] ADD CONSTRAINT [Appointment_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Appointment] ADD CONSTRAINT [Appointment_location_id_fkey] FOREIGN KEY ([location_id]) REFERENCES [dbo].[Location]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Appointment] ADD CONSTRAINT [Appointment_recurring_root_id_fkey] FOREIGN KEY ([recurring_appointment_id]) REFERENCES [dbo].[Appointment]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Appointment] ADD CONSTRAINT [Appointment_service_id_fkey] FOREIGN KEY ([service_id]) REFERENCES [dbo].[PracticeService]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[AppointmentTag] ADD CONSTRAINT [FK_AppointmentTag_Appointment] FOREIGN KEY ([appointment_id]) REFERENCES [dbo].[Appointment]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AppointmentTag] ADD CONSTRAINT [FK_AppointmentTag_Tag] FOREIGN KEY ([tag_id]) REFERENCES [dbo].[Tag]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Audit] ADD CONSTRAINT [FK_Audit_Client] FOREIGN KEY ([client_id]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Audit] ADD CONSTRAINT [FK_Audit_User] FOREIGN KEY ([user_id]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Client] ADD CONSTRAINT [Client_primary_clinician_id_fkey] FOREIGN KEY ([primary_clinician_id]) REFERENCES [dbo].[Clinician]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Client] ADD CONSTRAINT [Client_primary_location_id_fkey] FOREIGN KEY ([primary_location_id]) REFERENCES [dbo].[Location]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ClientContact] ADD CONSTRAINT [ClientContact_client_id_fkey] FOREIGN KEY ([client_id]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ClientGroupMembership] ADD CONSTRAINT [ClientGroupMembership_client_id_fkey] FOREIGN KEY ([client_id]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ClientGroupMembership] ADD CONSTRAINT [FK_ClientGroupMembership_ClientGroup] FOREIGN KEY ([client_group_id]) REFERENCES [dbo].[ClientGroup]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ClientReminderPreference] ADD CONSTRAINT [ClientReminderPreference_client_id_fkey] FOREIGN KEY ([client_id]) REFERENCES [dbo].[Client]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Clinician] ADD CONSTRAINT [Clinician_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ClinicianClient] ADD CONSTRAINT [ClinicianClient_client_id_fkey] FOREIGN KEY ([client_id]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ClinicianClient] ADD CONSTRAINT [ClinicianClient_clinician_id_fkey] FOREIGN KEY ([clinician_id]) REFERENCES [dbo].[Clinician]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ClinicianLocation] ADD CONSTRAINT [ClinicianLocation_clinician_id_fkey] FOREIGN KEY ([clinician_id]) REFERENCES [dbo].[Clinician]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ClinicianLocation] ADD CONSTRAINT [ClinicianLocation_location_id_fkey] FOREIGN KEY ([location_id]) REFERENCES [dbo].[Location]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ClinicianServices] ADD CONSTRAINT [ClinicianServices_clinician_id_fkey] FOREIGN KEY ([clinician_id]) REFERENCES [dbo].[Clinician]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ClinicianServices] ADD CONSTRAINT [ClinicianServices_service_id_fkey] FOREIGN KEY ([service_id]) REFERENCES [dbo].[PracticeService]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CreditCard] ADD CONSTRAINT [CreditCard_client_id_fkey] FOREIGN KEY ([client_id]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Invoice] ADD CONSTRAINT [Invoice_appointment_id_fkey] FOREIGN KEY ([appointment_id]) REFERENCES [dbo].[Appointment]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Invoice] ADD CONSTRAINT [Invoice_client_group_id_fkey] FOREIGN KEY ([client_group_id]) REFERENCES [dbo].[ClientGroup]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Invoice] ADD CONSTRAINT [Invoice_clinician_id_fkey] FOREIGN KEY ([clinician_id]) REFERENCES [dbo].[Clinician]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Payment] ADD CONSTRAINT [Payment_credit_card_id_fkey] FOREIGN KEY ([credit_card_id]) REFERENCES [dbo].[CreditCard]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Payment] ADD CONSTRAINT [Payment_invoice_id_fkey] FOREIGN KEY ([invoice_id]) REFERENCES [dbo].[Invoice]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[SurveyAnswers] ADD CONSTRAINT [ClientDocument_client_id_fkey] FOREIGN KEY ([client_id]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[SurveyAnswers] ADD CONSTRAINT [ClientDocument_template_id_fkey] FOREIGN KEY ([template_id]) REFERENCES [dbo].[SurveyTemplate]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[SurveyAnswers] ADD CONSTRAINT [FK_SurveyAnswers_Appointment] FOREIGN KEY ([appointment_id]) REFERENCES [dbo].[Appointment]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[UserRole] ADD CONSTRAINT [UserRole_role_id_fkey] FOREIGN KEY ([role_id]) REFERENCES [dbo].[Role]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserRole] ADD CONSTRAINT [UserRole_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

