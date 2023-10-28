import LoadingSpinner from "@/components/loading/LoadingSpinner";
import TowerBuildingAnimation from "./components/TowerBuildAnimation";

export default function NewTowerLoadingPage() {
  return (
    <div className="flex flex-col items-center">
      <p>Creating new tower...</p>
      <TowerBuildingAnimation />
    </div>
  )
}