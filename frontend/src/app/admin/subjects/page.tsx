"use client";

import React, { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Subject, PagedResponse } from "@/lib/types";
import { useToast } from "@/context/toast-context";
import { Table, Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Plus, Search, Trash2, Edit2, BookOpen, Hash } from "lucide-react";

export default function AdminSubjectsPage() {
  const { success, error } = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formSyllabus, setFormSyllabus] = useState("");

  const fetchSubjects = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/admin/subjects?page=${page}&pageSize=10`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const res = await api.get<PagedResponse<Subject>>(url);
      setSubjects(res.data.items);
      setTotalPages(res.data.totalPages);
      setTotalCount(res.data.totalCount);
    } catch {
      error("Failed to load subject catalog.");
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm, error]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchSubjects(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchSubjects]);

  const handleOpenAdd = () => {
    setFormName("");
    setFormCode("");
    setFormSyllabus("");
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (s: Subject) => {
    setSelectedSubject(s);
    setFormName(s.name);
    setFormCode(s.code);
    setFormSyllabus(s.syllabus || "");
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (s: Subject) => {
    setSelectedSubject(s);
    setIsDeleteModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/admin/subjects", {
        name: formName,
        code: formCode.toUpperCase(),
        syllabus: formSyllabus.trim(),
      });
      success(`Subject "${formName}" added successfully.`);
      setIsAddModalOpen(false);
      fetchSubjects();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      error(axiosErr.response?.data?.message || "Failed to create subject.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;
    setIsSubmitting(true);
    try {
      await api.put(`/admin/subjects/${selectedSubject.id}`, {
        name: formName,
        code: formCode.toUpperCase(),
        syllabus: formSyllabus.trim(),
      });
      success(`Subject updated successfully.`);
      setIsEditModalOpen(false);
      fetchSubjects();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      error(axiosErr.response?.data?.message || "Failed to update subject.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSubject) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/admin/subjects/${selectedSubject.id}`);
      success("Subject deleted successfully.");
      setIsDeleteModalOpen(false);
      fetchSubjects();
    } catch {
      error("Failed to delete subject.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Subject>[] = [
    {
      header: "Course / Subject",
      accessor: (s) => (
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100">{s.name}</p>
            <p className="text-xs text-slate-500">Academic Curriculum</p>
          </div>
        </div>
      ),
    },
    {
      header: "Course Code",
      accessor: (s) => (
        <Badge variant="purple" className="inline-flex items-center space-x-1 font-mono">
          <Hash className="w-3 h-3 mr-0.5" />
          <span>{s.code}</span>
        </Badge>
      ),
    },
    {
      header: "Created Date",
      accessor: (s) => (
        <span className="text-xs text-slate-500">
          {new Date(s.createdAt).toLocaleDateString(undefined, {
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
      accessor: (s) => (
        <div className="flex items-center justify-end space-x-2">
          <button
            id={`edit-subject-${s.id}`}
            onClick={() => handleOpenEdit(s)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Edit Subject"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            id={`delete-subject-${s.id}`}
            onClick={() => handleOpenDelete(s)}
            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-colors"
            title="Delete Subject"
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
            Subject Catalog
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define course titles and unique curriculum identification codes
          </p>
        </div>
        <Button id="add-subject-btn" onClick={handleOpenAdd} className="shrink-0 gap-1.5">
          <Plus className="w-4 h-4" />
          <span>Add New Subject</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by name or code..."
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
        data={subjects}
        keyExtractor={(s) => s.id}
        isLoading={isLoading}
        emptyMessage="No subjects cataloged yet."
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
        title="Add Subject to Catalog"
        subtitle="Define course title and unique identification code"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            id="subject-name-input"
            label="Subject / Course Name"
            placeholder="e.g. Advanced Mathematics"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
          <Input
            id="subject-code-input"
            label="Course Code (Unique)"
            placeholder="e.g. MATH101"
            value={formCode}
            onChange={(e) => setFormCode(e.target.value)}
            required
          />
          <div className="space-y-1.5">
            <label htmlFor="subject-syllabus-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Syllabus
            </label>
            <textarea
              id="subject-syllabus-input"
              rows={7}
              placeholder="Enter topics, learning outcomes, and course outline..."
              value={formSyllabus}
              onChange={(e) => setFormSyllabus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button id="submit-subject-btn" type="submit" isLoading={isSubmitting}>
              Add Subject
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Subject"
        subtitle={`Editing ${selectedSubject?.name}`}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Subject / Course Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
          <Input
            label="Course Code"
            value={formCode}
            onChange={(e) => setFormCode(e.target.value)}
            required
          />
          <div className="space-y-1.5">
            <label htmlFor="edit-subject-syllabus-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Syllabus
            </label>
            <textarea
              id="edit-subject-syllabus-input"
              rows={7}
              placeholder="Enter topics, learning outcomes, and course outline..."
              value={formSyllabus}
              onChange={(e) => setFormSyllabus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

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
        title="Delete Subject"
        subtitle="Confirm subject removal"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Are you sure you want to delete{" "}
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {selectedSubject?.name}
            </span>{" "}
            ({selectedSubject?.code})?
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
