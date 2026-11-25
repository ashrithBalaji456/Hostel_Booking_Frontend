import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ownerApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { formatIST, toIsoUtc } from '../../utils/format';

export function OwnerAvailabilityPage() {
  const { pushToast } = useToast();
  const qc = useQueryClient();
  const [bedId, setBedId] = useState('');
  const [blockType, setBlockType] = useState('MAINTENANCE');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');

  const blocksQuery = useQuery({
    queryKey: ['bed-blocks', bedId],
    queryFn: () => ownerApi.getBlocksForBed(bedId),
    enabled: bedId.length > 20,
  });

  const createBlockMutation = useMutation({
    mutationFn: () =>
      ownerApi.createBlock({
        bedId,
        blockType,
        startTime: toIsoUtc(startTime),
        endTime: toIsoUtc(endTime),
        reason: reason || undefined,
      }),
    onSuccess: () => {
      pushToast('Availability block created', 'success');
      void qc.invalidateQueries({ queryKey: ['bed-blocks', bedId] });
    },
    onError: (e: Error) => pushToast(e.message, 'error'),
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (id: string) => ownerApi.deleteBlock(id),
    onSuccess: () => {
      pushToast('Block removed', 'info');
      void qc.invalidateQueries({ queryKey: ['bed-blocks', bedId] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6">
        <h1 className="text-xl font-bold text-white">Availability Calendar &amp; Date Blocks</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createBlockMutation.mutate();
          }}
          className="mt-4 grid gap-3 sm:grid-cols-2"
        >
          <input required value={bedId} onChange={(e) => setBedId(e.target.value)} placeholder="Bed UUID" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <select value={blockType} onChange={(e) => setBlockType(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white">
            <option value="MAINTENANCE">Maintenance</option>
            <option value="PERSONAL_USE">Personal Use</option>
            <option value="OWNER_BLOCK">Owner Block</option>
          </select>
          <input required type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <input required type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white sm:col-span-2" />
          <button type="submit" disabled={createBlockMutation.isPending} className="rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white sm:col-span-2">
            Block Bed Dates
          </button>
        </form>
      </div>

      {blocksQuery.data && (
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white">Active Blocks for Bed</h2>
          <div className="mt-3 space-y-2">
            {blocksQuery.data.map((blk) => (
              <div key={blk.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs">
                <div>
                  <span className="font-semibold text-amber-300">{blk.blockType}</span>
                  <p className="text-slate-300">{formatIST(blk.startTime)} → {formatIST(blk.endTime)}</p>
                  {blk.reason && <p className="text-slate-400">{blk.reason}</p>}
                </div>
                <button type="button" onClick={() => deleteBlockMutation.mutate(blk.id)} className="rounded-lg bg-rose-600/20 px-3 py-1 text-rose-300">
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
