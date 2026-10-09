import prisma from '../src/lib/db/prisma';

async function main() {
  const student =
    (await prisma.user.findFirst({ where: { email: 'vedant.nikumbh@vit.edu.in' } })) ||
    (await prisma.user.findFirst({ where: { role: 'student' } }));

  if (!student) {
    console.log('No student found in DB');
    return;
  }

  console.log('Seeding for student:', student.name, student.id);

  // 1. Official University Certificate
  const official = await prisma.certificate.create({
    data: {
      studentId: student.id,
      activityTitle: 'Semester 5 Capstone Mini-Project Distinction Certificate',
      type: 'platform_issued',
      status: 'issued',
      issueDate: new Date('2026-09-15'),
      verificationHash: 'sha256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      externalProvider: 'Vidyalankar Institute of Technology (Autonomous)',
      externalFileUrl: '/certificates/sample-vit-mini-project.pdf',
    },
  });

  // 2. External Self-Reported Certificate
  const external = await prisma.certificate.create({
    data: {
      studentId: student.id,
      activityTitle: 'AWS Certified Cloud Practitioner (CLF-C02)',
      type: 'self_reported',
      status: 'posted',
      issueDate: new Date('2026-08-20'),
      verificationHash: 'aws-cert-7729104-verified',
      externalProvider: 'Amazon Web Services (AWS Training & Certification)',
      externalFileUrl: 'https://www.credly.com/badges/sample-aws-cert',
    },
  });

  console.log('Successfully seeded certificates:', official.id, external.id);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
