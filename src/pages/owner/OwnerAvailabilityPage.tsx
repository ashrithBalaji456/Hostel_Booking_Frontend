import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ownerApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { SelectDropdown } from '../../components/ui/SelectDropdown';
import { DateTimePicker } from '../../components/ui/DateTimePicker';
import { formatIST, toIsoUtc } from '../../utils/format';

export function OwnerAvailabilityPage() {
  const { pushToast } = useToast();
  const qc = useQueryClient();

  const propertiesQuery = useQuery({
    queryKey: ['owner-properties'],
    queryFn: ownerApi.listProperties,
  });

  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [blockScope, setBlockScope] = useState<'SINGLE_BED' | 'ALL_IN_ROOM'>('SINGLE_BED');
  const [bedId, setBedId] = useState('');
  const [blockType, setBlockType] = useState('MAINTENANCE');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');

  const properties = propertiesQuery.data ?? [];
  const activeProperty = properties.find((p) => p.id === selectedPropertyId) ?? properties[0];
  const rooms = activeProperty?.rooms ?? [];
  const activeRoom = rooms.find((r) => r.id === selectedRoomId) ?? rooms[0];
  const beds = activeRoom?.beds ?? [];

  useEffect(() => {
    if (!selectedPropertyId && properties.length > 0) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  useEffect(() => {
    if (activeProperty && !rooms.some((r) => r.id === selectedRoomId)) {
      setSelectedRoomId(rooms[0]?.id ?? '');
    }
  }, [activeProperty, rooms, selectedRoomId]);

  useEffect(() => {
    if (blockScope === 'SINGLE_BED' && beds.length > 0 && !beds.some((b) => b.id === bedId)) {
      setBedId(beds[0].id);
    }
  }, [blockScope, beds, bedId]);

  const activeBedForBlocks = blockScope === 'ALL_IN_ROOM' ? (beds[0]?.id ?? '') : bedId;

  const blocksQuery = useQuery({
    queryKey: ['bed-blocks', activeBedForBlocks],
    queryFn: () => ownerApi.getBlocksForBed(activeBedForBlocks),
    enabled: activeBedForBlocks.length > 20,
  });

  const createBlockMutation = useMutation({
    mutationFn: async () => {
      if (blockScope === 'ALL_IN_ROOM') {
        if (beds.length === 0) throw new Error('Selected room has no beds to block.');
        return Promise.all(
          beds.map((b) =>
            ownerApi.createBlock({
              bedId: b.id,
              blockType,
              startTime: toIsoUtc(startTime),
              endTime: toIsoUtc(endTime),
              reason: reason || `Room ${activeRoom?.roomNumber ?? ''} maintenance`,
            }),
          ),
        );
      }
      return ownerApi.createBlock({
        bedId,
        blockType,
        startTime: toIsoUtc(startTime),
        endTime: toIsoUtc(endTime),
        reason: reason || undefined,
      });
    },
    onSuccess: () => {
      pushToast(
        blockScope === 'ALL_IN_ROOM'
          ? `Blocked all ${beds.length} beds in Room ${activeRoom?.roomNumber ?? ''}`
          : 'Availability block created',
        'success',
      );
      void qc.invalidateQueries({ queryKey: ['bed-blocks', activeBedForBlocks] });
      void qc.invalidateQueries({ queryKey: ['owner-properties'] });
    },
    onError: (e: Error) => pushToast(e.message, 'error'),
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (id: string) => ownerApi.deleteBlock(id),
    onSuccess: () => {
      pushToast('Block removed', 'info');
      void qc.invalidateQueries({ queryKey: ['bed-blocks', activeBedForBlocks] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6">
        <h1 className="text-xl font-bold text-white">Availability Calendar &amp; Date Blocks</h1>
        <p className="mt-1 text-xs text-slate-400">
          Pick a property, room, and bed (or block an entire room for maintenance) without copying UUIDs.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            createBlockMutation.mutate();
          }}
          className="mt-5 grid gap-4 sm:grid-cols-2"
        >
          <div>
            <label htmlFor="blk-prop" className="mb-1 block text-xs font-medium text-slate-300">Property</label>
            <SelectDropdown
              id="blk-prop"
              ariaLabel="Property"
              value={activeProperty?.id ?? ''}
              placeholder="No properties found"
              onChange={(val) => {
                setSelectedPropertyId(val);
                setSelectedRoomId('');
                setBedId('');
              }}
              options={properties.map((p) => ({
                value: p.id,
                label: `${p.name} · ${p.city}`,
              }))}
            />
          </div>

          <div>
            <label htmlFor="blk-room" className="mb-1 block text-xs font-medium text-slate-300">Room</label>
            <SelectDropdown
              id="blk-room"
              ariaLabel="Room"
              value={activeRoom?.id ?? ''}
              placeholder={rooms.length ? 'Select room' : 'No rooms in property'}
              onChange={(val) => {
                setSelectedRoomId(val);
                setBedId('');
              }}
              options={rooms.map((r) => ({
                value: r.id,
                label: `Room ${r.roomNumber} · ${r.roomType} (${r.beds?.length ?? 0} beds)`,
              }))}
            />
          </div>

          <div>
            <label htmlFor="blk-bed-select" className="mb-1 block text-xs font-medium text-slate-300">
              Bed / Room Maintenance Scope
            </label>
            <SelectDropdown
              id="blk-bed-select"
              ariaLabel="Bed or Room Maintenance Scope"
              value={blockScope === 'ALL_IN_ROOM' ? '__ALL_IN_ROOM__' : bedId}
              placeholder={beds.length ? 'Select bed or entire room' : 'No beds in room'}
              onChange={(val) => {
                if (val === '__ALL_IN_ROOM__') {
                  setBlockScope('ALL_IN_ROOM');
                } else {
                  setBlockScope('SINGLE_BED');
                  setBedId(val);
                }
              }}
              options={[
                ...(activeRoom && beds.length > 0
                  ? [
                      {
                        value: '__ALL_IN_ROOM__',
                        label: `Entire Room ${activeRoom.roomNumber} — All ${beds.length} beds (Room Maintenance)`,
                      },
                    ]
                  : []),
                ...beds.map((b) => ({
                  value: b.id,
                  label: `Bed ${b.bedNumber} (Room ${activeRoom?.roomNumber ?? ''} · ${b.status})`,
                })),
              ]}
            />
          </div>

          <div>
            <label htmlFor="blk-type" className="mb-1 block text-xs font-medium text-slate-300">Block Type</label>
            <SelectDropdown
              id="blk-type"
              ariaLabel="Block Type"
              value={blockType}
              onChange={(val) => setBlockType(val)}
              options={[
                { value: 'MAINTENANCE', label: 'Maintenance' },
                { value: 'PERSONAL_USE', label: 'Personal Use' },
                { value: 'OWNER_BLOCK', label: 'Owner Block' },
              ]}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="blk-bed-uuid" className="mb-1 block text-xs font-medium text-slate-300">
              {blockScope === 'ALL_IN_ROOM' ? 'Blocking Scope (Auto-resolved for all beds in room)' : 'Bed UUID (Auto-filled)'}
            </label>
            <input
              id="blk-bed-uuid"
              required={blockScope === 'SINGLE_BED'}
              disabled={blockScope === 'ALL_IN_ROOM'}
              value={
                blockScope === 'ALL_IN_ROOM'
                  ? `All ${beds.length} beds in Room ${activeRoom?.roomNumber ?? ''}`
                  : bedId
              }
              onChange={(e) => {
                setBlockScope('SINGLE_BED');
                setBedId(e.target.value);
              }}
              placeholder="Auto-filled when you select a bed above"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-70"
            />
          </div>

          <div>
            <label htmlFor="blk-start" className="mb-1 block text-xs font-medium text-slate-300">Start Date &amp; Time</label>
            <DateTimePicker
              id="blk-start"
              ariaLabel="Start Date and Time"
              required
              value={startTime}
              onChange={(val) => setStartTime(val)}
            />
          </div>

          <div>
            <label htmlFor="blk-end" className="mb-1 block text-xs font-medium text-slate-300">End Date &amp; Time</label>
            <DateTimePicker
              id="blk-end"
              ariaLabel="End Date and Time"
              required
              value={endTime}
              onChange={(val) => setEndTime(val)}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="blk-reason" className="mb-1 block text-xs font-medium text-slate-300">Reason (optional)</label>
            <input
              id="blk-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. AC servicing, painting, plumbing maintenance"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            />
          </div>

          <button
            type="submit"
            disabled={createBlockMutation.isPending}
            className="rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50 sm:col-span-2"
          >
            {createBlockMutation.isPending
              ? 'Blocking...'
              : blockScope === 'ALL_IN_ROOM'
              ? `Block Entire Room ${activeRoom?.roomNumber ?? ''} (${beds.length} Beds)`
              : 'Block Bed Dates'}
          </button>
        </form>
      </div>

      {blocksQuery.data && (
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white">
            {blockScope === 'ALL_IN_ROOM'
              ? `Active Blocks (Room ${activeRoom?.roomNumber ?? ''} · Bed ${beds[0]?.bedNumber ?? ''})`
              : 'Active Blocks for Selected Bed'}
          </h2>
          <div className="mt-3 space-y-2">
            {blocksQuery.data.length === 0 ? (
              <p className="text-xs text-slate-400">No active blocks for this bed.</p>
            ) : (
              blocksQuery.data.map((blk) => (
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
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
