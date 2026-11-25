import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiRequest, ApiClientError, buildQuery, tokenStorage } from '../api/client';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { CustomerOrPublicRoute, ProtectedRoute } from '../components/auth/ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { InteractiveBedSelector } from '../components/property/InteractiveBedSelector';
import { StatusBadge } from '../components/ui/StatusBadge';
import { OwnerPropertiesPage } from '../pages/owner/OwnerPropertiesPage';
import { LandingPage } from '../pages/public/LandingPage';
import type { RoomResponse, PropertyAvailabilityResponse } from '../types/api';

vi.mock('../components/three/SpatialHeroScene', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../components/three/SpatialHeroScene')>();
  return {
    ...actual,
    default: () => <div data-testid="spatial-hero-3d-mock">3D Scene</div>,
  };
});

function renderWithProviders(ui: React.ReactElement, initialRoute = '/') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={[initialRoute]}>{ui}</MemoryRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('Spatial Stay Frontend', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('builds query strings omitting empty values and repeating arrays', () => {
    const qs = buildQuery({ city: 'Bengaluru', empty: '', amenities: ['WIFI', 'AC'], page: 0 });
    expect(qs).toBe('?city=Bengaluru&amenities=WIFI&amenities=AC&page=0');
  });

  it('throws ApiClientError with backend errorCode on conflict response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          message: 'The selected bed is not available',
          errorCode: 'BED_UNAVAILABLE',
          timestamp: '2026-01-01T10:00:00Z',
        }),
      }),
    );

    await expect(apiRequest('/api/v1/bookings', { method: 'POST', body: '{}' })).rejects.toMatchObject({
      name: 'ApiClientError',
      status: 409,
      errorCode: 'BED_UNAVAILABLE',
      message: 'The selected bed is not available',
    });
  });

  it('validates login form fields before calling API', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, '/login');

    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('redirects unauthenticated users from protected routes to /login', () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>Login Screen</div>} />
        <Route element={<ProtectedRoute allowedRoles={['PROPERTY_OWNER']} />}>
          <Route path="/owner" element={<div>Owner Secret</div>} />
        </Route>
      </Routes>,
      '/owner',
    );
    expect(screen.getByText('Login Screen')).toBeInTheDocument();
  });

  it('blocks CUSTOMER role from ADMIN route', () => {
    tokenStorage.setSession({
      accessToken: 'jwt-123',
      refreshToken: 'ref-123',
      expiresInMs: 900000,
      user: {
        id: 'u1',
        fullName: 'Student',
        email: 's@example.com',
        phoneNumber: '9876543210',
        role: 'CUSTOMER',
        emailVerified: true,
      },
    });

    renderWithProviders(
      <Routes>
        <Route path="/" element={<div>Public Home</div>} />
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<div>Admin Console</div>} />
        </Route>
      </Routes>,
      '/admin',
    );

    expect(screen.getByText('Public Home')).toBeInTheDocument();
  });

  it('supports interactive bed selection and switches to accessible list view', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const rooms: RoomResponse[] = [
      {
        id: 'r1',
        propertyId: 'p1',
        roomNumber: '101',
        roomType: 'DOUBLE',
        floor: 1,
        capacity: 2,
        status: 'AVAILABLE',
        nightlyRate: 500,
        beds: [
          { id: 'b1', roomId: 'r1', bedNumber: '101-B1', status: 'AVAILABLE' },
          { id: 'b2', roomId: 'r1', bedNumber: '101-B2', status: 'MAINTENANCE' },
        ],
      },
    ];
    const availability: PropertyAvailabilityResponse = {
      propertyId: 'p1',
      checkIn: '2026-12-01T10:00:00Z',
      checkOut: '2026-12-02T10:00:00Z',
      totalBeds: 2,
      availableBedsCount: 1,
      availableBeds: [
        {
          bedId: 'b1',
          bedNumber: '101-B1',
          roomId: 'r1',
          roomNumber: '101',
          roomType: 'DOUBLE',
          floor: 1,
          nightlyRate: 500,
        },
      ],
    };

    render(
      <InteractiveBedSelector
        rooms={rooms}
        availability={availability}
        selectedBedId={null}
        isLoadingAvailability={false}
        onRefreshAvailability={() => {}}
        onSelectBed={onSelect}
      />,
    );

    const b1Btn = screen.getByRole('button', { name: /Bed 101-B1 in Room 101 - Available/i });
    const b2Btn = screen.getByRole('button', { name: /Bed 101-B2 in Room 101 - Unavailable/i });
    expect(b2Btn).toBeDisabled();

    await user.click(b1Btn);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ bedId: 'b1' }));

    await user.click(screen.getByRole('button', { name: /Accessible List/i }));
    await waitFor(() => {
      expect(screen.getByText(/Room 101 \(DOUBLE\) — Bed 101-B1/i)).toBeInTheDocument();
    });
  });

  it('renders readable status labels alongside color badges', () => {
    render(<StatusBadge status="CONFIRMED" />);
    expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
  });

  it('requests geolocation only on tap, captures accuracy, and requires explicit pin confirmation', async () => {
    const user = userEvent.setup();
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({
        coords: {
          latitude: 12.935211,
          longitude: 77.624481,
          accuracy: 18,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({}),
        },
        timestamp: Date.now(),
        toJSON: () => ({}),
      } as GeolocationPosition);
    });

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    });

    renderWithProviders(<OwnerPropertiesPage />);
    expect(getCurrentPosition).not.toHaveBeenCalled();

    const saveBtn = screen.getByRole('button', { name: /create property/i });
    expect(saveBtn).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /use current location/i }));
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/Captured GPS accuracy: ±18 meters/i)).toBeInTheDocument();
    expect(saveBtn).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /confirm pin location/i }));
    expect(saveBtn).toBeEnabled();
  });

  it('does not hardcode Bengaluru on landing search and validates city/location before searching', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'ok',
          data: { content: [], page: 0, size: 12, totalElements: 0, totalPages: 0 },
          timestamp: '2026-11-25T10:00:00Z',
        }),
      }),
    );

    renderWithProviders(<LandingPage />, '/');
    const cityInput = screen.getByLabelText(/city \/ area/i) as HTMLInputElement;
    expect(cityInput.value).toBe('');

    await user.click(screen.getByRole('button', { name: /search stays/i }));
    expect(await screen.findByText(/enter a city or tap "use my location"/i)).toBeInTheDocument();
  });

  it('isolates PROPERTY_OWNER from customer discovery routes and customer navbar links', () => {
    tokenStorage.setSession({
      accessToken: 'jwt-owner',
      refreshToken: 'ref-owner',
      expiresInMs: 900000,
      user: {
        id: 'o1',
        fullName: 'Owner User',
        email: 'owner@spatialstay.in',
        phoneNumber: '9876543210',
        role: 'PROPERTY_OWNER',
        emailVerified: true,
      },
    });

    renderWithProviders(
      <Routes>
        <Route element={<AppLayout />}>
          <Route element={<CustomerOrPublicRoute />}>
            <Route path="/search" element={<div>Customer Search</div>} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['PROPERTY_OWNER']} />}>
            <Route path="/owner" element={<div>Owner Workspace</div>} />
          </Route>
        </Route>
      </Routes>,
      '/search',
    );

    expect(screen.getByText('Owner Workspace')).toBeInTheDocument();
    expect(screen.queryByText(/emergency stay/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/interview mode/i)).not.toBeInTheDocument();
  });
});
