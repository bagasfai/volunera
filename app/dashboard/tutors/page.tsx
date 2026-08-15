import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { listPendingApplications } from '@/lib/admin/dal'

export default async function AdminTutorQueuePage() {
  await requireRole('admin')
  const applications = await listPendingApplications()

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-lg font-medium">Tutor applications awaiting review</h1>
      {applications.length === 0 ? (
        <p>No pending applications.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {applications.map((application) => (
            <li key={application.profile_id}>
              <Link
                href={`/dashboard/tutors/${application.profile_id}`}
                className="underline"
              >
                {application.profiles?.first_name} {application.profiles?.last_name}
              </Link>
              <span className="ml-2 text-sm text-muted-foreground">
                submitted{' '}
                {application.application_submitted_at
                  ? new Date(application.application_submitted_at).toLocaleDateString()
                  : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
