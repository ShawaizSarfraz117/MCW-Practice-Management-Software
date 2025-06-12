"use client";

import { useState } from "react";
import { Edit, Printer, Trash2, ChevronUp, ChevronDown, X } from "lucide-react";
import { Button } from "@mcw/ui";
import { format } from "date-fns";
import DOMPurify from "dompurify";

// Delete Confirmation Modal Component
interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
}: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Delete Administrative Note
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
            When you delete an Administrative Note, it is deleted for all team
            members too.
          </p>
          <a className="text-blue-500 hover:underline text-sm" href="#">
            Learn more
          </a>
        </div>

        <div className="flex justify-end gap-3">
          <Button className="px-4 py-2" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white"
            onClick={onConfirm}
          >
            Delete now
          </Button>
        </div>
      </div>
    </div>
  );
}

// Extract print HTML generation
function generatePrintHTML(
  content: string,
  dateOfBirth: string | undefined,
  formatDate: (date: string | Date) => string,
  createdAt: string | Date,
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Administrative Note</title>
      <style>
        @media print {
          body { margin: 0; }
        }
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          line-height: 1.6;
          color: #000;
        }
        .header {
          margin-bottom: 30px;
        }
        .client-info {
          font-size: 12px;
          margin-bottom: 20px;
          line-height: 1.4;
        }
        .note-title {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          text-align: center;
          margin: 20px 0;
        }
        .note-content {
          font-size: 14px;
          margin: 30px 0;
          min-height: 100px;
        }
        .note-meta {
          font-size: 11px;
          color: #666;
          border-top: 1px solid #ccc;
          padding-top: 10px;
          margin-top: 50px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .page-info {
          font-size: 10px;
          color: #666;
        }
        /* Quill content styles */
        .note-content p {
          margin: 0.5em 0;
        }
        .note-content strong {
          font-weight: bold;
        }
        .note-content em {
          font-style: italic;
        }
        .note-content u {
          text-decoration: underline;
        }
        .note-content ol, .note-content ul {
          margin: 0.5em 0;
          padding-left: 2em;
        }
        .note-content h1, .note-content h2, .note-content h3 {
          margin: 1em 0 0.5em 0;
          font-weight: bold;
        }
        .note-content h1 { font-size: 1.5em; }
        .note-content h2 { font-size: 1.3em; }
        .note-content h3 { font-size: 1.1em; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="client-info">
          <strong>Client 1:</strong> 
          <strong>DOB 1:</strong> ${dateOfBirth}
        </div>
        <div class="note-title">Administrative Note</div>
      </div>
      <div class="note-content">${content}</div>
      <div class="note-meta">
        <div>Created on ${formatDate(createdAt)}. Last updated on ${formatDate(createdAt)}.</div>
        <div class="page-info">Page 1 of 1</div>
      </div>
    </body>
    </html>
  `;
}

interface AdministrativeNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string | Date;
  authorName: string;
}

interface AdministrativeNoteCardProps {
  note: AdministrativeNote;
  clientName?: string;
  dateOfBirth?: string;
  onEdit?: (note: AdministrativeNote) => void;
  onDelete?: (noteId: string) => void;
}

export default function AdministrativeNoteCard({
  note,
  clientName: _clientName,
  dateOfBirth,
  onEdit,
  onDelete,
}: AdministrativeNoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const formatDate = (date: string | Date) => {
    const dateObj = new Date(date);
    return format(dateObj, "MM/dd/yyyy 'at' h:mm a");
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const sanitizedContent = DOMPurify.sanitize(note.content);
      const printContent = generatePrintHTML(
        sanitizedContent,
        dateOfBirth,
        formatDate,
        note.createdAt,
      );

      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const handleEdit = () => {
    onEdit?.(note);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    onDelete?.(note.id);
    setShowDeleteModal(false);
  };

  return (
    <>
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
      />

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              ADMINISTRATIVE NOTE
            </h3>
            <Button
              className="p-1 h-auto"
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
          {isExpanded && (
            <div className="flex items-center gap-1">
              <Button
                className="p-1 h-auto text-blue-500 hover:text-blue-700"
                size="sm"
                title="Edit"
                variant="ghost"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                className="p-1 h-auto text-blue-500 hover:text-blue-700"
                size="sm"
                title="Print"
                variant="ghost"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4" />
              </Button>
              <Button
                className="p-1 h-auto text-red-500 hover:text-red-700"
                size="sm"
                title="Delete"
                variant="ghost"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div
          className="text-gray-800 mt-2"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(note.content),
          }}
        />

        {isExpanded && (
          <div className="text-sm text-gray-500 mt-3">
            {note.authorName} created on {formatDate(note.createdAt)}
          </div>
        )}
      </div>
    </>
  );
}
