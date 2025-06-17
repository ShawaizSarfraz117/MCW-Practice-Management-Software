/* eslint-disable max-lines-per-function */
/* eslint-disable max-lines */
"use client";

import { useState, useEffect } from "react";
import {
  Checkbox,
  Label,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
  useToast,
  Button,
} from "@mcw/ui";
import { X } from "lucide-react";
import { ClientMembership } from "./ClientEdit";
import { ClientPortalPermission } from "@mcw/database";
import {
  fetchClientPortalPermission,
  createClientPortalPermission,
  updateClientPortalPermission,
  deleteClientPortalPermission,
} from "@/(dashboard)/clients/services/portal-permission.service";

interface ClientPortalPermissionsProps {
  clientData: ClientMembership;
  onSave?: () => void;
  onOpenEditDrawer?: () => void;
  onClose?: () => void;
  onLoadingChange?: (loading: boolean) => void;
}

interface PortalPermissionApiResponse {
  data: ClientPortalPermission | null;
}

interface PortalPermissionRequestData {
  client_id: string;
  email: string;
  allow_appointment_requests: boolean;
  use_secure_messaging: boolean;
  access_billing_documents: boolean;
  receive_announcements: boolean;
  is_active: boolean;
  subject?: string;
  message?: string;
  resend_email?: boolean;
}

// Delete Confirmation Modal Component
interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  clientName: string;
}

function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  clientName,
}: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Disable Client Portal Access
          </h2>
          <Button
            className="p-1 h-auto"
            size="sm"
            variant="ghost"
            onClick={onClose}
          >
            <X className="h-5 w-5 text-gray-400" />
          </Button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            Are you sure you want to disable client portal access for{" "}
            {clientName}? This will remove all portal permissions and they will
            need to be invited again.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button className="px-4 py-2" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white"
            onClick={onConfirm}
          >
            Disable Access
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ClientPortalPermissions({
  clientData,
  onSave,
  onOpenEditDrawer,
  onLoadingChange,
}: ClientPortalPermissionsProps) {
  const [loading, setLoading] = useState(false);
  const [portalPermission, setPortalPermission] =
    useState<ClientPortalPermission | null>(null);
  const [hasInvitationBeenSent, setHasInvitationBeenSent] = useState(false);
  const [resendEmail, setResendEmail] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedEmail, setSelectedEmail] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [permissions, setPermissions] = useState({
    allow_appointment_requests: true,
    use_secure_messaging: true,
    access_billing_documents: true,
    receive_announcements: true,
  });

  const { toast } = useToast();

  // Get email options from client contacts
  const emailOptions = clientData.Client.ClientContact.filter(
    (contact) => contact.contact_type === "EMAIL",
  ).map((contact) => ({
    value: contact.value,
    label: `${contact.value}${contact.is_primary ? " (Primary)" : ""}`,
  }));

  useEffect(() => {
    fetchPortalPermission();
  }, [clientData.Client.id]);

  // Notify parent component when loading state changes
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(loading);
    }
  }, [loading, onLoadingChange]);

  const fetchPortalPermission = async () => {
    try {
      const [response, error] = await fetchClientPortalPermission(
        clientData.Client.id,
      );

      if (error) {
        console.error("Error fetching portal permission:", error);
        // Handle error silently for initial fetch - just means no permission exists yet
        return;
      }

      const data = response as PortalPermissionApiResponse;

      if (data.data) {
        setPortalPermission(data.data);
        setHasInvitationBeenSent(true);
        setPermissions({
          allow_appointment_requests: data.data.allow_appointment_requests,
          use_secure_messaging: data.data.use_secure_messaging,
          access_billing_documents: data.data.access_billing_documents,
          receive_announcements: data.data.receive_announcements,
        });
        setSelectedEmail(data.data.email);
      } else {
        // Set default values for new portal permission
        const primaryEmail = emailOptions.find((opt) =>
          opt.label.includes("Primary"),
        );
        if (primaryEmail) {
          setSelectedEmail(primaryEmail.value);
        } else if (emailOptions.length > 0) {
          setSelectedEmail(emailOptions[0].value);
        }

        // Set default invitation message
        const clientName = `${clientData.Client.legal_first_name} ${clientData.Client.legal_last_name}`;
        setSubject(
          `Welcome from ${process.env.NEXT_PUBLIC_PRACTICE_NAME || "Our Practice"}`,
        );
        setMessage(
          `Sign in to your Client Portal to manage ${clientName}'s care with ${process.env.NEXT_PUBLIC_PRACTICE_NAME || "Our Practice"}.\n\n` +
            `{practice_client_portal_login_link}`,
        );
      }
    } catch (error) {
      console.error("Error fetching portal permission:", error);
      // Handle error silently for initial fetch - just means no permission exists yet
    }
  };

  // Check if client has no email contacts
  const hasNoEmail = emailOptions.length === 0;

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!portalPermission) return;

    setShowDeleteModal(false);
    setLoading(true);

    try {
      const [, error] = await deleteClientPortalPermission(
        clientData.Client.id,
      );

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Client portal access has been disabled",
        variant: "success",
      });

      // Reset state
      setPortalPermission(null);
      setHasInvitationBeenSent(false);
      setResendEmail(false);
      setPermissions({
        allow_appointment_requests: true,
        use_secure_messaging: true,
        access_billing_documents: true,
        receive_announcements: true,
      });

      // Reset to default email
      const primaryEmail = emailOptions.find((opt) =>
        opt.label.includes("Primary"),
      );
      if (primaryEmail) {
        setSelectedEmail(primaryEmail.value);
      } else if (emailOptions.length > 0) {
        setSelectedEmail(emailOptions[0].value);
      }

      // Reset invitation message to defaults
      const clientName = `${clientData.Client.legal_first_name} ${clientData.Client.legal_last_name}`;
      setSubject(
        `Welcome from ${process.env.NEXT_PUBLIC_PRACTICE_NAME || "Our Practice"}`,
      );
      setMessage(
        `Sign in to your Client Portal to manage ${clientName}'s care with ${process.env.NEXT_PUBLIC_PRACTICE_NAME || "Our Practice"}.\n\n` +
          `{practice_client_portal_login_link}`,
      );

      if (onSave) onSave();
    } catch (error) {
      console.error("Error deleting portal permission:", error);

      let errorMessage = "Failed to disable client portal access";

      if (error && typeof error === "object" && "error" in error) {
        const apiError = error as { error: { message?: string } | string };
        errorMessage =
          typeof apiError.error === "string"
            ? apiError.error
            : apiError.error.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (loading) return; // Prevent multiple calls

    if (!selectedEmail && !hasNoEmail) {
      toast({
        title: "Error",
        description: "Please select an email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Prepare request data including invitation details if needed
      const requestData: PortalPermissionRequestData = {
        client_id: clientData.Client.id,
        email: selectedEmail,
        ...permissions,
        is_active: true, // Always active when permissions are being set
      };

      // Add invitation details if sending or resending
      if ((!hasInvitationBeenSent || resendEmail) && subject && message) {
        requestData.subject = subject;
        requestData.message = message;
        requestData.resend_email = resendEmail;
      }

      let error;

      if (portalPermission) {
        // Update existing permission
        [, error] = await updateClientPortalPermission(requestData);
      } else {
        // Create new permission
        [, error] = await createClientPortalPermission(requestData);
      }

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Client portal permissions saved successfully",
        variant: "success",
      });

      setHasInvitationBeenSent(true);
      setResendEmail(false);
      if (onSave) onSave();
    } catch (error) {
      console.error("Error saving portal permission:", error);

      let errorMessage = "Failed to save portal permissions";

      // Handle specific error types from the service
      if (error && typeof error === "object" && "error" in error) {
        const apiError = error as { error: { message?: string } | string };
        errorMessage =
          typeof apiError.error === "string"
            ? apiError.error
            : apiError.error.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        clientName={`${clientData.Client.legal_first_name} ${clientData.Client.legal_last_name}`}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
      />

      <div className="space-y-6 p-4">
        <button
          className="hidden"
          disabled={loading}
          id="client-portal-save"
          type="button"
          onClick={handleSave}
        />
        {loading && (
          <div className="flex items-center justify-center py-2">
            <div className="text-sm text-gray-600">Saving...</div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-medium mb-4">
            {portalPermission
              ? `Allow ${clientData.Client.legal_first_name} access to`
              : `${clientData.Client.legal_first_name}'s Client Portal access`}
          </h3>

          {hasNoEmail ? (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertDescription>
                {clientData.Client.legal_first_name} needs an email with consent
                to have Client Portal access.{" "}
                <button
                  className="text-blue-600 hover:underline"
                  type="button"
                  onClick={() => {
                    if (onOpenEditDrawer) {
                      onOpenEditDrawer();
                    }
                  }}
                >
                  Edit {clientData.Client.legal_first_name}'s info
                </button>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {/* Show permission checkboxes only if portal permission already exists */}
              {portalPermission && (
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={permissions.allow_appointment_requests}
                      className="mt-1"
                      disabled={loading}
                      id="appointment-requests"
                      onCheckedChange={(checked) =>
                        setPermissions((prev) => ({
                          ...prev,
                          allow_appointment_requests: checked as boolean,
                        }))
                      }
                    />
                    <div className="flex-1">
                      <Label
                        className="text-base"
                        htmlFor="appointment-requests"
                      >
                        Request new appointments for this Couple
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        These appointments will need to be confirmed by their
                        clinician.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={permissions.use_secure_messaging}
                      className="mt-1"
                      disabled={loading}
                      id="secure-messaging"
                      onCheckedChange={(checked) =>
                        setPermissions((prev) => ({
                          ...prev,
                          use_secure_messaging: checked as boolean,
                        }))
                      }
                    />
                    <div className="flex-1">
                      <Label className="text-base" htmlFor="secure-messaging">
                        Send & receive secure messages
                      </Label>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={permissions.access_billing_documents}
                      className="mt-1"
                      disabled={loading}
                      id="billing-documents"
                      onCheckedChange={(checked) =>
                        setPermissions((prev) => ({
                          ...prev,
                          access_billing_documents: checked as boolean,
                        }))
                      }
                    />
                    <div className="flex-1">
                      <Label className="text-base" htmlFor="billing-documents">
                        Access this Couple's billing documents
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        This will include invoices, Statements, and Superbills.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      disabled
                      checked={false}
                      className="mt-1"
                      id="pay-balance"
                    />
                    <div className="flex-1">
                      <Label
                        className="text-base text-gray-500"
                        htmlFor="pay-balance"
                      >
                        Pay a balance with credit card using Stripe
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        To accept credit or debit cards,{" "}
                        <a className="text-blue-600 hover:underline" href="#">
                          enable Online Payments
                        </a>{" "}
                        first.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={permissions.receive_announcements}
                      className="mt-1"
                      disabled={loading}
                      id="announcements"
                      onCheckedChange={(checked) =>
                        setPermissions((prev) => ({
                          ...prev,
                          receive_announcements: checked as boolean,
                        }))
                      }
                    />
                    <div className="flex-1">
                      <Label className="text-base" htmlFor="announcements">
                        Receive this Couple's Announcements
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              {hasInvitationBeenSent ? (
                <div className="space-y-4 border-t pt-4">
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertDescription>
                      Invitation sent — client has not signed in yet.
                    </AlertDescription>
                  </Alert>

                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium mb-2">Email</p>
                    <p className="text-sm">{selectedEmail}</p>
                    <button
                      className="text-blue-600 text-sm mt-2 hover:underline"
                      type="button"
                      onClick={() => (window.location.href = `/settings/email`)}
                    >
                      Manage
                    </button>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p className="mb-1">
                      Invited on:{" "}
                      {portalPermission?.created_at
                        ? new Date(
                            portalPermission.created_at,
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleDeleteClick}
                  >
                    Disable access to this Client Portal
                  </button>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={resendEmail}
                      disabled={loading}
                      id="resend"
                      onCheckedChange={(checked) =>
                        setResendEmail(checked as boolean)
                      }
                    />
                    <Label htmlFor="resend">Resend email invitation</Label>
                  </div>

                  {resendEmail && (
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="resend-subject">
                          Subject line for Client Portal invitation
                        </Label>
                        <Input
                          className="mt-1"
                          disabled={loading}
                          id="resend-subject"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="resend-message">
                          Client Portal invitation message
                        </Label>
                        <Textarea
                          className="mt-1"
                          disabled={loading}
                          id="resend-message"
                          rows={5}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Use {"{practice_client_portal_login_link}"} to include
                          the portal login link
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email-select">Email</Label>
                    <Select
                      disabled={loading}
                      value={selectedEmail}
                      onValueChange={setSelectedEmail}
                    >
                      <SelectTrigger className="w-full mt-1" id="email-select">
                        <SelectValue placeholder="Select an email" />
                      </SelectTrigger>
                      <SelectContent>
                        {emailOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject">
                      Subject line for Client Portal invitation
                    </Label>
                    <Input
                      className="mt-1"
                      disabled={loading}
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">
                      Client Portal invitation message
                    </Label>
                    <Textarea
                      className="mt-1"
                      disabled={loading}
                      id="message"
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use {"{practice_client_portal_login_link}"} to include the
                      portal login link
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
