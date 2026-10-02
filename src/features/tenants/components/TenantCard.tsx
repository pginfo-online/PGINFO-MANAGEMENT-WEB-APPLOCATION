'use client';

import React from 'react';
import Link from 'next/link';
import {
  Phone,
  MessageSquare,
  BedDouble,
  Calendar,
  IndianRupee,
  MoreVertical,
  Eye,
  Edit2,
  UserCheck,
  UserX,
  Trash2,
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

interface TenantCardProps {
  tenant: Tenant;
  propertyId: string;
  onEdit?: (tenant: Tenant) => void;
  onAssignBed?: (tenant: Tenant) => void;
  onVacate?: (tenant: Tenant) => void;
  onDelete?: (tenant: Tenant) => void;
}

export function TenantCard({
  tenant,
  propertyId,
  onEdit,
  onAssignBed,
  onVacate,
  onDelete,
}: TenantCardProps) {
  const roomObj = typeof tenant.room === 'object' ? tenant.room : null;
  const bedObj = typeof tenant.bed === 'object' ? tenant.bed : null;
  const roomNumber = roomObj?.roomNumber || tenant.roomNumber;
  const bedLabel = bedObj?.bedLabel || tenant.bedNumber;
  const rent = tenant.monthlyRent || tenant.rentAmount || 0;
  const moveInDate = tenant.joinDate || tenant.joiningDate || tenant.createdAt;
  const status = (tenant.status || 'pending').toLowerCase();

  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          dot: 'bg-emerald-500',
        };
      case 'notice':
        return {
          label: 'Under Notice',
          bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          dot: 'bg-amber-500',
        };
      case 'pending':
        return {
          label: 'Waiting',
          bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
          dot: 'bg-blue-500',
        };
      case 'vacated':
        return {
          label: 'Vacated',
          bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
          dot: 'bg-rose-500',
        };
      default:
        return {
          label: status.toUpperCase(),
          bg: 'bg-[var(--line)] text-[var(--muted)] border-[var(--line-strong)]',
          dot: 'bg-[var(--muted)]',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const cleanPhone = (tenant.phone || '').replace(/\D/g, '');
  const waPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 sm:p-5 transition-all duration-200 hover:shadow-lg hover:border-emerald-500/30">
      {/* ─── Header: Avatar, Name, Phone + Contact Links, Status Pill ─── */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {tenant.profilePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tenant.profilePhoto}
                alt={tenant.name}
                className="h-11 w-11 rounded-full object-cover border border-[var(--line)] ring-2 ring-emerald-500/10 shrink-0"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 font-bold text-emerald-600 dark:text-emerald-400 text-sm border border-emerald-500/25">
                {getInitials(tenant.name)}
              </div>
            )}

            <div className="min-w-0">
              <Link
                href={`/properties/${propertyId}/tenants/${tenant._id}`}
                className="block font-bold text-[var(--ink)] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate"
              >
                {tenant.name}
              </Link>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-mono text-[var(--muted)]">
                  {formatPhone(tenant.phone)}
                </span>
                {cleanPhone && (
                  <div className="flex items-center gap-1">
                    <a
                      href={`tel:${tenant.phone}`}
                      title="Call resident"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-md text-[var(--muted)] hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                    >
                      <Phone className="h-3 w-3" />
                    </a>
                    <a
                      href={`https://wa.me/${waPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="WhatsApp message"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-md text-[var(--muted)] hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                    >
                      <MessageSquare className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${statusConfig.bg}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
              {statusConfig.label}
            </span>

            {/* Context menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--line)] transition-colors">
                <MoreVertical className="h-4 w-4" />
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

                {onEdit && (
                  <DropdownMenuItem
                    onClick={() => onEdit(tenant)}
                    className="flex items-center gap-2"
                  >
                    <Edit2 className="h-4 w-4 text-[var(--muted)]" />
                    <span>Edit Details</span>
                  </DropdownMenuItem>
                )}

                {onAssignBed && (
                  <DropdownMenuItem
                    onClick={() => onAssignBed(tenant)}
                    className="flex items-center gap-2"
                  >
                    <UserCheck className="h-4 w-4 text-[var(--muted)]" />
                    <span>{bedObj ? 'Change Bed' : 'Assign Bed'}</span>
                  </DropdownMenuItem>
                )}

                {status !== 'vacated' && onVacate && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onVacate(tenant)}
                      className="flex items-center gap-2 text-amber-600 dark:text-amber-400 focus:text-amber-600"
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
                      className="flex items-center gap-2 text-rose-600 dark:text-rose-400 focus:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Record</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ─── Meta Row: Room & Bed, Move-in Date, Monthly Rent ─── */}
        <div className="mt-4 grid grid-cols-3 divide-x divide-[var(--line)] rounded-xl border border-[var(--line)] bg-[var(--card-subtle)] p-2.5 text-center">
          {/* Room & Bed */}
          <div className="px-1.5 flex flex-col items-center justify-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1">
              <BedDouble className="h-3 w-3 text-emerald-500" />
              Room
            </span>
            <span className="mt-0.5 text-xs font-bold text-[var(--ink)] truncate max-w-full">
              {roomNumber ? `R-${roomNumber}` : 'None'}
              {bedLabel ? ` • ${bedLabel}` : ''}
            </span>
          </div>

          {/* Move-in Date */}
          <div className="px-1.5 flex flex-col items-center justify-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1">
              <Calendar className="h-3 w-3 text-blue-500" />
              Move-in
            </span>
            <span className="mt-0.5 text-xs font-semibold text-[var(--ink)] truncate max-w-full">
              {moveInDate ? formatDate(moveInDate) : '—'}
            </span>
          </div>

          {/* Monthly Rent */}
          <div className="px-1.5 flex flex-col items-center justify-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1">
              <IndianRupee className="h-3 w-3 text-emerald-500" />
              Rent
            </span>
            <span className="mt-0.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-full">
              {formatINR(rent)}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Footer Action ─── */}
      <div className="mt-3.5 pt-3 border-t border-[var(--line)] flex items-center justify-between">
        <span className="text-[11px] text-[var(--muted)] capitalize">
          {tenant.profession?.replace(/_/g, ' ') || 'Resident'}
        </span>
        <Link
          href={`/properties/${propertyId}/tenants/${tenant._id}`}
          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
        >
          View Profile &rarr;
        </Link>
      </div>
    </div>
  );
}
