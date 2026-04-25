const Event = require("../models/Event");

exports.getEvents = async (req, res) => {
    try {
        // console.log(req.body);
        const events = await Event.find();
        res.status(200).json(events);
        // console.log("Current Events:",events);
    } catch (err) {
        res.status(500).json({ error: "Error fetching events" });
    }
};

exports.createEvent = async (req, res) => {
    const { title, description, date, location, totalSeats, availableSeats } = req.body;

    if (!title || !date || !location) {
    return res.status(400).json({ error: "Title, date, and location are required" });
    }

    try {
        const newEvent = new Event({
        title,
        description,
        date,
        location,
        totalSeats,
        availableSeats,
        createdBy: req.user._id 
    });
        const savedEvent = await newEvent.save();
        res.status(201).json(savedEvent);
    } catch (err) {
        res.status(500).json({ error: "Error creating event"+err });
    }
};

exports.updateEvent=async(req,res)=>{
    try{
        const event=await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // ADMIN -> can update any event
        if (req.user.role === "admin") {
            const updatedEvent = await Event.findByIdAndUpdate(
                req.params.id,
                req.body,
                {new: true}
            );
            return res.status(200).json(updatedEvent);
        }

        // EVENT MANAGER -> only own event
        else if (
            req.user.role === "eventManager" &&
            event.createdBy.toString() === req.user._id.toString()
        ) {
            const updatedEvent = await Event.findByIdAndUpdate(
                req.params.id,
                req.body,
                {new: true}
            );
            return res.status(200).json(updatedEvent);
        }

        // OTHERWISE DENY
        else {
            return res.status(403).json({
                message: "Not authorized to update this event"
            });
        }
    } catch (err) {
        res.status(500).json({ error: "Error updating event" });
    }
};


exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        // ADMIN -> delete any event
        if (req.user.role === "admin") {

            await event.deleteOne();

            return res.status(200).json({
                message: "Event deleted successfully"
            });
        }

        // EVENT MANAGER -> delete own event only
        else if (
            req.user.role === "eventManager" &&
            event.createdBy.toString() === req.user._id.toString()
        ) {

            await event.deleteOne();

            return res.status(200).json({
                message: "Event deleted successfully"
            });
        }

        // OTHERWISE DENY
        else {
            return res.status(403).json({
                message: "Not authorized to delete this event"
            });
        }

    } catch (err) {
        res.status(500).json({
            message: "Server error"
        });
    }
};