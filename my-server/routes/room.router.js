const express = require('express');
const router = express.Router();

//Conect to DB
const db = require('../config/db');
db.connect();

//Import Room model
const Room = require('../models/Room');

//Define API
router.get("/", (req, res) => {
    res.send("Ok");
});

// get next room code
router.get("/rooms/next-code", async (req, res) => {
    try {
        const lastRoom = await Room.findOne({}).sort({ Ma_loai_phong: -1 });
        let newNumber = 1;
        if (lastRoom && lastRoom.Ma_loai_phong) {
            const match = lastRoom.Ma_loai_phong.match(/^(\d+)$/);
            if (match) {
                newNumber = parseInt(match[1], 10) + 1;
            }
        }
        const nextCode = String(newNumber).padStart(2, '0');
        res.json({ nextCode });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// get all rooms
router.get("/rooms", async (req, res) => {
    try {
        const rooms = await Room.find({});
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// get room by Ma_loai_phong
router.get("/rooms/:id", async (req, res) => {
    try {
        const room = await Room.findOne({ Ma_loai_phong: req.params.id });
        if (!room) {
            return res.status(404).json({ message: "Loại phòng không tồn tại" });
        }
        res.json(room);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// create room
router.post("/rooms", async (req, res) => {
    try {
        let { Ma_loai_phong } = req.body;

        if (!Ma_loai_phong || Ma_loai_phong.trim() === '') {
            const lastRoom = await Room.findOne({}).sort({ Ma_loai_phong: -1 });
            let newNumber = 1;
            if (lastRoom && lastRoom.Ma_loai_phong) {
                const match = lastRoom.Ma_loai_phong.match(/^(\d+)$/);
                if (match) {
                    newNumber = parseInt(match[1], 10) + 1;
                }
            }
            Ma_loai_phong = String(newNumber).padStart(2, '0');
            req.body.Ma_loai_phong = Ma_loai_phong;
        }

        const existedRoom = await Room.findOne({ Ma_loai_phong });
        if (existedRoom) {
            return res.status(409).json({ message: "Mã loại phòng đã tồn tại" });
        }

        const room = new Room(req.body);
        const savedRoom = await room.save();
        res.status(201).json(savedRoom);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// update room by Ma_loai_phong
router.patch("/rooms/:id", async (req, res) => {
    try {
        const roomId = req.params.id;
        const updateData = { ...req.body, updatedAt: new Date() };

        if (updateData.Ma_loai_phong && updateData.Ma_loai_phong !== roomId) {
            const existedRoom = await Room.findOne({ Ma_loai_phong: updateData.Ma_loai_phong });
            if (existedRoom) {
                return res.status(409).json({ message: "Mã loại phòng mới đã tồn tại" });
            }
        }

        const updatedRoom = await Room.findOneAndUpdate(
            { Ma_loai_phong: roomId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedRoom) {
            return res.status(404).json({ message: "Loại phòng không tồn tại" });
        }

        res.json(updatedRoom);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// delete room by Ma_loai_phong
router.delete("/rooms/:id", async (req, res) => {
    try {
        const deletedRoom = await Room.findOneAndDelete({ Ma_loai_phong: req.params.id });

        if (!deletedRoom) {
            return res.status(404).json({ message: "Loại phòng không tồn tại" });
        }

        res.json({ message: "Đã xóa loại phòng thành công", room: deletedRoom });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
