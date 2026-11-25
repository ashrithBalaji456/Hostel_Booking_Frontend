import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '../../api/endpoints';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatINR, formatIST } from '../../utils/format';

export function BookingsPage() {
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: ['my-bookings', page],
    queryFn: () => userApi.getMyBookings(page, 10),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">My Bookings</h1>
        <Link to="/search" className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white">
          Book New Stay
        </Link>
      </div>

      {query.isLoading ? (
        <div className="glass-panel h-48 animate-pulse rounded-2xl" />
      ) : query.isError ? (
        <ErrorState message={(query.error as Error).message} onRetry={() => void query.refetch()} />
      ) : query.data?.content.length ? (
        <>
          <div className="space-y-3">
            {query.data.content.map((b) => (
              <Link
                key={b.id}
                to={`/account/bookings/${b.id}`}
                className="glass-panel flex flex-col justify-between gap-3 rounded-2xl p-5 transition hover:border-cyan-500/40 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-cyan-300">{b.bookingReference}</span>
                    <StatusBadge status={b.bookingStatus} />
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">{b.stayType.replace('_', ' ')}</span>
                  </div>
                  <h2 className="mt-1.5 text-base font-semibold text-white">{b.propertyName}</h2>
                  <p className="text-xs text-slate-400">
                    Room {b.roomNumber} · Bed {b.bedNumber} · {formatIST(b.checkIn)} → {formatIST(b.checkOut)}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-lg font-bold text-white">{formatINR(b.totalAmount)}</p>
                  <p className="text-xs text-slate-400">Paid: {formatINR(b.amountPaid)}</p>
                </div>
              </Link>
            ))}
          </div>
          {query.data.totalPages > 1 && (
            <div className="flex justify-center gap-3 pt-2">
              <button type="button" disabled={page <= 0} onClick={() => setPage((p) => p - 1)} className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs disabled:opacity-40">Prev</button>
              <span className="text-xs text-slate-400">Page {page + 1} / {query.data.totalPages}</span>
              <button type="button" disabled={page + 1 >= query.data.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      ) : (
        <div className="glass-panel rounded-2xl p-8 text-center text-sm text-slate-400">
          You have no bookings yet.
        </div>
      )}
    </div>
  );
}
