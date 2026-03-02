import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

// Mock supabase before importing the hook
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockOrder = vi.fn();
const mockIn = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
}));

import { useProjectTeamMembers } from './useTeamMembers';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useProjectTeamMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all profiles when projectId is null (fallback)', async () => {
    const allProfiles = [
      { id: 'u1', full_name: 'Alice', email: 'a@test.com' },
      { id: 'u2', full_name: 'Bob', email: 'b@test.com' },
    ];

    mockSelect.mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: allProfiles, error: null }),
    });

    const { result } = renderHook(() => useProjectTeamMembers(null), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(allProfiles);
    expect(mockFrom).toHaveBeenCalledWith('profiles');
  });

  it('does not fetch when projectId is undefined', () => {
    const { result } = renderHook(() => useProjectTeamMembers(undefined), {
      wrapper: createWrapper(),
    });

    // Query should not be enabled
    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('fetches project members + leader when projectId is provided', async () => {
    const projectId = 'proj-1';
    const membersData = [{ user_id: 'u1' }, { user_id: 'u2' }];
    const projectData = { assigned_to: 'u3' };
    const profiles = [
      { id: 'u1', full_name: 'Alice', email: 'a@test.com' },
      { id: 'u2', full_name: 'Bob', email: 'b@test.com' },
      { id: 'u3', full_name: 'Leader', email: 'l@test.com' },
    ];

    // Chain for project_members query
    const membersEq = vi.fn().mockResolvedValue({ data: membersData, error: null });
    const membersSelect = vi.fn().mockReturnValue({ eq: membersEq });

    // Chain for projects query (leader)
    const projectSingle = vi.fn().mockResolvedValue({ data: projectData });
    const projectEq = vi.fn().mockReturnValue({ single: projectSingle });
    const projectSelect = vi.fn().mockReturnValue({ eq: projectEq });

    // Chain for profiles query
    const profilesOrder = vi.fn().mockResolvedValue({ data: profiles, error: null });
    const profilesIn = vi.fn().mockReturnValue({ order: profilesOrder });
    const profilesSelect = vi.fn().mockReturnValue({ in: profilesIn });

    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'project_members') return { select: membersSelect };
      if (table === 'projects') return { select: projectSelect };
      if (table === 'profiles') return { select: profilesSelect };
      return { select: vi.fn() };
    });

    const { result } = renderHook(() => useProjectTeamMembers(projectId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(profiles);
    // Should include leader u3 alongside u1, u2
    expect(profilesIn).toHaveBeenCalledWith('id', ['u1', 'u2', 'u3']);
  });

  it('does not duplicate leader if already in project_members', async () => {
    const projectId = 'proj-1';
    const membersData = [{ user_id: 'u1' }, { user_id: 'u2' }];
    const projectData = { assigned_to: 'u1' }; // leader is already a member
    const profiles = [
      { id: 'u1', full_name: 'Alice', email: 'a@test.com' },
      { id: 'u2', full_name: 'Bob', email: 'b@test.com' },
    ];

    const membersEq = vi.fn().mockResolvedValue({ data: membersData, error: null });
    const membersSelect = vi.fn().mockReturnValue({ eq: membersEq });

    const projectSingle = vi.fn().mockResolvedValue({ data: projectData });
    const projectEq = vi.fn().mockReturnValue({ single: projectSingle });
    const projectSelect = vi.fn().mockReturnValue({ eq: projectEq });

    const profilesOrder = vi.fn().mockResolvedValue({ data: profiles, error: null });
    const profilesIn = vi.fn().mockReturnValue({ order: profilesOrder });
    const profilesSelect = vi.fn().mockReturnValue({ in: profilesIn });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'project_members') return { select: membersSelect };
      if (table === 'projects') return { select: projectSelect };
      if (table === 'profiles') return { select: profilesSelect };
      return { select: vi.fn() };
    });

    const { result } = renderHook(() => useProjectTeamMembers(projectId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // Should NOT include u1 twice
    expect(profilesIn).toHaveBeenCalledWith('id', ['u1', 'u2']);
  });

  it('returns empty array when project has no members and no leader', async () => {
    const projectId = 'proj-1';

    const membersEq = vi.fn().mockResolvedValue({ data: [], error: null });
    const membersSelect = vi.fn().mockReturnValue({ eq: membersEq });

    const projectSingle = vi.fn().mockResolvedValue({ data: { assigned_to: null } });
    const projectEq = vi.fn().mockReturnValue({ single: projectSingle });
    const projectSelect = vi.fn().mockReturnValue({ eq: projectEq });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'project_members') return { select: membersSelect };
      if (table === 'projects') return { select: projectSelect };
      return { select: vi.fn() };
    });

    const { result } = renderHook(() => useProjectTeamMembers(projectId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
