"use client";

import React, { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Class, PagedResponse } from "@/lib/types";
import { useToast } from "@/context/toast-context";
import { Table, Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Plus, Search, Trash2, Edit2, Building2, Users } from "lucide-react";

export default function AdminClassesPage() {
  const { success, error } = useToast();

  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formSection, setFormSection] = useState("");

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/admin/classes?page=${page}&pageSize=10`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const res = await api.get<PagedResponse<Class>>(url);
      setClasses(res.data.items);
      setTotalPages(res.data.totalPages);
      setTotalCount(res.data.totalCount);
    } catch {
      error("Failed to load classes catalog.");
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm, error]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleOpenAdd = () => {
    setFormName("");
    setFormSection("");
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (c: Class) => {
    setSelectedClass(c);
    setFormName(c.name);
    setFormSection(c.section || "");
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (c: Class) => {
    setSelectedClass(c);
    setIsDeleteModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/admin/classes", {
        name: formName,
        section: formSection || undefined,
      });
      success(`Class "${formName}" created successfully.`);
      setIsAddModalOpen(false);
      fetchClasses();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      error(axiosErr.response?.data?.message || "Failed to create class.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    setIsSubmitting(true);
    try {
      await api.put(`/admin/classes/${selectedClass.id}`, {
        name: formName,
        section: formSection || undefined,
      });
      success(`Class updated successfully.`);
      setIsEditModalOpen(false);
      fetchClasses();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      error(axiosErr.response?.data?.message || "Failed to update class.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedClass) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/admin/classes/${selectedClass.id}`);
      success("Class deleted successfully.");
      setIsDeleteModalOpen(false);
      fetchClasses();
    } catch {
      error("Failed to delete class.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Class>[] = [
    {
      header: "Class Information",
      accessor: (c) => (
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100">{c.name}</p>
            <p className="text-xs text-slate-500">
              {c.section ? `Section ${c.section}` : "Standard Cohort"}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Section / Batch",
      accessor: (c) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {c.section || "—"}
        </span>
      ),
    },
    {
      header: "Enrolled Students",
      accessor: (c) => (
        <Badge variant="success" className="inline-flex items-center space-x-1">
          <Users className="w-3 h-3 mr-1" />
          <span>{c.studentCount} Students</span>
        </Badge>
      ),
    },
    {
      header: "Created Date",
      accessor: (c) => (
        <span className="text-xs text-slate-500">
          {new Date(c.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      accessor: (c) => (
        <div className="flex items-center justify-end space-x-2">
          <button
            id={`edit-class-${c.id}`}
            onClick={() => handleOpenEdit(c)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Edit Class"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            id={`delete-class-${c.id}`}
            onClick={() => handleOpenDelete(c)}
            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-colors"
            title="Delete Class"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Class Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define grade levels, course batches, and sections
          </p>
        </div>
        <Button id="add-class-btn" onClick={handleOpenAdd} className="shrink-0 gap-1.5">
          <Plus className="w-4 h-4" />
          <span>Create New Class</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search classes by name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={classes}
        keyExtractor={(c) => c.id}
        isLoading={isLoading}
        emptyMessage="No classes created yet."
        pagination={{
          page,
          pageSize: 10,
          totalCount,
          totalPages,
          onPageChange: (p) => setPage(p),
        }}
      />

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Class"
        subtitle="Specify class title and optional section designation"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            id="class-name-input"
            label="Class / Grade Name"
            placeholder="e.g. Grade 10 or Class A"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
          <Input
            id="class-section-input"
            label="Section (Optional)"
            placeholder="e.g. Section A, Fall 2026"
            value={formSection}
            onChange={(e) => setFormSection(e.target.value)}
          />

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button id="submit-class-btn" type="submit" isLoading={isSubmitting}>
              Create Class
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Class Details"
        subtitle={`Editing ${selectedClass?.name}`}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Class / Grade Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
          <Input
            label="Section"
            value={formSection}
            onChange={(e) => setFormSection(e.target.value)}
          />

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Class"
        subtitle="Confirm removal of classroom"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Are you sure you want to delete{" "}
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {selectedClass?.name}
            </span>
            ? This may impact students and assignments linked to this class.
          </p>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isSubmitting}>
              Confirm Deletion
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
