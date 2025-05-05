BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[License] (
    [id] INT NOT NULL IDENTITY(1,1),
    [user_id] UNIQUEIDENTIFIER NOT NULL,
    [license_type] NVARCHAR(1000) NOT NULL,
    [license_number] NVARCHAR(1000) NOT NULL,
    [expiration_date] DATETIME2 NOT NULL,
    [state] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [License_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[License] ADD CONSTRAINT [License_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
