"use client";

import React, { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { TeachingAssignment, User, Class, Subject, PagedResponse } from "@/lib/types";
import { useToast } from "@/context/toast-context";
import { Table, Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Plus, Trash2, UserCheck, BookOpen, Building2 } from "lucide-react";

export default function AdminTeachingAssignmentsPage() {
  const { success, error } = useToast();

  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTA, setSelectedTA] = useState<TeachingAssignment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formTeacherId, setFormTeacherId] = useState("");
  const [formClassId, setFormClassId] = useState("");
  const [formSubjectId, setFormSubjectId] = useState("");

  const fetchTeachingAssignments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<PagedResponse<TeachingAssignment>>(
        `/admin/teaching-assignments?page=${page}&pageSize=10`
      );
      setAssignments(res.data.items);
      setTotalPages(res.data.totalPages);
      setTotalCount(res.data.totalCount);
    } catch {
      error("Failed to load teaching assignments.");
    } finally {
      setIsLoading(false);
    }
  }, [page, error]);

  const loadDropdownData = useCallback(async () => {
    try {
      const [tRes, cRes, sRes] = await Promise.all([
        api.get<PagedResponse<User>>("/admin/users?role=Teacher&pageSize=100"),
        api.get<PagedResponse<Class>>("/admin/classes?pageSize=100"),
        api.get<PagedResponse<Subject>>("/admin/subjects?pageSize=100"),
      ]);
      setTeachers(tRes.data.items);
      setClasses(cRes.data.items);
      setSubjects(sRes.data.items);
    } catch (err) {
      console.error("Failed to load allotment options", err);
    }
  }, []);

  useEffect(() => {
    fetchTeachingAssignments();
  }, [fetchTeachingAssignments]);

  useEffect(() => {
    loadDropdownData();
  }, [loadDropdownData]);

  const handleOpenAdd = () => {
    setFormTeacherId(teachers.length > 0 ? teachers[0].id : "");
    setFormClassId(classes.length > 0 ? classes[0].id : "");
    setFormSubjectId(subjects.length > 0 ? subjects[0].id : "");
    setIsAddModalOpen(true);
  };

  const handleOpenDelete = (ta: TeachingAssignment) => {
    setSelectedTA(ta);
    setIsDeleteModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTeacherId || !formClassId || !formSubjectId) {
      error("Please select a teacher, class, and subject.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post("/admin/teaching-assignments", {
        teacherId: formTeacherId,
        classId: formClassId,
        subjectId: formSubjectId,
      });
      success("Teacher successfully assigned to class and subject.");
      setIsAddModalOpen(false);
      fetchTeachingAssignments();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      error(axiosErr.response?.data?.message || "Failed to assign teacher.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTA) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/admin/teaching-assignments/${selectedTA.id}`);
      success("Teaching assignment unassigned successfully.");
      setIsDeleteModalOpen(false);
      fetchTeachingAssignments();
    } catch {
      error("Failed to remove teaching assignment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<TeachingAssignment>[] = [
    {
      header: "Teacher / Instructor",
      accessor: (ta) => (
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100">{ta.teacherName}</p>
            <p className="text-xs text-slate-500">Instructor</p>
          </div>
        </div>
      ),
    },
    {
      header: "Classroom",
      accessor: (ta) => (
        <div className="flex items-center space-x-2">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {ta.className}
          </span>
        </div>
      ),
    },
    {
      header: "Subject Course",
      accessor: (ta) => (
        <div className="flex items-center space-x-2">
          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
          <Badge variant="default">{ta.subjectName}</Badge>
        </div>
      ),
    },
    {
      header: "Allocated Date",
      accessor: (ta) => (
        <span className="text-xs text-slate-500">
          {new Date(ta.createdAt).toLocaleDateString(undefined, {
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
      accessor: (ta) => (
        <div className="flex items-center justify-end">
          <button
            id={`delete-ta-${ta.id}`}
            onClick={() => handleOpenDelete(ta)}
            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-colors"
            title="Unassign Teacher"
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
            Teacher Allotments
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Allocate teachers to specific classrooms and curriculum courses
          </p>
        </div>
        <Button id="add-ta-btn" onClick={handleOpenAdd} className="shrink-0 gap-1.5">
          <Plus className="w-4 h-4" />
          <span>Assign Teacher</span>
        </Button>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={assignments}
        keyExtractor={(ta) => ta.id}
        isLoading={isLoading}
        emptyMessage="No teaching assignments allocated yet."
        pagination={{
          page,
          pageSize: 10,
          totalCount,
          totalPages,
          onPageChange: (p) => setPage(p),
        }}
      />

      {/* Assign Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Assign Teacher to Subject"
        subtitle="Select the instructor, target classroom, and subject"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Select
            id="ta-teacher-select"
            label="Select Teacher"
            value={formTeacherId}
            onChange={(e) => setFormTeacherId(e.target.value)}
            required
          >
            <option value="">-- Choose Teacher --</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.email})
              </option>
            ))}
          </Select>

          <Select
            id="ta-class-select"
            label="Select Class"
            value={formClassId}
            onChange={(e) => setFormClassId(e.target.value)}
            required
          >
            <option value="">-- Choose Class --</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.section ? `(${c.section})` : ""}
              </option>
            ))}
          </Select>

          <Select
            id="ta-subject-select"
            label="Select Subject"
            value={formSubjectId}
            onChange={(e) => setFormSubjectId(e.target.value)}
            required
          >
            <option value="">-- Choose Subject --</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </Select>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button id="submit-ta-btn" type="submit" isLoading={isSubmitting}>
              Confirm Allotment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Unassign Teacher"
        subtitle="Confirm removal of instructor allotment"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Are you sure you want to unassign{" "}
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {selectedTA?.teacherName}
            </span>{" "}
            from teaching{" "}
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {selectedTA?.subjectName}
            </span>{" "}
            in{" "}
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {selectedTA?.className}
            </span>
            ?
          </p>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isSubmitting}>
              Confirm Removal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
