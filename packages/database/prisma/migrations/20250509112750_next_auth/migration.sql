/*
  Warnings:

  - You are about to drop the `ClientLoginLink` table. If the table is not empty, all the data it contains will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[User] ADD [emailVerified] DATETIME2;

-- DropTable
DROP TABLE [dbo].[ClientLoginLink];

-- CreateTable
CREATE TABLE [dbo].[verification_tokens] (
    [identifier] NVARCHAR(1000) NOT NULL,
    [token] NVARCHAR(1000) NOT NULL,
    [expires] DATETIME2 NOT NULL,
    CONSTRAINT [verification_tokens_token_key] UNIQUE NONCLUSTERED ([token]),
    CONSTRAINT [verification_tokens_identifier_token_key] UNIQUE NONCLUSTERED ([identifier],[token])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
