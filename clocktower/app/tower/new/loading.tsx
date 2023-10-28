import LoadingSpinner from "@/components/loading/LoadingSpinner";

export default function NewTowerLoadingPage() {
  return (
    <div className="flex flex-col items-center">
      <p>Creating new tower...</p>
      <LoadingSpinner />
    </div>
  )
}