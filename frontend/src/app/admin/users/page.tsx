"use client";

import React, { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { User, Class, PagedResponse } from "@/lib/types";
import { useToast } from "@/context/toast-context";
import { Table, Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Plus, Search, Trash2, Edit2, Shield, BookOpen, GraduationCap } from "lucide-react";

export default function AdminUsersPage() {
  const { success, error } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("Student");
  const [formClassId, setFormClassId] = useState("");

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/admin/users?page=${page}&pageSize=10`;
      if (roleFilter) url += `&role=${roleFilter}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const res = await api.get<PagedResponse<User>>(url);
      setUsers(res.data.items);
      setTotalPages(res.data.totalPages);
      setTotalCount(res.data.totalCount);
    } catch {
      error("Failed to load user directory.");
    } finally {
      setIsLoading(false);
    }
  }, [page, roleFilter, searchTerm, error]);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await api.get<PagedResponse<Class>>("/admin/classes?pageSize=100");
      setClasses(res.data.items);
    } catch {
      console.error("Failed to load classes for dropdown");
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleOpenAdd = () => {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("Student");
    setFormClassId(classes.length > 0 ? classes[0].id : "");
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormClassId(user.classId || "");
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/admin/users", {
        name: formName,
        email: formEmail,
        password: formPassword,
        role: formRole,
        classId: formRole === "Student" && formClassId ? formClassId : undefined,
      });
      success(`User ${formName} created successfully.`);
      setIsAddModalOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      error(axiosErr.response?.data?.message || "Failed to create user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      await api.put(`/admin/users/${selectedUser.id}`, {
        name: formName,
        email: formEmail,
        role: formRole,
        classId: formRole === "Student" && formClassId ? formClassId : undefined,
      });
      success(`User ${formName} updated successfully.`);
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      error(axiosErr.response?.data?.message || "Failed to update user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/admin/users/${selectedUser.id}`);
      success("User deleted successfully.");
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch {
      error("Failed to delete user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleIcon = (role: string) => {
    switch (role) {
      case "Admin":
        return <Shield className="w-3.5 h-3.5 mr-1" />;
      case "Teacher":
        return <BookOpen className="w-3.5 h-3.5 mr-1" />;
      case "Student":
        return <GraduationCap className="w-3.5 h-3.5 mr-1" />;
      default:
        return null;
    }
  };

  const columns: Column<User>[] = [
    {
      header: "User Details",
      accessor: (u) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs">
            {u.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{u.name}</p>
            <p className="text-xs text-slate-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: "System Role",
      accessor: (u) => (
        <Badge
          variant={
            u.role === "Admin"
              ? "purple"
              : u.role === "Teacher"
              ? "info"
              : "success"
          }
          className="capitalize inline-flex items-center"
        >
          {roleIcon(u.role)}
          {u.role}
        </Badge>
      ),
    },
    {
      header: "Enrolled Class",
      accessor: (u) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {u.className || "—"}
        </span>
      ),
    },
    {
      header: "Created At",
      accessor: (u) => (
        <span className="text-xs text-slate-500">
          {new Date(u.createdAt).toLocaleDateString(undefined, {
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
      accessor: (u) => (
        <div className="flex items-center justify-end space-x-2">
          <button
            id={`edit-user-${u.id}`}
            onClick={() => handleOpenEdit(u)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Edit User"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            id={`delete-user-${u.id}`}
            onClick={() => handleOpenDelete(u)}
            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-colors"
            title="Delete User"
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
            User Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage administrative staff, teachers, and enrolled student profiles
          </p>
        </div>
        <Button id="add-user-btn" onClick={handleOpenAdd} className="shrink-0 gap-1.5">
          <Plus className="w-4 h-4" />
          <span>Add New User</span>
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        {/* Role Filter Tabs */}
        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          {[
            { label: "All Users", value: "" },
            { label: "Students", value: "Student" },
            { label: "Teachers", value: "Teacher" },
            { label: "Admins", value: "Admin" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setRoleFilter(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                roleFilter === tab.value
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search by name or email..."
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

      {/* Users Table */}
      <Table
        columns={columns}
        data={users}
        keyExtractor={(u) => u.id}
        isLoading={isLoading}
        emptyMessage="No users found matching current filters."
        pagination={{
          page,
          pageSize: 10,
          totalCount,
          totalPages,
          onPageChange: (p) => setPage(p),
        }}
      />

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New User"
        subtitle="Create an account for a student, instructor, or admin"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            id="user-name-input"
            label="Full Name"
            placeholder="e.g. John Doe"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
          <Input
            id="user-email-input"
            label="Email Address"
            type="email"
            placeholder="name@school.com"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            required
          />
          <Input
            id="user-password-input"
            label="Initial Password"
            type="password"
            placeholder="Minimum 6 characters"
            value={formPassword}
            onChange={(e) => setFormPassword(e.target.value)}
            required
          />
          <Select
            id="user-role-select"
            label="Role Assignment"
            value={formRole}
            onChange={(e) => setFormRole(e.target.value)}
            options={[
              { value: "Student", label: "Student" },
              { value: "Teacher", label: "Teacher" },
              { value: "Admin", label: "Administrator" },
            ]}
          />

          {formRole === "Student" && (
            <Select
              id="user-class-select"
              label="Assigned Class (For Students)"
              value={formClassId}
              onChange={(e) => setFormClassId(e.target.value)}
            >
              <option value="">-- Select Class --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.section ? `(${c.section})` : ""}
                </option>
              ))}
            </Select>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button id="submit-user-btn" type="submit" isLoading={isSubmitting}>
              Create User Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User Profile"
        subtitle={`Modify information for ${selectedUser?.name}`}
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <Input
            label="Full Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            required
          />
          <Select
            label="Role Assignment"
            value={formRole}
            onChange={(e) => setFormRole(e.target.value)}
            options={[
              { value: "Student", label: "Student" },
              { value: "Teacher", label: "Teacher" },
              { value: "Admin", label: "Administrator" },
            ]}
          />

          {formRole === "Student" && (
            <Select
              label="Assigned Class (For Students)"
              value={formClassId}
              onChange={(e) => setFormClassId(e.target.value)}
            >
              <option value="">-- No Class Assigned --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.section ? `(${c.section})` : ""}
                </option>
              ))}
            </Select>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete User"
        subtitle="Are you sure you want to remove this user?"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            This action will permanently delete{" "}
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {selectedUser?.name}
            </span>{" "}
            ({selectedUser?.email}). This cannot be undone.
          </p>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteUser}
              isLoading={isSubmitting}
            >
              Confirm Deletion
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
