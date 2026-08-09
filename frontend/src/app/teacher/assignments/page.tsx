"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Assignment, TeachingAssignment, PagedResponse } from "@/lib/types";
import { useToast } from "@/context/toast-context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/Card";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Edit2,
  Trash2,
  Send,
  Calendar,
  Users,
  Eye,
  CheckCircle,
  Clock,
  Sparkles,
} from "lucide-react";

export default function TeacherAssignmentsPage() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [allotments, setAllotments] = useState<TeachingAssignment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<Assignment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    classId: "",
    subjectId: "",
    deadline: "",
    maxMarks: 100,
    allowResubmission: true,
    publishImmediately: true,
  });

  useEffect(() => {
    fetchAllotments();
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [page, search, statusFilter, classFilter]);

  const fetchAllotments = async () => {
    try {
      const res = await api.get<TeachingAssignment[]>("/assignments/my-allotments");
      setAllotments(res.data || []);
    } catch (err) {
      console.error("Failed to load teacher allotments:", err);
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      let query = `/assignments?page=${page}&pageSize=10`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (statusFilter !== "all") query += `&status=${statusFilter}`;
      if (classFilter !== "all") query += `&classId=${classFilter}`;

      const res = await api.get<PagedResponse<Assignment>>(query);
      setAssignments(res.data.items || []);
      setTotalCount(res.data.totalCount || 0);
    } catch (err) {
      console.error("Failed to load assignments:", err);
      showToast("Failed to load coursework tasks", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingAssignment(null);
    // Auto-select first allotment if available
    const firstAllot = allotments[0];
    const defaultDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16);

    setFormData({
      title: "",
      description: "",
      classId: firstAllot ? firstAllot.classId : "",
      subjectId: firstAllot ? firstAllot.subjectId : "",
      deadline: defaultDeadline,
      maxMarks: 100,
      allowResubmission: true,
      publishImmediately: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      classId: assignment.classId,
      subjectId: assignment.subjectId,
      deadline: new Date(assignment.deadline).toISOString().slice(0, 16),
      maxMarks: assignment.maxMarks,
      allowResubmission: assignment.allowResubmission,
      publishImmediately: assignment.status === "Published",
    });
    setIsModalOpen(true);
  };

  const handleClassChange = (selectedClassId: string) => {
    // Filter available subjects for this class from allotments
    const validSubjects = allotments.filter((a) => a.classId === selectedClassId);
    const newSubjectId = validSubjects.length > 0 ? validSubjects[0].subjectId : "";
    setFormData({
      ...formData,
      classId: selectedClassId,
      subjectId: newSubjectId,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.classId || !formData.subjectId || !formData.deadline) {
      showToast("Please complete all required fields", "warning");
      return;
    }

    try {
      setSubmitting(true);
      if (editingAssignment) {
        // Update Assignment
        await api.put(`/assignments/${editingAssignment.id}`, {
          title: formData.title.trim(),
          description: formData.description.trim(),
          deadline: new Date(formData.deadline).toISOString(),
          maxMarks: Number(formData.maxMarks),
          allowResubmission: formData.allowResubmission,
        });
        showToast("Assignment updated successfully!", "success");
      } else {
        // Create Assignment
        await api.post("/assignments", {
          title: formData.title.trim(),
          description: formData.description.trim(),
          classId: formData.classId,
          subjectId: formData.subjectId,
          deadline: new Date(formData.deadline).toISOString(),
          maxMarks: Number(formData.maxMarks),
          allowResubmission: formData.allowResubmission,
          publishImmediately: formData.publishImmediately,
        });
        showToast("New assignment created and ready!", "success");
      }
      setIsModalOpen(false);
      fetchAssignments();
    } catch (err: any) {
      console.error("Save error:", err);
      const msg = err.response?.data?.error || err.response?.data?.[0]?.error || "Failed to save assignment";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await api.patch(`/assignments/${id}/publish`);
      showToast("Assignment published to students!", "success");
      fetchAssignments();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to publish assignment";
      showToast(msg, "error");
    }
  };

  const handleDelete = async () => {
    if (!deletingAssignment) return;
    try {
      setSubmitting(true);
      await api.delete(`/assignments/${deletingAssignment.id}`);
      showToast("Assignment deleted successfully", "success");
      setIsDeleteModalOpen(false);
      fetchAssignments();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to delete assignment";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Unique classes from teacher allotments for dropdowns
  const uniqueAllottedClasses = Array.from(
    new Map(allotments.map((a) => [a.classId, { id: a.classId, name: a.className }])).values()
  );

  // Available subjects for the currently selected class in the modal form
  const availableSubjectsForModal = allotments
    .filter((a) => a.classId === formData.classId)
    .map((a) => ({ id: a.subjectId, name: a.subjectName }));

  const columns = [
    {
      header: "Assignment Details",
      accessor: (a: Assignment) => (
        <div className="space-y-1 py-1">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {a.title}
            </span>
            <Badge variant={a.status === "Published" ? "success" : "neutral"}>
              {a.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-md">
            {a.description || "No instructions provided."}
          </p>
          <div className="flex items-center space-x-3 text-[11px] text-slate-400">
            <span>Max Score: <strong className="text-slate-700 dark:text-slate-300">{a.maxMarks} pts</strong></span>
            <span>•</span>
            <span>Resubmissions: <strong>{a.allowResubmission ? "Allowed" : "Disabled"}</strong></span>
          </div>
        </div>
      ),
    },
    {
      header: "Class & Subject",
      accessor: (a: Assignment) => (
        <div className="space-y-1">
          <Badge variant="info">{a.className}</Badge>
          <div>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {a.subjectName}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Deadline",
      accessor: (a: Assignment) => {
        const isOverdue = new Date(a.deadline) < new Date();
        return (
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date(a.deadline).toLocaleDateString()}</span>
            </div>
            <div className="text-[11px]">
              {isOverdue ? (
                <span className="text-rose-500 font-semibold flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Closed</span>
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {new Date(a.deadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: "Submissions",
      accessor: (a: Assignment) => (
        <Link
          href={`/teacher/submissions?assignmentId=${a.id}`}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <Users className="w-3.5 h-3.5" />
          <span>{a.submissionCount} Submissions</span>
        </Link>
      ),
    },
    {
      header: "Actions",
      accessor: (a: Assignment) => (
        <div className="flex items-center justify-end space-x-1.5">
          {a.status === "Draft" && (
            <Button
              size="sm"
              variant="secondary"
              id={`publish-btn-${a.id}`}
              onClick={() => handlePublish(a.id)}
              className="cursor-pointer text-xs"
              title="Publish to students"
            >
              <Send className="w-3.5 h-3.5 mr-1" /> Publish
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            id={`edit-assignment-btn-${a.id}`}
            onClick={() => handleOpenEditModal(a)}
            className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 cursor-pointer"
            title="Edit Task"
          >
            <Edit2 className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            id={`delete-assignment-btn-${a.id}`}
            onClick={() => {
              setDeletingAssignment(a);
              setIsDeleteModalOpen(true);
            }}
            className="text-slate-600 dark:text-slate-300 hover:text-rose-600 cursor-pointer"
            title="Delete Task"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2.5">
            <FileSpreadsheet className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            <span>Coursework & Assignment Studio</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create, manage deadlines, and publish assignments for your assigned classrooms
          </p>
        </div>

        <Button
          variant="primary"
          id="create-assignment-btn"
          onClick={handleOpenCreateModal}
          className="cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4 mr-2" /> Create Assignment
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <Input
            id="search-assignments-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by assignment title..."
            className="pl-9"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          {/* Class Filter */}
          <Select
            id="filter-class-select"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full md:w-44"
          >
            <option value="all">All Classes</option>
            {uniqueAllottedClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          {/* Status Filter */}
          <Select
            id="filter-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-36"
          >
            <option value="all">All Statuses</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
          </Select>
        </div>
      </div>

      {/* Assignments Table */}
      <DataTable
        columns={columns}
        data={assignments}
        loading={loading}
        page={page}
        pageSize={10}
        totalCount={totalCount}
        onPageChange={setPage}
        emptyState={
          <EmptyState
            icon={FileSpreadsheet}
            title="No Coursework Tasks Found"
            description="Create your first assignment to publish tasks and collect submissions from your students."
            actionLabel="Create Assignment"
            onAction={handleOpenCreateModal}
          />
        }
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAssignment ? "Edit Coursework Task" : "Create New Coursework Task"}
        subtitle={
          editingAssignment
            ? "Update task instructions, deadline, or scoring criteria"
            : "Assign new coursework to your allotted classrooms"
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Input
            id="assignment-title-input"
            label="Assignment Title *"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Midterm Project: Algorithm Design"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Classroom *
              </label>
              <Select
                id="assignment-class-select"
                required
                disabled={!!editingAssignment}
                value={formData.classId}
                onChange={(e) => handleClassChange(e.target.value)}
              >
                <option value="" disabled>
                  Select Class
                </option>
                {uniqueAllottedClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Subject *
              </label>
              <Select
                id="assignment-subject-select"
                required
                disabled={!!editingAssignment}
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              >
                <option value="" disabled>
                  Select Subject
                </option>
                {availableSubjectsForModal.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Instructions & Problem Description
            </label>
            <textarea
              id="assignment-description-input"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide assignment guidelines, submission requirements, and questions..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="assignment-deadline-input"
              type="datetime-local"
              label="Submission Deadline *"
              required
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />

            <Input
              id="assignment-maxmarks-input"
              type="number"
              min="1"
              max="1000"
              label="Maximum Score (Points) *"
              required
              value={formData.maxMarks}
              onChange={(e) => setFormData({ ...formData, maxMarks: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                id="assignment-allow-resubmission"
                checked={formData.allowResubmission}
                onChange={(e) => setFormData({ ...formData, allowResubmission: e.target.checked })}
                className="w-4 h-4 rounded-sm text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Allow students to update/resubmit before the deadline
              </span>
            </label>

            {!editingAssignment && (
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  id="assignment-publish-immediately"
                  checked={formData.publishImmediately}
                  onChange={(e) => setFormData({ ...formData, publishImmediately: e.target.checked })}
                  className="w-4 h-4 rounded-sm text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Publish immediately (students can see and submit immediately)
                </span>
              </label>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              id="save-assignment-btn"
              loading={submitting}
              className="cursor-pointer"
            >
              {editingAssignment ? "Save Changes" : "Create Assignment"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Assignment"
        subtitle="Are you sure you want to delete this coursework task?"
      >
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
            Deleting <strong>{deletingAssignment?.title}</strong> will remove this task and all associated student submissions. This action cannot be undone.
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={submitting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              id="confirm-delete-assignment-btn"
              loading={submitting}
              onClick={handleDelete}
              className="cursor-pointer"
            >
              Yes, Delete Task
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
