BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Role] ADD [description] TEXT;

-- CreateTable
CREATE TABLE [dbo].[Permission] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [Permission_id_df] DEFAULT newid(),
    [name] VARCHAR(255) NOT NULL,
    [slug] VARCHAR(100) NOT NULL,
    CONSTRAINT [Permission_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Permission_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[RolePermission] (
    [role_id] UNIQUEIDENTIFIER NOT NULL,
    [permission_id] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [PK_RolePermission_ID] PRIMARY KEY CLUSTERED ([role_id],[permission_id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_RolePermission_role_id] ON [dbo].[RolePermission]([role_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_RolePermission_permission_id] ON [dbo].[RolePermission]([permission_id]);

-- AddForeignKey
ALTER TABLE [dbo].[RolePermission] ADD CONSTRAINT [FK_RolePermission_Role] FOREIGN KEY ([role_id]) REFERENCES [dbo].[Role]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[RolePermission] ADD CONSTRAINT [FK_RolePermission_Permission] FOREIGN KEY ([permission_id]) REFERENCES [dbo].[Permission]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
