import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState("Loading...");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    fetch("http://localhost:5000/api/bookings", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const data = await res.json();

        if (res.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        setBookings(data);
        setMessage("");
      })
      .catch(() => {
        setMessage("Failed to load bookings");
      });

  }, [navigate]);

  return (
    <div className="bookings-page">
      <h1>My Bookings</h1>

      {message && <p>{message}</p>}

      <div className="events-grid">
        {bookings.map((booking) => (
          <div className="event-card" key={booking._id}>
            <h2>{booking.event?.title || "Event"}</h2>

            <p><strong>Tickets:</strong> {booking.tickets}</p>

            <p><strong>Status:</strong> {booking.status}</p>

            <p><strong>Location:</strong> {booking.event?.location || "N/A"}</p>

            <p>
              <strong>Booked On:</strong>{" "}
              {new Date(booking.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Bookings;