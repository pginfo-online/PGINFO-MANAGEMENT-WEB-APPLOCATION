'use client';

import React from 'react';
import Link from 'next/link';
import {
  Phone,
  MessageSquare,
  Eye,
  Edit2,
  UserCheck,
  UserX,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { formatINR, formatDate, formatPhone, getInitials } from '@/lib/utils';
import type { Tenant } from '@/types/tenant';

interface TenantTableProps {
  tenants: Tenant[];
  propertyId: string;
  onEdit?: (tenant: Tenant) => void;
  onAssignBed?: (tenant: Tenant) => void;
  onVacate?: (tenant: Tenant) => void;
  onDelete?: (tenant: Tenant) => void;
}

export function TenantTable({
  tenants,
  propertyId,
  onEdit,
  onAssignBed,
  onVacate,
  onDelete,
}: TenantTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          dot: 'bg-emerald-500',
        };
      case 'notice':
        return {
          label: 'Notice',
          cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          dot: 'bg-amber-500',
        };
      case 'pending':
        return {
          label: 'Waiting',
          cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
          dot: 'bg-blue-500',
        };
      case 'vacated':
        return {
          label: 'Vacated',
          cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
          dot: 'bg-rose-500',
        };
      default:
        return {
          label: status,
          cls: 'bg-[var(--line)] text-[var(--muted)] border-[var(--line-strong)]',
          dot: 'bg-[var(--muted)]',
        };
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-[var(--ink)]">
          <thead className="border-b border-[var(--line)] bg-[var(--card-subtle)] text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            <tr>
              <th className="px-5 py-4">Resident</th>
              <th className="px-5 py-4">Room & Bed</th>
              <th className="px-5 py-4">Monthly Rent</th>
              <th className="px-5 py-4">Security Deposit</th>
              <th className="px-5 py-4">Move-in Date</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {tenants.map((tenant) => {
              const roomObj = typeof tenant.room === 'object' ? tenant.room : null;
              const bedObj = typeof tenant.bed === 'object' ? tenant.bed : null;
              const roomNumber = roomObj?.roomNumber || tenant.roomNumber;
              const bedLabel = bedObj?.bedLabel || tenant.bedNumber;
              const cleanPhone = (tenant.phone || '').replace(/\D/g, '');
              const waPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
              const statusCfg = getStatusBadge(tenant.status || 'pending');

              return (
                <tr
                  key={tenant._id}
                  className="hover:bg-[var(--card-subtle)] transition-colors group"
                >
                  {/* Resident Info */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {tenant.profilePhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={tenant.profilePhoto}
                          alt={tenant.name}
                          className="h-10 w-10 rounded-full object-cover border border-[var(--line)] ring-1 ring-emerald-500/20 shrink-0"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400 text-xs border border-emerald-500/20">
                          {getInitials(tenant.name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link
                          href={`/properties/${propertyId}/tenants/${tenant._id}`}
                          className="font-bold text-[var(--ink)] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate block"
                        >
                          {tenant.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-mono text-[var(--muted)]">
                            {formatPhone(tenant.phone)}
                          </span>
                          {cleanPhone && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <a
                                href={`tel:${tenant.phone}`}
                                title="Call resident"
                                className="p-0.5 rounded text-[var(--muted)] hover:text-emerald-600"
                              >
                                <Phone className="h-3 w-3" />
                              </a>
                              <a
                                href={`https://wa.me/${waPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="WhatsApp"
                                className="p-0.5 rounded text-[var(--muted)] hover:text-emerald-500"
                              >
                                <MessageSquare className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Room & Bed */}
                  <td className="px-5 py-3.5">
                    {roomNumber ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold bg-[var(--line)] text-[var(--ink)] border border-[var(--line-strong)]">
                          Room {roomNumber}
                        </span>
                        {bedLabel && (
                          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {bedLabel}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--muted)] italic">Unallocated</span>
                    )}
                  </td>

                  {/* Monthly Rent */}
                  <td className="px-5 py-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatINR(tenant.monthlyRent || tenant.rentAmount || 0)}
                  </td>

                  {/* Security Deposit */}
                  <td className="px-5 py-3.5 font-mono text-sm text-[var(--ink)]">
                    {formatINR(tenant.securityDeposit || 0)}
                  </td>

                  {/* Move-in Date */}
                  <td className="px-5 py-3.5 text-xs text-[var(--muted)]">
                    {formatDate(tenant.joinDate || tenant.joiningDate)}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${statusCfg.cls}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/properties/${propertyId}/tenants/${tenant._id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                        title="View Full Profile"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>

                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(tenant)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--line)] transition-colors cursor-pointer"
                          title="Edit Tenant"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--line)] transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/properties/${propertyId}/tenants/${tenant._id}`}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4 text-[var(--muted)]" />
                              <span>View Profile</span>
                            </Link>
                          </DropdownMenuItem>

                          {onAssignBed && (
                            <DropdownMenuItem
                              onClick={() => onAssignBed(tenant)}
                              className="flex items-center gap-2"
                            >
                              <UserCheck className="h-4 w-4 text-[var(--muted)]" />
                              <span>{bedObj ? 'Change Bed' : 'Assign Bed'}</span>
                            </DropdownMenuItem>
                          )}

                          {tenant.status !== 'vacated' && onVacate && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onVacate(tenant)}
                                className="flex items-center gap-2 text-amber-600 dark:text-amber-400"
                              >
                                <UserX className="h-4 w-4" />
                                <span>Vacate Resident</span>
                              </DropdownMenuItem>
                            </>
                          )}

                          {onDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onDelete(tenant)}
                                className="flex items-center gap-2 text-rose-600 dark:text-rose-400"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Delete Record</span>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
