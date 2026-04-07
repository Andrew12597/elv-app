import { NewProjectForm } from './new-project-form'

export default function NewProjectPage() {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Project</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <NewProjectForm />
      </div>
    </div>
  )
}
