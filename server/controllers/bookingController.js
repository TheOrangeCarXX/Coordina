const Booking = require("../models/Booking");
const Event = require("../models/Event");

exports.bookEvent = async (req, res) => {
    try {
        const { eventId, tickets } = req.body;

        const event = await Event.findOneAndUpdate(
            {
                _id: eventId,
                availableSeats: { $gte: tickets }
            },
            {
                $inc: { availableSeats: -tickets }
            },
            { returnDocument: "after" }
        );

        if (!event) {
            return res.status(400).json({
                message: "Not enough seats or event not found"
            });
        }

        const booking = await Booking.create({
            user: req.user._id,
            event: eventId,
            tickets,
            status: "pending"
        });

        res.status(201).json({
            message: "Booking successful",
            booking
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error"+err});
    }
};

exports.getBookings = async (req, res) => {
    try {

        // ADMIN
        if (req.user.role === "admin") {

            const bookings = await Booking.find()
                .populate("user", "name email")
                .populate("event", "title date location");

            return res.status(200).json(bookings);
        }

        // USER
        else if (req.user.role === "user") {

            const bookings = await Booking.find({
                user: req.user._id
            }).populate("event", "title date location");

            return res.status(200).json(bookings);
        }

        // EVENT MANAGER
        else if (req.user.role === "eventManager") {

            const events = await Event.find({
                createdBy: req.user._id
            });

            const eventIds = events.map(e => e._id);

            const bookings = await Booking.find({
                event: { $in: eventIds }
            })
            .populate("user", "name email")
            .populate("event", "title date location");

            return res.status(200).json(bookings);
        }

    } catch (err) {
        res.status(500).json({
            message: "Server error"
        });
    }
};

exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        const event = await Event.findById(booking.event);

        // ADMIN
        if (req.user.role === "admin") {
            // allowed
        }

        // USER -> own booking only
        else if (
            req.user.role === "user" &&
            booking.user.toString() === req.user._id.toString()
        ) {
            // allowed
        }

        // EVENT MANAGER -> bookings of own events only
        else if (
            req.user.role === "eventManager" &&
            event.createdBy.toString() === req.user._id.toString()
        ) {
            // allowed
        }

        else {
            return res.status(403).json({
                message: "Not authorized"
            });
        }

        // restore seats
        event.availableSeats += booking.tickets;
        await event.save();

        await booking.deleteOne();

        res.status(200).json({
            message: "Booking deleted successfully"
        });

    } catch (err) {
        res.status(500).json({
            message: "Server error"
        });
    }
};

exports.updateBooking = async (req, res) => {
    try {
        const { tickets } = req.body;

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        const event = await Event.findById(booking.event);

        // AUTHORIZATION
        let allowed = false;

        if (req.user.role === "admin") {
            allowed = true;
        }

        else if (
            req.user.role === "user" &&
            booking.user.toString() === req.user._id.toString()
        ) {
            allowed = true;
        }

        else if (
            req.user.role === "eventManager" &&
            event.createdBy.toString() === req.user._id.toString()
        ) {
            allowed = true;
        }

        if (!allowed) {
            return res.status(403).json({
                message: "Not authorized"
            });
        }

        // seat adjustment
        const diff = tickets - booking.tickets;

        if (diff > 0 && event.availableSeats < diff) {
            return res.status(400).json({
                message: "Not enough seats"
            });
        }

        event.availableSeats -= diff;
        await event.save();

        booking.tickets = tickets;
        await booking.save();

        res.status(200).json({
            message: "Booking updated",
            booking
        });

    } catch (err) {
        res.status(500).json({
            message: "Server error"
        });
    }
};