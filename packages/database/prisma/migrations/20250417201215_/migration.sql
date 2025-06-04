BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[User] DROP CONSTRAINT [PK_User_ID];
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_id_df] DEFAULT newid() FOR [id];

-- CreateTable
CREATE TABLE [dbo].[ProfileDetails] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [ProfileDetails_id_df] DEFAULT newid(),
    [user_id] UNIQUEIDENTIFIER NOT NULL,
    [date_of_birth] DATE,
    [phone] VARCHAR(20),
    [profile_photo] VARCHAR(500),
    [created_at] DATETIME NOT NULL CONSTRAINT [ProfileDetails_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME NOT NULL,
    CONSTRAINT [ProfileDetails_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ProfileDetails_user_id_key] UNIQUE NONCLUSTERED ([user_id])
);

-- AddForeignKey
ALTER TABLE [dbo].[ProfileDetails] ADD CONSTRAINT [ProfileDetails_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
