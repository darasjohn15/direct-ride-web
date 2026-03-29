import './AvailableDriverCard.css';

export type AvailableDriver = {
  id: number;
  name: string;
  vehicle: string;
  rating: number;
  estimatedArrival: string;
  baseFare: number;
};

type AvailableDriverCardProps = {
  driver: AvailableDriver;
  isSelected: boolean;
  onSelect: (driver: AvailableDriver) => void;
};

export default function AvailableDriverCard({
  driver,
  isSelected,
  onSelect,
}: AvailableDriverCardProps) {
  return (
    <article
      className={
        isSelected
          ? 'available-driver-card available-driver-card--selected'
          : 'available-driver-card'
      }
    >
      <div className="available-driver-card__top">
        <div>
          <h3>{driver.name}</h3>
          <p>{driver.vehicle}</p>
        </div>

        <span className="available-driver-card__rating">{driver.rating.toFixed(1)} ★</span>
      </div>

      <div className="available-driver-card__meta">
        <div className="available-driver-card__meta-item">
          <span className="available-driver-card__meta-label">ETA</span>
          <span className="available-driver-card__meta-value">{driver.estimatedArrival}</span>
        </div>

        <div className="available-driver-card__meta-item">
          <span className="available-driver-card__meta-label">Base Fare</span>
          <span className="available-driver-card__meta-value">${driver.baseFare.toFixed(2)}</span>
        </div>
      </div>

      <button
        type="button"
        className={
          isSelected
            ? 'available-driver-card__button available-driver-card__button--selected'
            : 'available-driver-card__button'
        }
        onClick={() => onSelect(driver)}
      >
        {isSelected ? 'Selected' : 'Select Driver'}
      </button>
    </article>
  );
}