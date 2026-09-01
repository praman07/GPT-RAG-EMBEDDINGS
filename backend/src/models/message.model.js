import mongoose from 'mongoose';


const messageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    author: {
        type: String,
        enum: [ 'user', 'ai' ],
        default: 'user',
    },
    content: {
        type: String,
        default: ''
    },
    attachments: [
        {
            type: {
                type: String,
                enum: ['image', 'document'],
                required: true,
            },
            url: { type: String, required: true },
            name: { type: String, required: true },
            mimeType: { type: String, required: true },
            extractedText: { type: String, default: '' },
        }
    ]
}, {
    timestamps: true
});

const Message = mongoose.model('Message', messageSchema);

export default Message;