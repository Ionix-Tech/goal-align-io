import { describe, it, expect } from 'vitest';

/**
 * Tests the members list building logic used in ProjectExecution.tsx
 * to pass members to TaskManagementPanel/AddTaskDialog.
 *
 * The logic: project.members + project.assignee (leader) if not already present.
 */

interface Member {
  user_id: string;
  user: { full_name: string };
}

interface ProjectMember {
  id: string;
  user: { id: string; full_name: string };
}

interface Assignee {
  id: string;
  full_name: string;
}

function buildMembersList(
  projectMembers: ProjectMember[],
  assignee: Assignee | null
): Member[] {
  const list = projectMembers.map(m => ({
    user_id: m.user.id,
    user: { full_name: m.user.full_name },
  }));
  if (assignee && !list.some(m => m.user_id === assignee.id)) {
    list.unshift({ user_id: assignee.id, user: { full_name: assignee.full_name } });
  }
  return list;
}

describe('buildMembersList (ProjectExecution members logic)', () => {
  it('includes leader when members list is empty', () => {
    const result = buildMembersList([], { id: 'leader-1', full_name: 'João' });
    expect(result).toHaveLength(1);
    expect(result[0].user_id).toBe('leader-1');
    expect(result[0].user.full_name).toBe('João');
  });

  it('includes leader at the beginning when not in members', () => {
    const members: ProjectMember[] = [
      { id: 'pm-1', user: { id: 'user-2', full_name: 'Maria' } },
    ];
    const result = buildMembersList(members, { id: 'leader-1', full_name: 'João' });
    expect(result).toHaveLength(2);
    expect(result[0].user_id).toBe('leader-1');
    expect(result[1].user_id).toBe('user-2');
  });

  it('does not duplicate leader if already in members', () => {
    const members: ProjectMember[] = [
      { id: 'pm-1', user: { id: 'leader-1', full_name: 'João' } },
      { id: 'pm-2', user: { id: 'user-2', full_name: 'Maria' } },
    ];
    const result = buildMembersList(members, { id: 'leader-1', full_name: 'João' });
    expect(result).toHaveLength(2);
    const leaderEntries = result.filter(m => m.user_id === 'leader-1');
    expect(leaderEntries).toHaveLength(1);
  });

  it('returns only members when assignee is null', () => {
    const members: ProjectMember[] = [
      { id: 'pm-1', user: { id: 'user-1', full_name: 'Ana' } },
    ];
    const result = buildMembersList(members, null);
    expect(result).toHaveLength(1);
    expect(result[0].user_id).toBe('user-1');
  });

  it('returns empty list when no members and no assignee', () => {
    const result = buildMembersList([], null);
    expect(result).toHaveLength(0);
  });
});
