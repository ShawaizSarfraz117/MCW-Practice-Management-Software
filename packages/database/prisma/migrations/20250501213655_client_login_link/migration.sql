/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Role` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ClientLoginLink] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_ClientLoginLink_ID] DEFAULT newid(),
    [email] NVARCHAR(1000) NOT NULL,
    [token] NVARCHAR(1000) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ClientLoginLink_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ClientLoginLink_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ClientLoginLink_token_key] UNIQUE NONCLUSTERED ([token])
);

-- CreateIndex
ALTER TABLE [dbo].[Role] ADD CONSTRAINT [Role_name_key] UNIQUE NONCLUSTERED ([name]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
