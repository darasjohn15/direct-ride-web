import './RequestCard.css';

export type RequestStatus = 'pending' | 'accepted' | 'denied' | 'completed';

export type RideRequest = {
  id: number;
  riderName: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  createdAt: string;
  distanceMiles: number;
  estimatedFare: number;
  status: RequestStatus;
};

type RequestCardProps = {
  request: RideRequest;
  onAccept: (id: number) => void;
  onDeny: (id: number) => void;
  onCancel: (id: number) => void;
};

function formatStatusLabel(status: RequestStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function RequestCard({
  request,
  onAccept,
  onDeny,
  onCancel,
}: RequestCardProps) {
  return (
    <article className="request-card">
      <div className="request-card__top">
        <div>
          <p className="request-card__pickup-time">{request.pickupTime}</p>
          <h3 className="request-card__rider">{request.riderName}</h3>
        </div>

        <span className={`request-card__status request-card__status--${request.status}`}>
          {formatStatusLabel(request.status)}
        </span>
      </div>

      <div className="request-card__route">
        <div className="request-card__location-group">
          <p className="request-card__location-label">Pickup</p>
          <p className="request-card__location-value">{request.pickupLocation}</p>
        </div>

        <div className="request-card__location-group">
          <p className="request-card__location-label">Dropoff</p>
          <p className="request-card__location-value">{request.dropoffLocation}</p>
        </div>
      </div>

      <div className="request-card__meta">
        <div className="request-card__meta-item">
          <span className="request-card__meta-label">Distance</span>
          <span className="request-card__meta-value">{request.distanceMiles.toFixed(1)} mi</span>
        </div>

        <div className="request-card__meta-item">
          <span className="request-card__meta-label">Estimated Fare</span>
          <span className="request-card__meta-value">${request.estimatedFare.toFixed(2)}</span>
        </div>
      </div>

      <div className="request-card__actions">
        {request.status === 'pending' && (
          <>
            <button
              type="button"
              className="request-card__button request-card__button--primary"
              onClick={() => onAccept(request.id)}
            >
              Accept
            </button>
            <button
              type="button"
              className="request-card__button request-card__button--danger"
              onClick={() => onDeny(request.id)}
            >
              Deny
            </button>
          </>
        )}

        {request.status === 'accepted' && (
          <button
            type="button"
            className="request-card__button request-card__button--secondary"
            onClick={() => onCancel(request.id)}
          >
            Cancel
          </button>
        )}

        {request.status === 'denied' && (
          <button
            type="button"
            className="request-card__button request-card__button--primary"
            onClick={() => onAccept(request.id)}
          >
            Accept
          </button>
        )}

        {request.status === 'completed' && (
          <div className="request-card__completed-note">Ride completed</div>
        )}
      </div>
    </article>
  );
}