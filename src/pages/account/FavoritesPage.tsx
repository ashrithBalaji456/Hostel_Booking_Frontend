import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { userApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { ErrorState } from '../../components/ui/ErrorState';

export function FavoritesPage() {
  const { pushToast } = useToast();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['favorites'],
    queryFn: () => userApi.getFavorites(0, 30),
  });

  const removeMutation = useMutation({
    mutationFn: (propertyId: string) => userApi.removeFavorite(propertyId),
    onSuccess: () => {
      pushToast('Removed from favorites', 'info');
      void qc.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: (e: Error) => pushToast(e.message, 'error'),
  });

  if (query.isLoading) return <div className="glass-panel h-48 animate-pulse rounded-2xl" />;
  if (query.isError) return <ErrorState message={(query.error as Error).message} onRetry={() => void query.refetch()} />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Saved Properties</h1>
      {query.data?.content.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {query.data.content.map((fav) => (
            <div key={fav.id} className="glass-panel flex items-center justify-between rounded-2xl p-4">
              <div>
                <Link to={`/properties/${fav.propertyId}`} className="text-base font-semibold text-white hover:text-cyan-300">
                  {fav.propertyName}
                </Link>
                <p className="text-xs text-slate-400">
                  {fav.propertyType} · {fav.locality ? `${fav.locality}, ` : ''}{fav.city}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${fav.propertyName} from favorites`}
                onClick={() => removeMutation.mutate(fav.propertyId)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-rose-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-8 text-center text-sm text-slate-400">No saved properties yet.</div>
      )}
    </div>
  );
}
