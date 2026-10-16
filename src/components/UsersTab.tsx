import React from 'react';
import { UserCheck, UserPlus, PenSquare, Trash2 } from 'lucide-react';
import { UserAccount } from '../types';

interface UsersTabProps {
  users: UserAccount[];
  onOpenAddUser: () => void;
  onOpenEditUser: (user: UserAccount) => void;
  onDeleteUser: (username: string) => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  users,
  onOpenAddUser,
  onOpenEditUser,
  onDeleteUser
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 font-brand flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              <span>Manajemen Pengguna & Petugas</span>
            </h2>
            <p className="text-xs text-slate-500">
              Kelola akun administrator dan petugas presensi BIMBEL BA
            </p>
          </div>
          <button
            onClick={onOpenAddUser}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengguna Baru</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Nama Pengguna</th>
                <th className="py-2.5 px-3">Username</th>
                <th className="py-2.5 px-3">Peran (Role)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.username} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-bold text-slate-800">{u.nama}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{u.username}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        u.role === 'admin'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        u.status === 'Aktif'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {u.status || 'Aktif'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onOpenEditUser(u)}
                        title="Edit Akun"
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                      >
                        <PenSquare className="w-4 h-4" />
                      </button>
                      {u.username !== 'admin' && (
                        <button
                          onClick={() => onDeleteUser(u.username)}
                          title="Hapus Akun"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
