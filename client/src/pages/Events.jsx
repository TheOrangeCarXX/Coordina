import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Events() {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/events")
      .then((res) => res.json())
      .then((data) => setEvents(data));
  }, []);

  const handleBook = async (eventId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    try {
      // STEP 1: Create Booking
      const bookingRes = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId: eventId,
          tickets: 1,
        }),
      });

      const bookingData = await bookingRes.json();

      if (!bookingRes.ok) {
        alert(bookingData.message || "Booking failed");
        return;
      }

      const bookingId = bookingData.booking._id;

      // STEP 2: Create Razorpay Order
      const orderRes = await fetch(
        "http://localhost:5000/api/payment/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingId,
            amount: 500,
          }),
        }
      );

      const order = await orderRes.json();

      // STEP 3: Razorpay Popup
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency,
        name: "Coordina",
        description: "Event Ticket Payment",
        order_id: order.id,

        handler: async function (response) {
          // STEP 4: Verify Payment
          const verifyRes = await fetch(
            "http://localhost:5000/api/payment/verify",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId,
              }),
            }
          );

          const result = await verifyRes.json();

          if (result.success) {
            alert("Payment Successful!");

            if (result.qrCode) {
              const win = window.open();
              win.document.write(
                `<h2>Your Ticket QR Code</h2><img src="${result.qrCode}" />`
              );
            }

          } else {
            alert("Payment Verification Failed");
          }
        },

        theme: {
          color: "#111827",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      alert("Something went wrong");
    }
  };

  return (
    <div className="events-page">
      <h1>Available Events</h1>

      <div className="events-grid">
        {events.map((event) => (
          <div className="event-card" key={event._id}>
            <h2>{event.title}</h2>
            <p>{event.location}</p>
            <p>{new Date(event.date).toLocaleDateString()}</p>
            <p>{event.description}</p>
            <p>Seats: {event.availableSeats}</p>

            <button onClick={() => handleBook(event._id)}>
              Book Now ₹500
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Events;