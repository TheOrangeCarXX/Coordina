const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event"
    },
    qrCode: String,
    isUsed: {
        type: Boolean,
        default: false
    },
    tickets: Number,
        status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
    default: "pending"
    },
    paymentId: String

}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);