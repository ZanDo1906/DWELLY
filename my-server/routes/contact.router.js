const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

//Conect to DB
const db = require('../config/db');
db.connect();

//Import Contact model
const Contact = require('../models/Contact');

const buildContactFilter = (contactId) => {
    const filter = {
        $or: [{ Ma_lien_he: contactId }],
    };

    if (mongoose.Types.ObjectId.isValid(contactId)) {
        filter.$or.push({ _id: contactId });
    }

    return filter;
};

const isProcessedContact = (contact) => {
    if (!contact || !contact.Trang_thai) {
        return false;
    }

    return contact.Trang_thai.trim().toLowerCase().includes('đã xử lý');
};

//Define API
router.get("/", (req, res) => {
    res.send("Ok");
});

//get all contacts (2) -> using async await
router.get("/contacts", async (req, res) => {
    try {
        let contacts = await Contact.find({});
        res.json(contacts);
    } catch (err) {
        res.json({ er: err.message });
    }
});

router.patch('/contacts/:id/draft', async (req, res) => {
    try {
        const contactId = req.params.id;
        const replyContent = `${req.body.replyContent || ''}`.trim();
        const contactFilter = buildContactFilter(contactId);

        const existingContact = await Contact.findOne(contactFilter);
        if (!existingContact) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        if (isProcessedContact(existingContact)) {
            return res.status(409).json({ message: 'Contact has already been replied and locked' });
        }

        const updatedContact = await Contact.findOneAndUpdate(
            contactFilter,
            {
                $set: {
                    Noi_dung_tra_loi_nhap: replyContent,
                    Trang_thai: 'Đang lưu nháp',
                },
            },
            { new: true }
        );

        if (!updatedContact) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        return res.json(updatedContact);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

router.patch('/contacts/:id/reply', async (req, res) => {
    try {
        const contactId = req.params.id;
        const replyContent = `${req.body.replyContent || ''}`.trim();
        const contactFilter = buildContactFilter(contactId);

        if (!replyContent) {
            return res.status(400).json({ message: 'Reply content is required' });
        }

        const existingContact = await Contact.findOne(contactFilter);
        if (!existingContact) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        if (isProcessedContact(existingContact)) {
            return res.status(409).json({ message: 'Contact has already been replied and locked' });
        }

        const updatedContact = await Contact.findOneAndUpdate(
            contactFilter,
            {
                $set: {
                    Noi_dung_tra_loi: replyContent,
                    Noi_dung_tra_loi_nhap: '',
                    Trang_thai: 'Đã xử lý',
                },
            },
            { new: true }
        );

        if (!updatedContact) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        return res.json(updatedContact);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

router.delete('/contacts/:id', async (req, res) => {
    try {
        const contactId = req.params.id;
        const deleteResult = await Contact.deleteOne(buildContactFilter(contactId));

        if (!deleteResult.deletedCount) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        return res.json({ status: 'Success' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

module.exports = router;
