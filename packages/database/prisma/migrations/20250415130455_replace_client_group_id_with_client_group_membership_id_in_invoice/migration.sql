/*
  Warnings:

  - The primary key for the `ClientGroupMembership` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `client_group_id` on the `Invoice` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[client_group_id,client_id]` on the table `ClientGroupMembership` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Role` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Invoice] DROP CONSTRAINT [FK_Invoice_ClientGroup];

-- AlterTable
ALTER TABLE [dbo].[ClientGroupMembership] DROP CONSTRAINT [DF_ClientGroupMembership_ID];
ALTER TABLE [dbo].[ClientGroupMembership] DROP CONSTRAINT [PK_ClientGroupMembership_ID];
ALTER TABLE [dbo].[ClientGroupMembership] ADD [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_ClientGroupMembership_ID] DEFAULT newid();
ALTER TABLE [dbo].[ClientGroupMembership] ADD CONSTRAINT ClientGroupMembership_pkey PRIMARY KEY CLUSTERED ([id]);

-- AlterTable
ALTER TABLE [dbo].[Invoice] DROP COLUMN [client_group_id];
ALTER TABLE [dbo].[Invoice] ADD [client_group_membership_id] UNIQUEIDENTIFIER;

-- CreateIndex
ALTER TABLE [dbo].[ClientGroupMembership] ADD CONSTRAINT [UQ_ClientGroupMembership_Composite] UNIQUE NONCLUSTERED ([client_group_id], [client_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Invoice_ClientGroupMembership] ON [dbo].[Invoice]([client_group_membership_id]);

-- CreateIndex
ALTER TABLE [dbo].[Role] ADD CONSTRAINT [Role_name_key] UNIQUE NONCLUSTERED ([name]);

-- AddForeignKey
ALTER TABLE [dbo].[Invoice] ADD CONSTRAINT [FK_Invoice_ClientGroupMembership] FOREIGN KEY ([client_group_membership_id]) REFERENCES [dbo].[ClientGroupMembership]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
