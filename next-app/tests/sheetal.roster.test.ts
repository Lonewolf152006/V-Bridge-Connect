// VBridgeConnect — Dr. Sheetal Patil Cohort (VIT) Auto-Connect & Code Join Tests
// Validates:
// 1. Name to VIT Email resolver for 12 students and Dr. Sheetal Patil.
// 2. Post-login auto-connection to Mini 1, 6, 8 teams and conversations.
// 3. Industry mentor onboarding via unique faculty invite code FAC-SPATIL-2026.

import { describe, it, expect } from 'vitest';
import { nameToVitEmail } from '@/lib/modules/roster/vit-resolver';
import { rosterService } from '@/lib/modules/roster/roster.service';
import prisma from '@/lib/db/prisma';

describe('VIT Name-to-Email Resolver', () => {
  it('correctly maps Dr. Sheetal Patil to sheetal.patil@vit.edu.in', () => {
    const res = nameToVitEmail('Dr. Sheetal Patil');
    expect(res.email).toBe('sheetal.patil@vit.edu.in');
    expect(res.normalizedName).toBe('Sheetal Patil');
  });

  describe('Mini 1 Group Members', () => {
    it('maps 3-word student names omitting middle father name', () => {
      expect(nameToVitEmail('Harshad Prakash Panchal').email).toBe('harshad.panchal@vit.edu.in');
      expect(nameToVitEmail('Aditya Vijay Parmale').email).toBe('aditya.parmale@vit.edu.in');
      expect(nameToVitEmail('Mayur Babu Naik').email).toBe('mayur.naik@vit.edu.in');
      expect(nameToVitEmail('Ritesh Omprakash Yadav').email).toBe('ritesh.yadav@vit.edu.in');
    });
  });

  describe('Mini 6 Group Members', () => {
    it('maps all 4 students to @vit.edu.in', () => {
      expect(nameToVitEmail('Yash Sachin Khanvilkar').email).toBe('yash.khanvilkar@vit.edu.in');
      expect(nameToVitEmail('Paras Rajeev Shah').email).toBe('paras.shah@vit.edu.in');
      expect(nameToVitEmail('Vedant Nilesh Patole').email).toBe('vedant.patole@vit.edu.in');
      expect(nameToVitEmail('Vedant Balvant Nikumbh').email).toBe('vedant.nikumbh@vit.edu.in');
    });
  });

  describe('Mini 8 Group Members', () => {
    it('maps lowercase and mixed-case names correctly', () => {
      expect(nameToVitEmail('Deven vilas sonawane').email).toBe('deven.sonawane@vit.edu.in');
      expect(nameToVitEmail('Kshitij palekar').email).toBe('kshitij.palekar@vit.edu.in');
      expect(nameToVitEmail('Mihtil karambe').email).toBe('mihtil.karambe@vit.edu.in');
      expect(nameToVitEmail('Parth karalkar').email).toBe('parth.karalkar@vit.edu.in');
    });
  });

  it('handles NA and empty inputs gracefully without creating false emails', () => {
    expect(nameToVitEmail('NA').email).toBeNull();
    expect(nameToVitEmail('N/A').email).toBeNull();
    expect(nameToVitEmail('   ').email).toBeNull();
  });
});

describe('Database Cohort State & Faculty Code Joining', () => {
  it('confirms Dr. Sheetal Patil exists with invite code FAC-SPATIL-2026', async () => {
    const sheetal = await prisma.user.findFirst({
      where: { email: 'sheetal.patil@vit.edu.in' },
    });
    expect(sheetal).toBeDefined();
    expect(sheetal?.facultyCode).toBe('FAC-SPATIL-2026');
  });

  it('confirms all 3 teams (Mini-1, Mini-6, Mini-8) are assigned to Dr. Sheetal Patil', async () => {
    const sheetal = await prisma.user.findFirst({
      where: { email: 'sheetal.patil@vit.edu.in' },
    });
    expect(sheetal).toBeDefined();

    const teams = await prisma.team.findMany({
      where: { mentorId: sheetal!.id },
      select: { name: true },
    });

    const teamNames = teams.map((t) => t.name).sort();
    expect(teamNames).toContain('Mini 1');
    expect(teamNames).toContain('Mini 6');
    expect(teamNames).toContain('Mini 8');
  });

  it('confirms 12 pre-assigned student roster invitations are staged in database', async () => {
    const invitations = await prisma.rosterInvitation.findMany({
      where: { facultyMentorEmail: 'sheetal.patil@vit.edu.in' },
    });
    expect(invitations.length).toBe(12);

    const emails = invitations.map((i) => i.email);
    expect(emails).toContain('harshad.panchal@vit.edu.in');
    expect(emails).toContain('yash.khanvilkar@vit.edu.in');
    expect(emails).toContain('deven.sonawane@vit.edu.in');
  });

  it('rejects an invalid faculty invite code with a descriptive error', async () => {
    await expect(
      rosterService.joinCohortWithFacultyCode('random-user-id', 'FAC-UNKNOWN-9999')
    ).rejects.toThrow('Faculty invite code "FAC-UNKNOWN-9999" is invalid or does not exist.');
  });

  it('allows an industry mentor to join all 3 groups using FAC-SPATIL-2026', async () => {
    // 1. Get or create a mock industry mentor user in the database
    const partnerEmail = `test.partner.${Date.now()}@corporate.com`;
    const partner = await prisma.user.create({
      data: {
        email: partnerEmail,
        name: 'TechCorp Lead Mentor',
        role: 'industry_partner',
      },
    });

    // 2. Join using Sheetal Mam's code
    const result = await rosterService.joinCohortWithFacultyCode(
      partner.id,
      'FAC-SPATIL-2026'
    );

    expect(result.success).toBe(true);
    expect(result.facultyName).toBe('Dr. Sheetal Patil');
    expect(result.teamsJoined.length).toBe(3);

    const teamNames = result.teamsJoined.map((t) => t.name);
    expect(teamNames).toContain('Mini 1');
    expect(teamNames).toContain('Mini 6');
    expect(teamNames).toContain('Mini 8');

    // 3. Verify industryMentorId is set on all 3 teams
    const updatedTeams = await prisma.team.findMany({
      where: { industryMentorId: partner.id },
    });
    expect(updatedTeams.length).toBe(3);
  });
});
