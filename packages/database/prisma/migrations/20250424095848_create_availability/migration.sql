BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Availability] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_Availability_ID] DEFAULT newid(),
    [clinician_id] UNIQUEIDENTIFIER NOT NULL,
    [start_time] DATETIME2 NOT NULL,
    [end_time] DATETIME2 NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_Availability_CreatedAt] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [is_recurring] BIT NOT NULL CONSTRAINT [DF_Availability_IsRecurring] DEFAULT 0,
    [recurring_rule] TEXT,
    CONSTRAINT [Availability_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Availability_clinician_id] ON [dbo].[Availability]([clinician_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Availability_time_range] ON [dbo].[Availability]([start_time], [end_time]);

-- AddForeignKey
ALTER TABLE [dbo].[Availability] ADD CONSTRAINT [FK_Availability_Clinician] FOREIGN KEY ([clinician_id]) REFERENCES [dbo].[Clinician]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
