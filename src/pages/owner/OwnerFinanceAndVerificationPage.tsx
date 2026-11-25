import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ownerApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatINR, formatIST } from '../../utils/format';

export function OwnerPayoutsPage() {
  const { pushToast } = useToast();
  const qc = useQueryClient();
  const [amount, setAmount] = useState('');

  const payoutsQuery = useQuery({ queryKey: ['owner-payouts'], queryFn: () => ownerApi.getPayouts(0, 20) });

  const requestMutation = useMutation({
    mutationFn: () => ownerApi.requestPayout(Number(amount)),
    onSuccess: () => {
      pushToast('Payout requested', 'success');
      setAmount('');
      void qc.invalidateQueries({ queryKey: ['owner-payouts'] });
    },
    onError: (e: Error) => pushToast(e.message, 'error'),
  });

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6">
        <h1 className="text-xl font-bold text-white">Request Payout</h1>
        <form onSubmit={(e) => { e.preventDefault(); requestMutation.mutate(); }} className="mt-4 flex flex-wrap gap-3">
          <input required type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Gross Amount ₹" className="rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-white" />
          <button type="submit" disabled={requestMutation.isPending} className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white">
            Request Settlement
          </button>
        </form>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-base font-semibold text-white">Payout History</h2>
        <div className="mt-4 space-y-2">
          {payoutsQuery.data?.content.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm">
              <div>
                <p className="font-semibold text-white">Net Payable: {formatINR(p.netPayable)}</p>
                <p className="text-xs text-slate-400">
                  Gross {formatINR(p.grossAmount)} · Commission {formatINR(p.commissionAmount)} · {formatIST(p.requestedAt)}
                </p>
              </div>
              <StatusBadge status={p.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function OwnerVerificationPage() {
  const { pushToast } = useToast();
  const qc = useQueryClient();
  const [ownerName, setOwnerName] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [documentType, setDocumentType] = useState('AADHAAR_OR_PAN');
  const [documentReference, setDocumentReference] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [propDocRef, setPropDocRef] = useState('');

  const verificationsQuery = useQuery({ queryKey: ['owner-verifications'], queryFn: ownerApi.getVerifications });

  const submitOwnerKyc = useMutation({
    mutationFn: () => ownerApi.submitVerification({ ownerName, contactDetails, documentType, documentReference }),
    onSuccess: () => {
      pushToast('Owner KYC submitted', 'success');
      void qc.invalidateQueries({ queryKey: ['owner-verifications'] });
    },
    onError: (e: Error) => pushToast(e.message, 'error'),
  });

  const submitPropDoc = useMutation({
    mutationFn: () => ownerApi.submitPropertyVerification(propertyId, propDocRef),
    onSuccess: () => pushToast('Property verification document submitted', 'success'),
    onError: (e: Error) => pushToast(e.message, 'error'),
  });

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6">
        <h1 className="text-xl font-bold text-white">Owner KYC Verification</h1>
        <form onSubmit={(e) => { e.preventDefault(); submitOwnerKyc.mutate(); }} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input required value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Owner Legal Name" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <input required value={contactDetails} onChange={(e) => setContactDetails(e.target.value)} placeholder="Contact Phone / Email" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <input required value={documentType} onChange={(e) => setDocumentType(e.target.value)} placeholder="Document Type" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <input required value={documentReference} onChange={(e) => setDocumentReference(e.target.value)} placeholder="Secure Document Reference / URL" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <button type="submit" disabled={submitOwnerKyc.isPending} className="rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white sm:col-span-2">
            Submit Owner KYC
          </button>
        </form>

        <div className="mt-4 space-y-2">
          {verificationsQuery.data?.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs">
              <span>{v.documentType} · {formatIST(v.submittedAt)}</span>
              <StatusBadge status={v.verificationStatus} />
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-base font-semibold text-white">Property Document Submission / Resubmission</h2>
        <form onSubmit={(e) => { e.preventDefault(); submitPropDoc.mutate(); }} className="mt-3 grid gap-3 sm:grid-cols-3">
          <input required value={propertyId} onChange={(e) => setPropertyId(e.target.value)} placeholder="Property UUID" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <input required value={propDocRef} onChange={(e) => setPropDocRef(e.target.value)} placeholder="Ownership / Trade License Ref" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <button type="submit" disabled={submitPropDoc.isPending} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white">
            Submit Property Docs
          </button>
        </form>
      </div>
    </div>
  );
}
